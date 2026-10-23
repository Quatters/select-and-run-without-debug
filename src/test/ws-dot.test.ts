import * as assert from "assert";
import * as vscode from "vscode";
import {
  activateExtension,
  COMMAND,
  describeItems,
  LaunchSpy,
  PickerStub,
  TestApi,
} from "./helpers";

// workspace file next to launch.json in the same folder, see issue #6
suite("Workspace file inside its folder with launch.json", () => {
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

  test("lists configurations from both files without duplicates", async () => {
    await vscode.commands.executeCommand(COMMAND);
    assert.deepStrictEqual(describeItems(await picker.items()), [
      "Odoo (workspace)",
      "Odoo Autoreload (workspace)",
      "ORun (ws-dot)",
      "OUpdate (ws-dot)",
    ]);
  });

  test("runs a configuration from launch.json", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("OUpdate", "ws-dot");
    assert.deepStrictEqual(await spy.waitFor(1), [
      { name: "OUpdate", folder: "ws-dot", noDebug: true },
    ]);
  });

  test("runs a configuration from the workspace file", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("Odoo Autoreload", "workspace");
    assert.deepStrictEqual(await spy.waitFor(1), [
      { name: "Odoo Autoreload", folder: undefined, noDebug: true },
    ]);
  });
});
