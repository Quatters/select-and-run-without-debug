import * as vscode from 'vscode';

let quickPick: vscode.QuickPick<vscode.QuickPickItem>;

interface SingleConfig {
    name: string;
    request: 'launch' | 'attach';
    type: string;
    [key: string]: string;
}

interface WorkspaceLaunchConfig {
    workspaceName: string;
    config: vscode.WorkspaceConfiguration;
}

export function getWorkspaceLaunchConfigs() {
    return vscode.workspace.workspaceFolders!.map(w => {
        const config = vscode.workspace.getConfiguration('launch', w.uri);
        return { workspaceName: w.name, config } as WorkspaceLaunchConfig;
    });
}

export function getQuickPickItems({ lastExecutedItems = [] }: { lastExecutedItems: vscode.QuickPickItem[] }) {
    const workspaces = vscode.workspace.workspaceFolders!;
    const isMultiWorkspace = workspaces.length > 1;

    let items = getWorkspaceLaunchConfigs().map(launchConfig => {
        const singleConfigs: SingleConfig[] = launchConfig.config.get('configurations') || [];
        const items = singleConfigs.map((singleConfig) => {
            const item: vscode.QuickPickItem = { label: singleConfig.name };
            if (isMultiWorkspace) {
                item.description = launchConfig.workspaceName;
            }
            return item;
        });
        if (isMultiWorkspace) {
            items.push({ kind: vscode.QuickPickItemKind.Separator, label: '' });
        }
        return items;
    }).flat();

    lastExecutedItems = lastExecutedItems.filter(i => items.map(j => j.label).includes(i.label));
    items = items.filter(i => !lastExecutedItems.map(j => j.label).includes(i.label));

    return lastExecutedItems.concat(items);
}

export function getDebugParams() {
    const item = quickPick.selectedItems[0];
    let workspace = vscode.workspace.workspaceFolders![0];
    if (item.description) {
        workspace = vscode.workspace.workspaceFolders!.find(
            workspace => workspace.name === item.description
        ) as vscode.WorkspaceFolder;
    }
    return { workspace, configName: item.label, options: { noDebug: true } };
}

export function activate(context: vscode.ExtensionContext) {
    quickPick = vscode.window.createQuickPick();
    quickPick.placeholder = 'Select configuration to run without debug';
    quickPick.matchOnDescription = true;

    let lastExecutedItems = context.workspaceState.get<vscode.QuickPickItem[]>('lastExecutedItems', []);

    let disposable = vscode.commands.registerCommand('select-and-run-without-debug.activate', () => {
        quickPick.items = [];
        const workspaces = vscode.workspace.workspaceFolders;

        quickPick.show();

        if (!workspaces) {
            return;
        }

        quickPick.items = getQuickPickItems({ lastExecutedItems });

        quickPick.onDidAccept(() => {
            const { workspace, configName, options } = getDebugParams();
            vscode.debug.startDebugging(workspace, configName, options);
            vscode.DebugConfigurationProviderTriggerKind
            const selectedItem = quickPick.selectedItems[0];
            if (!lastExecutedItems.map(item => item.label).includes(selectedItem.label)) {
                lastExecutedItems.unshift(selectedItem);
            }
            context.workspaceState.update('lastExecutedItems', lastExecutedItems);
            quickPick.hide();
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    if (quickPick) {
        quickPick.dispose();
    }
}
