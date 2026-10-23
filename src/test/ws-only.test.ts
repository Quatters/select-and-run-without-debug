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

// configurations only in the workspace file, folder has no launch.json, see issue #6
suite("Workspace file without launch.json", () => {
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

  test("lists configurations from the workspace file without duplicates", async () => {
    await vscode.commands.executeCommand(COMMAND);
    assert.deepStrictEqual(describeItems(await picker.items()), [
      "Odoo (workspace)",
      "Odoo Autoreload (workspace)",
    ]);
  });

  test("runs a configuration from the workspace file", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("Odoo", "workspace");
    assert.deepStrictEqual(await spy.waitFor(1), [
      { name: "Odoo", folder: undefined, noDebug: true },
    ]);
  });
});
