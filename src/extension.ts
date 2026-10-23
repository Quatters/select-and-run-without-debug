import * as vscode from "vscode";
import { getLaunchConfigs, LaunchConfig } from "./launchConfigs";
import { RecentConfigs } from "./recentConfigs";

interface LaunchConfigItem extends vscode.QuickPickItem {
  config: LaunchConfig;
}

function toItems(configs: LaunchConfig[]): LaunchConfigItem[] {
  const folderCount =
    (vscode.workspace.workspaceFolders?.length ?? 0) + (vscode.workspace.workspaceFile ? 1 : 0);
  return configs.map((config) => ({
    label: config.name,
    description: folderCount > 1 ? (config.folder?.name ?? "workspace") : undefined,
    config,
  }));
}

function separator(label: string): vscode.QuickPickItem {
  return { label, kind: vscode.QuickPickItemKind.Separator };
}

function withSeparators(
  recent: LaunchConfigItem[],
  rest: LaunchConfigItem[],
): (LaunchConfigItem | vscode.QuickPickItem)[] {
  if (recent.length === 0) {
    return rest;
  }
  const other = rest.length > 0 ? [separator("other"), ...rest] : [];
  return [separator("recently used"), ...recent, ...other];
}

function run(config: LaunchConfig): Thenable<boolean> {
  // VS Code looks up names (and so compounds) only in folders' launch.json,
  // configurations from the .code-workspace file have to be passed as is
  const nameOrConfig = config.folder ? config.name : config.raw;
  return vscode.debug.startDebugging(config.folder, nameOrConfig, { noDebug: true });
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
    vscode.commands.registerCommand("select-and-run-without-debug.activate", () => {
      // don't make the caller wait until the user picks something
      selectAndRun(recent).catch(showError);
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
