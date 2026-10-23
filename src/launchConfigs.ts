import * as vscode from "vscode";

/** A configuration or a compound from launch.json or a .code-workspace file. */
export interface LaunchConfig {
  name: string;
  /** undefined for configurations from the .code-workspace file */
  folder: vscode.WorkspaceFolder | undefined;
  /** the configuration or compound as written by the user */
  raw: vscode.DebugConfiguration;
}

type Scope = "workspaceValue" | "workspaceFolderValue";

function readLaunchSection(
  folder: vscode.WorkspaceFolder | undefined,
  scope: Scope,
): LaunchConfig[] {
  const launch = vscode.workspace.getConfiguration("launch", folder?.uri);
  const read = (key: "configurations" | "compounds") => {
    const value = launch.inspect<vscode.DebugConfiguration[]>(key)?.[scope];
    return Array.isArray(value) ? value : [];
  };
  return [...read("configurations"), ...read("compounds")]
    .filter((raw) => typeof raw.name === "string" && raw.presentation?.hidden !== true)
    .map((raw) => ({ name: raw.name, folder, raw }));
}

/** Configurations from the .code-workspace file first, then from each folder. */
export function getLaunchConfigs(): LaunchConfig[] {
  const configs: LaunchConfig[] = [];
  if (vscode.workspace.workspaceFile) {
    configs.push(...readLaunchSection(undefined, "workspaceValue"));
  }
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    configs.push(...readLaunchSection(folder, "workspaceFolderValue"));
  }
  return configs;
}
