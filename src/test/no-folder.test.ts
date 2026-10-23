import * as assert from "assert";
import * as vscode from "vscode";
import { activateExtension, COMMAND, PickerStub } from "./helpers";

suite("No folder opened", () => {
  let picker: PickerStub;

  suiteSetup(async () => {
    await activateExtension();
  });

  setup(() => {
    picker = new PickerStub();
  });

  teardown(() => picker.dispose());

  test("shows an empty list", async () => {
    await vscode.commands.executeCommand(COMMAND);
    assert.deepStrictEqual(await picker.items(), []);
  });
});
