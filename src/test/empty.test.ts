import * as assert from "assert";
import * as vscode from "vscode";
import { activateExtension, COMMAND, CommandSpy, MessageStub, PickerStub } from "./helpers";

suite("Folder without launch configurations", () => {
  let picker: PickerStub;

  suiteSetup(async () => {
    await activateExtension();
  });

  setup(() => {
    picker = new PickerStub();
  });

  teardown(() => picker.dispose());

  test("offers to add a configuration instead of an empty list", async () => {
    const messages = new MessageStub();
    try {
      await vscode.commands.executeCommand(COMMAND);
      assert.deepStrictEqual(await messages.messages(), [
        { message: "No launch configurations found.", items: ["Add Configuration..."] },
      ]);
      assert.strictEqual(picker.isShown, false);
    } finally {
      messages.dispose();
    }
  });

  test("runs the built-in Add Configuration command", async () => {
    const messages = new MessageStub("Add Configuration...");
    const addConfiguration = new CommandSpy("debug.addConfiguration");
    try {
      await vscode.commands.executeCommand(COMMAND);
      assert.strictEqual(await addConfiguration.wasCalled(), true);
    } finally {
      addConfiguration.dispose();
      messages.dispose();
    }
  });
});
