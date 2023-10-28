import * as vscode from 'vscode';

let quickPick: vscode.QuickPick<vscode.QuickPickItem>;

interface DebugConfig extends vscode.DebugConfiguration {
    name: string;
    configFile: vscode.WorkspaceFolder;
}

function populateConfigFile(configs: vscode.DebugConfiguration[], configFile: vscode.WorkspaceFolder): DebugConfig[] {
    return configs.map((config) => {
        config.configFile = configFile;
        return config;
    }) as DebugConfig[];
}

function getDebugConfigs({
    configFile,
    scope,
}: {
    readonly configFile: vscode.WorkspaceFolder;
    scope: 'workspaceValue' | 'workspaceFolderValue';
}): DebugConfig[] {
    const wholeConfiguration = vscode.workspace.getConfiguration(undefined, configFile).inspect('');
    const workspaceValue = (wholeConfiguration?.[scope] as Record<string, unknown>) || {};
    const launchSection = (workspaceValue.launch as Record<string, unknown>) || {};
    return [
        ...populateConfigFile((launchSection?.configurations as vscode.DebugConfiguration[]) || [], configFile),
        ...populateConfigFile((launchSection?.compounds as vscode.DebugConfiguration[]) || [], configFile),
    ];
}

function getAllDebugConfigs({ configFiles }: { configFiles: readonly vscode.WorkspaceFolder[] }): DebugConfig[] {
    let configs: DebugConfig[] = [];

    if (configFiles[0].index === -1) {
        configs = configs.concat(getDebugConfigs({ configFile: configFiles[0], scope: 'workspaceValue' }));
        configFiles = configFiles.slice(1);
    }

    for (const configFile of configFiles) {
        configs = configs.concat(getDebugConfigs({ configFile, scope: 'workspaceFolderValue' }));
    }

    return configs;
}

function getQuickPickItems({
    debugConfigs,
    recentItems = [],
    isMultiWorkspace = false,
}: {
    debugConfigs: DebugConfig[];
    recentItems: vscode.QuickPickItem[];
    isMultiWorkspace: boolean;
}) {
    const items = debugConfigs.map((config) => {
        const item: vscode.QuickPickItem = { label: config.name };
        if (isMultiWorkspace) {
            item.description = config.configFile.name;
        }
        return item;
    });

    const realRecentItems = recentItems.filter((recentItem) =>
        items.find((item) => item.label === recentItem.label && item.description === recentItem.description),
    );

    const restItems = items.filter(
        (item) =>
            !recentItems.find(
                (recentItem) => recentItem.label === item.label && recentItem.description === item.description,
            ),
    );

    return realRecentItems.concat(restItems);
}

function getConfigFiles(): readonly vscode.WorkspaceFolder[] {
    const workspaces = vscode.workspace.workspaceFolders || [];
    const workspaceFile = vscode.workspace.workspaceFile;
    const configFiles: vscode.WorkspaceFolder[] = [...workspaces];

    if (workspaceFile) {
        configFiles.unshift({ name: 'workspace', uri: workspaceFile, index: -1 });
    }

    return configFiles;
}

export function activate(context: vscode.ExtensionContext) {
    let recentItems = context.workspaceState.get<vscode.QuickPickItem[]>('recentItems', []);

    let disposable = vscode.commands.registerCommand('select-and-run-without-debug.activate', () => {
        quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = 'Select configuration to run without debug';
        quickPick.matchOnDescription = true;
        quickPick.items = [];

        quickPick.show();
        quickPick.onDidHide(() => quickPick.dispose());

        const configFiles = getConfigFiles();
        if (configFiles.length <= 0) {
            return;
        }

        const isMultiWorkspace = configFiles.length > 1;
        const debugConfigs = getAllDebugConfigs({ configFiles });
        quickPick.items = getQuickPickItems({ recentItems, debugConfigs, isMultiWorkspace });

        quickPick.onDidAccept(() => {
            const selectedItem = quickPick.selectedItems[0];
            let selectedDebugConfig: DebugConfig | undefined;
            if (isMultiWorkspace) {
                selectedDebugConfig = debugConfigs.find(
                    (config) =>
                        config.name === selectedItem.label && config.configFile.name === selectedItem.description,
                );
            } else {
                selectedDebugConfig = debugConfigs.find((config) => config.name === selectedItem.label);
            }
            if (!selectedDebugConfig) {
                vscode.window.showErrorMessage(`Launch configuration not found.`);
            } else {
                vscode.debug.startDebugging(selectedDebugConfig.configFile, selectedDebugConfig, { noDebug: true });
                recentItems = recentItems.filter((item) => item.label !== selectedItem.label);
                recentItems.unshift(selectedItem);
                context.workspaceState.update('recentItems', recentItems);
            }
            quickPick.hide();
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
