import * as assert from "assert";
import * as vscode from "vscode";
import { activateExtension, COMMAND, EXTENSION_ID, PickerStub } from "./helpers";

// must run before anything else activates the extension
suite("Activation", () => {
  test("activates on the command", async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.strictEqual(extension?.isActive, false);
    const picker = new PickerStub();
    try {
      await vscode.commands.executeCommand(COMMAND);
    } finally {
      picker.dispose();
    }
    assert.strictEqual(extension.isActive, true);
  });
});

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
