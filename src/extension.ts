import * as vscode from "vscode";
import { CompoundError, runCompound } from "./compounds";
import { getLaunchConfigs, LaunchConfig } from "./launchConfigs";
import { RecentConfigs } from "./recentConfigs";

interface LaunchConfigItem extends vscode.QuickPickItem {
  config: LaunchConfig;
}

/** What the picker shows next to a configuration, and what command arguments refer to as "folder". */
function folderLabel(config: LaunchConfig): string {
  if (config.source === "workspace") {
    return "workspace";
  }
  if (config.source === "user") {
    return "user settings";
  }
  return config.folder?.name ?? "";
}

function toItems(configs: LaunchConfig[]): LaunchConfigItem[] {
  const folderCount =
    (vscode.workspace.workspaceFolders?.length ?? 0) + (vscode.workspace.workspaceFile ? 1 : 0);
  return configs.map((config) => ({
    label: config.name,
    description: folderCount > 1 ? folderLabel(config) : undefined,
    config,
  }));
}

function separator(label: string): vscode.QuickPickItem {
  return { label, kind: vscode.QuickPickItemKind.Separator };
}

/** Unlabeled separators between presentation groups, like the built-in picker. */
function withGroupSeparators(
  items: LaunchConfigItem[],
): (LaunchConfigItem | vscode.QuickPickItem)[] {
  return items.flatMap((item, i) =>
    i > 0 && item.config.presentation?.group !== items[i - 1].config.presentation?.group
      ? [separator(""), item]
      : [item],
  );
}

function withSeparators(
  recent: LaunchConfigItem[],
  rest: LaunchConfigItem[],
): (LaunchConfigItem | vscode.QuickPickItem)[] {
  if (recent.length === 0) {
    return withGroupSeparators(rest);
  }
  const other = rest.length > 0 ? [separator("other"), ...withGroupSeparators(rest)] : [];
  return [separator("recently used"), ...recent, ...other];
}

async function run(config: LaunchConfig): Promise<void> {
  // VS Code looks up names (and so compounds) only in folders' launch.json,
  // configurations from the .code-workspace file and user settings have to be passed as is
  if (!config.folder && config.kind === "compound") {
    // passed as is, a compound would be taken for a configuration without a type
    try {
      await runCompound(config, getLaunchConfigs({ includeHidden: true }));
    } catch (error) {
      if (!(error instanceof CompoundError)) {
        throw error;
      }
      vscode.window.showErrorMessage(error.message);
    }
    return;
  }
  const nameOrConfig = config.folder ? config.name : config.raw;
  await vscode.debug.startDebugging(config.folder, nameOrConfig, { noDebug: true });
}

async function showNoConfigs(): Promise<void> {
  if (!vscode.workspace.workspaceFolders?.length) {
    vscode.window.showInformationMessage("Open a folder to run its launch configurations.");
    return;
  }
  const addConfiguration = "Add Configuration...";
  const choice = await vscode.window.showInformationMessage(
    "No launch configurations found.",
    addConfiguration,
  );
  if (choice === addConfiguration) {
    await vscode.commands.executeCommand("debug.addConfiguration");
  }
}

async function selectAndRun(recent: RecentConfigs): Promise<void> {
  const configs = getLaunchConfigs();
  if (configs.length === 0) {
    return showNoConfigs();
  }
  const { recent: recentItems, rest } = recent.split(toItems(configs));
  const picked = await vscode.window.showQuickPick(withSeparators(recentItems, rest), {
    placeHolder: "Select configuration to run without debug",
    matchOnDescription: true,
  });
  if (!picked || !("config" in picked)) {
    return;
  }
  await recent.add(picked);
  await run(picked.config);
}

/** Command arguments, e.g. from a keybinding: "name" or { "name": "...", "folder": "..." }. */
interface RunArgs {
  name: string;
  folder?: string;
}

function parseArgs(arg: unknown): RunArgs | undefined {
  if (typeof arg === "string") {
    return { name: arg };
  }
  if (typeof arg === "object" && arg !== null && "name" in arg && typeof arg.name === "string") {
    const folder = "folder" in arg && typeof arg.folder === "string" ? arg.folder : undefined;
    return { name: arg.name, folder };
  }
  // anything else, e.g. the resource VS Code passes when the command is used in a menu
  return undefined;
}

async function runByName(recent: RecentConfigs, { name, folder }: RunArgs): Promise<void> {
  const matches = toItems(getLaunchConfigs()).filter(
    ({ config }) =>
      config.name === name && (folder === undefined || folderLabel(config) === folder),
  );
  if (matches.length === 0) {
    const where = folder === undefined ? "" : ` in "${folder}"`;
    vscode.window.showErrorMessage(`Launch configuration "${name}"${where} not found.`);
    return;
  }
  if (matches.length > 1) {
    const folders = matches.map(({ config }) => folderLabel(config)).join(", ");
    vscode.window.showErrorMessage(
      `There are several launch configurations named "${name}", add "folder" to the command arguments: ${folders}.`,
    );
    return;
  }
  await recent.add(matches[0]);
  await run(matches[0].config);
}

async function runLast(recent: RecentConfigs): Promise<void> {
  const [last] = recent.split(toItems(getLaunchConfigs())).recent;
  if (!last) {
    // nothing was run yet, or the last configuration was removed
    return selectAndRun(recent);
  }
  await run(last.config);
}

function showError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  vscode.window.showErrorMessage(`Select and Run Without Debug: ${message}`);
}

export function activate(context: vscode.ExtensionContext) {
  const recent = new RecentConfigs(context.workspaceState);

  context.subscriptions.push(
    vscode.commands.registerCommand("select-and-run-without-debug.activate", (arg: unknown) => {
      const args = parseArgs(arg);
      // don't make the caller wait until the user picks something
      (args ? runByName(recent, args) : selectAndRun(recent)).catch(showError);
    }),
    vscode.commands.registerCommand("select-and-run-without-debug.runLast", () => {
      runLast(recent).catch(showError);
    }),
  );

  // used by tests
  return {
    clearRecentItems: () => recent.clear(),
  };
}

export function deactivate() {}
