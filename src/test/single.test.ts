import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension, byName, COMMAND, describeItems, LaunchSpy, PickerStub, TestApi } from './helpers';

suite('Single folder', () => {
    let api: TestApi;
    let spy: LaunchSpy;
    let picker: PickerStub;

    suiteSetup(async () => {
        api = await activateExtension();
        spy = new LaunchSpy();
    });

    suiteTeardown(() => spy.dispose());

    setup(async () => {
        await api.clearRecentItems();
        spy.clear();
        picker = new PickerStub();
    });

    teardown(() => picker.dispose());

    test('registers the command', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes(COMMAND));
    });

    test('lists configurations and compounds from launch.json', async () => {
        await vscode.commands.executeCommand(COMMAND);
        assert.deepStrictEqual(describeItems(await picker.items()), ['First', 'Second', 'Both']);
    });

    test('runs the selected configuration without debugging', async () => {
        await vscode.commands.executeCommand(COMMAND);
        await picker.accept('Second');
        assert.deepStrictEqual(await spy.waitFor(1), [{ name: 'Second', folder: 'single', noDebug: true }]);
    });

    test('runs every configuration of a compound without debugging', async () => {
        await vscode.commands.executeCommand(COMMAND);
        await picker.accept('Both');
        const launches = await spy.waitFor(2);
        assert.deepStrictEqual(launches.sort(byName), [
            { name: 'First', folder: 'single', noDebug: true },
            { name: 'Second', folder: 'single', noDebug: true },
        ]);
    });

    test('moves recently run configurations to the top', async () => {
        await vscode.commands.executeCommand(COMMAND);
        await picker.accept('Second');
        await spy.waitFor(1);

        await vscode.commands.executeCommand(COMMAND);
        assert.deepStrictEqual(describeItems(await picker.items()), ['Second', 'First', 'Both']);
        await picker.accept('First');
        await spy.waitFor(2);

        await vscode.commands.executeCommand(COMMAND);
        assert.deepStrictEqual(describeItems(await picker.items()), ['First', 'Second', 'Both']);
    });
});
