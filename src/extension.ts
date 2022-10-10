import {
    QuickPickItem,
    DebugSessionOptions,
    ExtensionContext,
    QuickPickItemKind,
    QuickInputButton,
    commands,
    workspace,
    window,
    debug,
} from 'vscode';

class LaunchConfigItem implements QuickPickItem {
    label: string;
    kind?: QuickPickItemKind | undefined = undefined;
    description?: string | undefined = undefined;
    detail?: string | undefined = undefined;
    picked?: boolean | undefined = undefined;
    alwaysShow?: boolean | undefined = undefined;
    buttons?: readonly QuickInputButton[] | undefined = undefined;

    constructor(rawLaunchConfig: any) {
        this.label = rawLaunchConfig.name;
    }
}

class DebugOptions implements DebugSessionOptions {
    noDebug?: boolean | undefined = true;
}

export function activate(context: ExtensionContext) {
    let disposable = commands.registerCommand('select-and-run-without-debug.activate', () => {
        let debugConfigs: Object[] = [];
        const workspaceFolders = workspace.workspaceFolders;
        if (workspaceFolders) {
            const config = workspace.getConfiguration('launch', workspaceFolders[0].uri);
            debugConfigs = config.get('configurations') as Object[];
        }
        const qp = window.createQuickPick();
        qp.items = debugConfigs.map(config => new LaunchConfigItem(config));
        qp.canSelectMany = false;

        qp.onDidHide(() => qp.dispose());

        qp.onDidAccept(() => {
            const item = qp.selectedItems[0] as LaunchConfigItem;
            debug.startDebugging(
                // @ts-ignore
                workspaceFolders[0],
                item.label,
                new DebugOptions(),
            );
            qp.hide();
        });

        qp.show();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
