import * as assert from "assert";
import * as vscode from "vscode";
import {
  activateExtension,
  byName,
  COMMAND,
  describeItems,
  LaunchSpy,
  PickerStub,
  sleep,
  TestApi,
} from "./helpers";

// drives the real quick pick UI, for behavior a stub cannot reproduce
suite("Single folder, real picker", () => {
  let api: TestApi;
  let spy: LaunchSpy;

  suiteSetup(async () => {
    api = await activateExtension();
    spy = new LaunchSpy();
  });

  suiteTeardown(() => spy.dispose());

  setup(async () => {
    await api.clearRecentItems();
    spy.clear();
  });

  teardown(() => vscode.commands.executeCommand("workbench.action.closeQuickOpen"));

  test("runs the active item on accept", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await sleep(500);
    await vscode.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem");
    assert.deepStrictEqual(await spy.waitFor(1), [
      { name: "First", folder: "single", noDebug: true },
    ]);
  });

  test("keeps the picker open when the command is run again", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await sleep(500);
    await vscode.commands.executeCommand(COMMAND);
    await sleep(500);
    await vscode.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem");
    assert.deepStrictEqual(await spy.waitFor(1), [
      { name: "First", folder: "single", noDebug: true },
    ]);
  });
});

suite("Single folder", () => {
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

  test("registers the command", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes(COMMAND));
  });

  test("lists configurations and compounds from launch.json", async () => {
    await vscode.commands.executeCommand(COMMAND);
    assert.deepStrictEqual(describeItems(await picker.items()), ["First", "Second", "Both"]);
  });

  test("hides configurations and compounds marked as hidden", async () => {
    await vscode.commands.executeCommand(COMMAND);
    const labels = (await picker.items()).map((item) => item.label);
    assert.ok(!labels.includes("Hidden"), JSON.stringify(labels));
    assert.ok(!labels.includes("Hidden Compound"), JSON.stringify(labels));
  });

  test("runs the selected configuration without debugging", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("Second");
    assert.deepStrictEqual(await spy.waitFor(1), [
      { name: "Second", folder: "single", noDebug: true },
    ]);
  });

  test("ignores accept when nothing is selected", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.acceptNothing();
    assert.deepStrictEqual(await spy.waitFor(1, 500), []);
  });

  test("runs every configuration of a compound without debugging", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("Both");
    const launches = await spy.waitFor(2);
    assert.deepStrictEqual(launches.sort(byName), [
      { name: "First", folder: "single", noDebug: true },
      { name: "Second", folder: "single", noDebug: true },
    ]);
  });

  test("moves recently run configurations to the top", async () => {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept("Second");
    await spy.waitFor(1);

    await vscode.commands.executeCommand(COMMAND);
    assert.deepStrictEqual(describeItems(await picker.items()), [
      "--- recently used ---",
      "Second",
      "--- other ---",
      "First",
      "Both",
    ]);
    await picker.accept("First");
    await spy.waitFor(2);

    await vscode.commands.executeCommand(COMMAND);
    assert.deepStrictEqual(describeItems(await picker.items()), [
      "--- recently used ---",
      "First",
      "Second",
      "--- other ---",
      "Both",
    ]);
  });

  test("has no other separator when everything was run recently", async () => {
    // "Both" is a compound of two configurations, so launches add up to 2, 3 and 4
    for (const [name, launches] of [
      ["Both", 2],
      ["Second", 3],
      ["First", 4],
    ] as const) {
      await vscode.commands.executeCommand(COMMAND);
      await picker.accept(name);
      await spy.waitFor(launches);
    }
    await vscode.commands.executeCommand(COMMAND);
    assert.deepStrictEqual(describeItems(await picker.items()), [
      "--- recently used ---",
      "First",
      "Second",
      "Both",
    ]);
  });
});
