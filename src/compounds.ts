import * as vscode from "vscode";
import { LaunchConfig } from "./launchConfigs";

/**
 * VS Code starts only compounds from a folder's launch.json (microsoft/vscode#109083),
 * so compounds from the .code-workspace file and user settings are started here,
 * following what VS Code does in debugService.startDebugging.
 */

/** A problem with the compound itself, reported to the user as is. */
export class CompoundError extends Error {}

type CompoundEntry = { name: string; folder?: string };

function readEntries(compound: LaunchConfig): CompoundEntry[] {
  const entries: unknown = compound.raw.configurations;
  if (!Array.isArray(entries)) {
    throw new CompoundError(
      `Compound "${compound.name}" must have "configurations" attribute set in order to start multiple configurations.`,
    );
  }
  return entries.flatMap((entry: unknown): CompoundEntry[] => {
    if (typeof entry === "string") {
      return [{ name: entry }];
    }
    if (
      typeof entry === "object" &&
      entry !== null &&
      "name" in entry &&
      typeof entry.name === "string"
    ) {
      const folder =
        "folder" in entry && typeof entry.folder === "string" ? entry.folder : undefined;
      return [{ name: entry.name, folder }];
    }
    return [];
  });
}

function resolveEntry(
  compound: LaunchConfig,
  { name, folder }: CompoundEntry,
  configs: LaunchConfig[],
): LaunchConfig {
  const named = configs.filter((config) => config.kind === "configuration" && config.name === name);
  if (folder !== undefined) {
    const inFolder = named.filter((config) => config.folder?.name === folder);
    if (inFolder.length !== 1) {
      throw new CompoundError(
        `Can not find folder with name "${folder}" for configuration "${name}" in compound "${compound.name}".`,
      );
    }
    return inFolder[0];
  }
  if (named.length === 1) {
    return named[0];
  }
  // several configurations with the name: prefer the one next to the compound
  const own = named.find((config) => config.source === compound.source);
  if (own) {
    return own;
  }
  throw new CompoundError(
    named.length === 0
      ? `Could not find launch configuration "${name}" in the workspace.`
      : `There are multiple launch configurations "${name}" in the workspace. Use folder name to qualify the configuration.`,
  );
}

/** The configurations a compound starts, see "configurations" in launch.json. */
export function resolveCompound(compound: LaunchConfig, configs: LaunchConfig[]): LaunchConfig[] {
  return readEntries(compound)
    .filter((entry) => entry.name !== compound.name)
    .map((entry) => resolveEntry(compound, entry, configs));
}

async function findTask(label: string): Promise<vscode.Task> {
  const tasks = await vscode.tasks.fetchTasks();
  const matches = tasks.filter(
    (task) => task.name === label || `${task.source}: ${task.name}` === label,
  );
  // like VS Code, a compound outside folders looks for the task in the whole workspace
  const task = matches.find((t) => t.scope === vscode.TaskScope.Workspace) ?? matches[0];
  if (!task) {
    throw new CompoundError(`Could not find the task "${label}".`);
  }
  return task;
}

/** Runs the task and resolves with its exit code, or `undefined` when there is none to wait for. */
async function executeTask(task: vscode.Task): Promise<number | undefined> {
  const ends: { execution: vscode.TaskExecution; exitCode: number | undefined }[] = [];
  const disposables = [
    vscode.tasks.onDidEndTaskProcess((e) =>
      ends.push({ execution: e.execution, exitCode: e.exitCode }),
    ),
    // tasks without a process, e.g. custom execution ones, only end
    vscode.tasks.onDidEndTask((e) => ends.push({ execution: e.execution, exitCode: undefined })),
  ];
  try {
    const execution = await vscode.tasks.executeTask(task);
    if (task.isBackground) {
      // an extension can't tell when a background task is ready, so don't wait for it
      return undefined;
    }
    return await new Promise<number | undefined>((resolve) => {
      const check = () => {
        const end = ends.find((e) => e.execution === execution);
        if (end) {
          resolve(end.exitCode);
          return true;
        }
        return false;
      };
      if (!check()) {
        disposables.push(vscode.tasks.onDidEndTaskProcess(check), vscode.tasks.onDidEndTask(check));
      }
    });
  } finally {
    disposables.forEach((d) => d.dispose());
  }
}

/** Runs the compound's preLaunchTask, resolves with whether to start the configurations. */
async function runPreLaunchTask(compound: LaunchConfig): Promise<boolean> {
  const label: unknown = compound.raw.preLaunchTask;
  if (typeof label !== "string") {
    return true;
  }
  const exitCode = await executeTask(await findTask(label));
  if (exitCode === undefined || exitCode === 0) {
    return true;
  }
  const onTaskErrors = vscode.workspace.getConfiguration("debug").get<string>("onTaskErrors");
  if (onTaskErrors === "debugAnyway") {
    return true;
  }
  if (onTaskErrors === "abort") {
    return false;
  }
  const runAnyway = "Run Anyway";
  const showErrors = "Show Errors";
  const choice =
    onTaskErrors === "showErrors"
      ? showErrors
      : await vscode.window.showErrorMessage(
          `The preLaunchTask "${label}" terminated with exit code ${exitCode}.`,
          runAnyway,
          showErrors,
        );
  if (choice === showErrors) {
    await vscode.commands.executeCommand("workbench.actions.view.problems");
  }
  return choice === runAnyway;
}

let nextCompoundId = 0;

/** Stops every session of the compound when one of them stops, see "stopAll" in launch.json. */
function stopAllTogether(marker: string, id: number): vscode.Disposable {
  const sessions = new Set<vscode.DebugSession>();
  const disposables = [
    vscode.debug.onDidStartDebugSession((session) => {
      if (session.configuration[marker] === id) {
        sessions.add(session);
      }
    }),
    vscode.debug.onDidTerminateDebugSession((session) => {
      if (!sessions.delete(session)) {
        return;
      }
      for (const other of sessions) {
        vscode.debug.stopDebugging(other);
      }
      sessions.clear();
      dispose.dispose();
    }),
  ];
  const dispose = new vscode.Disposable(() => disposables.forEach((d) => d.dispose()));
  return dispose;
}

/** Starts a compound from the .code-workspace file or user settings without debugging. */
export async function runCompound(compound: LaunchConfig, configs: LaunchConfig[]): Promise<void> {
  const resolved = resolveCompound(compound, configs);
  if (!(await runPreLaunchTask(compound))) {
    return;
  }
  // marks the sessions of this run, to find them for stopAll
  const marker = "__selectAndRunWithoutDebugCompound";
  const id = nextCompoundId++;
  const stopAll = compound.raw.stopAll === true ? stopAllTogether(marker, id) : undefined;
  const results = await Promise.all(
    resolved.map((config) =>
      vscode.debug.startDebugging(
        config.folder,
        { ...config.raw, [marker]: id },
        { noDebug: true },
      ),
    ),
  );
  if (stopAll && !results.some(Boolean)) {
    // nothing started, nothing to stop
    stopAll.dispose();
  }
}
