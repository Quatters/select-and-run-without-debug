import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('select-and-run-without-debug.activate', () => {
        const qp = vscode.window.createQuickPick();
        qp.items = [];
        qp.placeholder = 'Select configuration to run without debug';
        qp.matchOnDescription = true;
        const workspaces = vscode.workspace.workspaceFolders;

        if (workspaces) {
            const isMultiWorkspace = workspaces.length > 1;
            const workspacesLaunchConfigs = workspaces.map(w => {
                const config = vscode.workspace.getConfiguration('launch', w.uri);
                return { workspaceName: w.name, config };
            });
            qp.items = workspacesLaunchConfigs.map(launchConfig => {
                const singleConfigs = launchConfig.config.get('configurations');
                // @ts-ignore
                const items: vscode.QuickPickItem[] = singleConfigs.map((singleConfig: { name: string }) => {
                    const item: vscode.QuickPickItem = { label: singleConfig.name };
                    if (isMultiWorkspace) {
                        item.description = launchConfig.workspaceName
                    }
                    return item;
                });
                if (isMultiWorkspace) {
                    items.push({ kind: vscode.QuickPickItemKind.Separator, label: '' })
                }
                return items;
            }).flat();

            qp.onDidAccept(() => {
                const item = qp.selectedItems[0];
                let workspace = workspaces[0];
                if (item.description) {
                    workspace = workspaces?.find(
                        workspace => workspace.name === item.description
                    ) as vscode.WorkspaceFolder;
                }
                vscode.debug.startDebugging(
                    workspace,
                    item.label,
                    { noDebug: true },
                );
                qp.hide();
            });
        }

        qp.onDidHide(() => qp.dispose());

        qp.show();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
