import * as vscode from 'vscode';

let quickPick: vscode.QuickPick<vscode.QuickPickItem>;

interface DebugConfig extends vscode.DebugConfiguration {
    name: string;
    configFile: vscode.WorkspaceFolder;
}

function getDebugConfigs({ configFiles }: { configFiles: readonly vscode.WorkspaceFolder[] }): DebugConfig[] {
    let configs: DebugConfig[] = [];

    for (const configFile of configFiles) {
        const launchSection = vscode.workspace.getConfiguration('launch', configFile.uri);
        const launchConfigs = (launchSection.get<DebugConfig[]>('configurations') || []).map((item) => {
            item.configFile = configFile;
            return item;
        });
        const compoundConfigs = (launchSection.get<DebugConfig[]>('compounds') || []).map((item) => {
            item.configFile = configFile;
            return item;
        });
        configs = configs.concat(...launchConfigs, ...compoundConfigs);
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
        const debugConfigs = getDebugConfigs({ configFiles });
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
