import * as assert from "assert";
import * as vscode from "vscode";
import {
  activateExtension,
  byName,
  COMMAND,
  describeItems,
  LaunchSpy,
  PickerStub,
  TestApi,
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
