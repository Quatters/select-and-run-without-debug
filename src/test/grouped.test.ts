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

// sorting and grouping by "presentation" follows the built-in picker
suite("Configurations with presentation", () => {
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

  test("sorts by group and order and separates groups", async () => {
    await vscode.commands.executeCommand(COMMAND);
    assert.deepStrictEqual(describeItems(await picker.items()), [
      "Build Early",
      "Build Late",
      "---",
      "Grouped Compound",
      "Test",
      "---",
      "Ordered Without Group",
      "Plain A",
      "Plain B",
    ]);
  });

  test("keeps groups below recently used configurations", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("Test");
    await spy.waitFor(1);

    await vscode.commands.executeCommand(COMMAND);
    assert.deepStrictEqual(describeItems(await picker.items()), [
      "--- recently used ---",
      "Test",
      "--- other ---",
      "Build Early",
      "Build Late",
      "---",
      "Grouped Compound",
      "---",
      "Ordered Without Group",
      "Plain A",
      "Plain B",
    ]);
  });
});
