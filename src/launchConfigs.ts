import * as vscode from "vscode";

/** Where a configuration is defined: a folder's launch.json, the .code-workspace file or user settings. */
export type LaunchConfigSource = "folder" | "workspace" | "user";

/** A configuration or a compound. */
export interface LaunchConfig {
  name: string;
  source: LaunchConfigSource;
  /** set only for configurations from a folder's launch.json */
  folder: vscode.WorkspaceFolder | undefined;
  /** the configuration or compound as written by the user */
  raw: vscode.DebugConfiguration;
}

const scopes = {
  folder: "workspaceFolderValue",
  workspace: "workspaceValue",
  user: "globalValue",
} as const;

function readLaunchSection(
  source: LaunchConfigSource,
  folder?: vscode.WorkspaceFolder,
): LaunchConfig[] {
  const launch = vscode.workspace.getConfiguration("launch", folder?.uri);
  const read = (key: "configurations" | "compounds") => {
    const value = launch.inspect<vscode.DebugConfiguration[]>(key)?.[scopes[source]];
    return Array.isArray(value) ? value : [];
  };
  return [...read("configurations"), ...read("compounds")]
    .filter((raw) => typeof raw.name === "string" && raw.presentation?.hidden !== true)
    .map((raw) => ({ name: raw.name, source, folder, raw }));
}

/** Configurations from the .code-workspace file, then from each folder, then from user settings. */
export function getLaunchConfigs(): LaunchConfig[] {
  const configs: LaunchConfig[] = [];
  if (vscode.workspace.workspaceFile) {
    configs.push(...readLaunchSection("workspace"));
  }
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    configs.push(...readLaunchSection("folder", folder));
  }
  configs.push(...readLaunchSection("user"));
  return configs;
}
