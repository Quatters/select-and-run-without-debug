import * as assert from "assert";
import * as vscode from "vscode";
import {
  activateExtension,
  byName,
  COMMAND,
  describeItems,
  LaunchSpy,
  MessageStub,
  PickerStub,
  RUN_LAST_COMMAND,
  setUserLaunchConfigs,
  TestApi,
  USER_CONFIG,
} from "./helpers";

suite("Multi-root workspace", () => {
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

  test("lists configurations from the workspace file and every folder", async () => {
    await vscode.commands.executeCommand(COMMAND);
    assert.deepStrictEqual(describeItems(await picker.items()), [
      "WS One (workspace)",
      "WS Two (workspace)",
      "WS Compound (workspace)",
      "Run (alpha)",
      "Alpha Only (alpha)",
      "Alpha Compound (alpha)",
      "Run (beta)",
      "Beta Only (beta)",
    ]);
  });

  test("filters by folder name too", async () => {
    await vscode.commands.executeCommand(COMMAND);
    assert.strictEqual(await picker.matchOnDescription(), true);
  });

  test("runs a same-named configuration from the selected folder", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("Run", "beta");
    assert.deepStrictEqual(await spy.waitFor(1), [{ name: "Run", folder: "beta", noDebug: true }]);
  });

  test("remembers same-named configurations from different folders separately", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("Run", "alpha");
    await spy.waitFor(1);
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("Run", "beta");
    await spy.waitFor(2);

    await vscode.commands.executeCommand(COMMAND);
    assert.deepStrictEqual(describeItems(await picker.items()), [
      "--- recently used ---",
      "Run (beta)",
      "Run (alpha)",
      "--- other ---",
      "WS One (workspace)",
      "WS Two (workspace)",
      "WS Compound (workspace)",
      "Alpha Only (alpha)",
      "Alpha Compound (alpha)",
      "Beta Only (beta)",
    ]);
  });

  test("runs the last configuration from the same folder again", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("Run", "beta");
    await spy.waitFor(1);

    await vscode.commands.executeCommand(RUN_LAST_COMMAND);
    assert.deepStrictEqual(await spy.waitFor(2), [
      { name: "Run", folder: "beta", noDebug: true },
      { name: "Run", folder: "beta", noDebug: true },
    ]);
  });

  test("runs a configuration from the folder given in the command arguments", async () => {
    await vscode.commands.executeCommand(COMMAND, { name: "Run", folder: "beta" });
    assert.deepStrictEqual(await spy.waitFor(1), [{ name: "Run", folder: "beta", noDebug: true }]);
  });

  test("runs a configuration from the workspace file given in the command arguments", async () => {
    await vscode.commands.executeCommand(COMMAND, { name: "WS One", folder: "workspace" });
    assert.deepStrictEqual(await spy.waitFor(1), [
      { name: "WS One", folder: undefined, noDebug: true },
    ]);
  });

  test("asks for a folder when the name in the command arguments is ambiguous", async () => {
    const errors = new MessageStub(undefined, "showErrorMessage");
    try {
      await vscode.commands.executeCommand(COMMAND, "Run");
      assert.deepStrictEqual(await errors.messages(), [
        {
          message:
            'There are several launch configurations named "Run", add "folder" to the command arguments: alpha, beta.',
          items: [],
        },
      ]);
      assert.deepStrictEqual(await spy.waitFor(1, 500), []);
    } finally {
      errors.dispose();
    }
  });

  test("lists configurations from user settings last", async () => {
    await setUserLaunchConfigs([USER_CONFIG]);
    try {
      await vscode.commands.executeCommand(COMMAND);
      const items = describeItems(await picker.items());
      assert.strictEqual(items.at(-1), "User One (user settings)", JSON.stringify(items));
    } finally {
      await setUserLaunchConfigs(undefined);
    }
  });

  test("runs a configuration from user settings", async () => {
    await setUserLaunchConfigs([USER_CONFIG]);
    try {
      await vscode.commands.executeCommand(COMMAND);
      await picker.accept("User One", "user settings");
      assert.deepStrictEqual(await spy.waitFor(1), [
        { name: "User One", folder: undefined, noDebug: true },
      ]);
    } finally {
      await setUserLaunchConfigs(undefined);
    }
  });

  test("runs a configuration from user settings given in the command arguments", async () => {
    await setUserLaunchConfigs([USER_CONFIG]);
    try {
      await vscode.commands.executeCommand(COMMAND, { name: "User One", folder: "user settings" });
      assert.deepStrictEqual(await spy.waitFor(1), [
        { name: "User One", folder: undefined, noDebug: true },
      ]);
    } finally {
      await setUserLaunchConfigs(undefined);
    }
  });

  test("runs a configuration from the workspace file", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("WS One", "workspace");
    assert.deepStrictEqual(await spy.waitFor(1), [
      { name: "WS One", folder: undefined, noDebug: true },
    ]);
  });

  test("runs a compound from a folder", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("Alpha Compound", "alpha");
    const launches = await spy.waitFor(2);
    assert.deepStrictEqual(launches.sort(byName), [
      { name: "Alpha Only", folder: "alpha", noDebug: true },
      { name: "Run", folder: "alpha", noDebug: true },
    ]);
  });

  // known issue: VS Code API cannot start compounds defined outside of folders
  test.skip("runs a compound from the workspace file", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("WS Compound", "workspace");
    const launches = await spy.waitFor(2);
    assert.deepStrictEqual(launches.sort(byName), [
      { name: "WS One", folder: undefined, noDebug: true },
      { name: "WS Two", folder: undefined, noDebug: true },
    ]);
  });
});
