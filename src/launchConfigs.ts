import * as vscode from "vscode";

/** Where a configuration is defined: a folder's launch.json, the .code-workspace file or user settings. */
export type LaunchConfigSource = "folder" | "workspace" | "user";

/** The "presentation" attribute of a configuration or a compound. */
export interface Presentation {
  group?: string;
  order?: number;
  hidden?: boolean;
}

/** A configuration or a compound. */
export interface LaunchConfig {
  name: string;
  kind: "configuration" | "compound";
  source: LaunchConfigSource;
  /** set only for configurations from a folder's launch.json */
  folder: vscode.WorkspaceFolder | undefined;
  presentation: Presentation | undefined;
  /** the configuration or compound as written by the user */
  raw: vscode.DebugConfiguration;
}

const scopes = {
  folder: "workspaceFolderValue",
  workspace: "workspaceValue",
  user: "globalValue",
} as const;

function readPresentation(raw: vscode.DebugConfiguration): Presentation | undefined {
  const value: unknown = raw.presentation;
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  return {
    group: "group" in value && typeof value.group === "string" ? value.group : undefined,
    order: "order" in value && typeof value.order === "number" ? value.order : undefined,
    hidden: "hidden" in value && value.hidden === true,
  };
}

function readLaunchSection(
  source: LaunchConfigSource,
  folder?: vscode.WorkspaceFolder,
): LaunchConfig[] {
  const launch = vscode.workspace.getConfiguration("launch", folder?.uri);
  const read = (key: "configurations" | "compounds", kind: LaunchConfig["kind"]) => {
    const value = launch.inspect<vscode.DebugConfiguration[]>(key)?.[scopes[source]];
    return (Array.isArray(value) ? value : [])
      .filter((raw) => typeof raw.name === "string")
      .map((raw) => ({
        name: raw.name,
        kind,
        source,
        folder,
        presentation: readPresentation(raw),
        raw,
      }));
  };
  return [...read("configurations", "configuration"), ...read("compounds", "compound")];
}

function compareOrders(a: number | undefined, b: number | undefined): number {
  if (a === undefined) {
    return b === undefined ? 0 : 1;
  }
  return b === undefined ? -1 : a - b;
}

/** The same order as the built-in picker: by group, then by order, configurations without presentation last. */
function byPresentation(a: LaunchConfig, b: LaunchConfig): number {
  const [first, second] = [a.presentation, b.presentation];
  if (!first || !second) {
    return Number(!first) - Number(!second);
  }
  if (!first.group || !second.group) {
    return first.group === second.group
      ? compareOrders(first.order, second.order)
      : Number(!first.group) - Number(!second.group);
  }
  if (first.group !== second.group) {
    return first.group.localeCompare(second.group);
  }
  return compareOrders(first.order, second.order);
}

/**
 * Configurations from each folder, then from the .code-workspace file, then from user settings,
 * sorted by presentation like the built-in picker. Hidden ones are left out unless asked for:
 * compounds may refer to them.
 */
export function getLaunchConfigs({ includeHidden = false } = {}): LaunchConfig[] {
  const configs: LaunchConfig[] = [];
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    configs.push(...readLaunchSection("folder", folder));
  }
  if (vscode.workspace.workspaceFile) {
    configs.push(...readLaunchSection("workspace"));
  }
  configs.push(...readLaunchSection("user"));
  return configs
    .filter((config) => includeHidden || !config.presentation?.hidden)
    .sort(byPresentation);
}
