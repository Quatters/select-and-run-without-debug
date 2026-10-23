import * as assert from "assert";
import * as vscode from "vscode";
import {
  activateExtension,
  byName,
  COMMAND,
  LaunchSpy,
  MessageStub,
  PickerStub,
  setUserLaunchConfigs,
  TestApi,
  USER_CONFIG,
  waitUntil,
} from "./helpers";

// VS Code can start only compounds from launch.json, the extension starts the others itself
suite("Compounds outside launch.json", () => {
  let api: TestApi;
  let spy: LaunchSpy;
  let picker: PickerStub;
  let errors: MessageStub;

  suiteSetup(async () => {
    api = await activateExtension();
    spy = new LaunchSpy();
  });

  suiteTeardown(() => spy.dispose());

  setup(async () => {
    await api.clearRecentItems();
    spy.clear();
    picker = new PickerStub();
    errors = new MessageStub(undefined, "showErrorMessage");
  });

  teardown(() => {
    errors.dispose();
    picker.dispose();
  });

  async function runCompound(name: string): Promise<void> {
    await vscode.commands.executeCommand(COMMAND);
    await picker.accept(name, "workspace");
  }

  test("runs every configuration of a compound, hidden ones too", async () => {
    await runCompound("Plain");
    const launches = await spy.waitFor(2);
    assert.deepStrictEqual(launches.sort(byName), [
      { name: "WS Hidden", folder: undefined, noDebug: true },
      { name: "WS One", folder: undefined, noDebug: true },
    ]);
  });

  test("finds configurations in folders, by name or by name and folder", async () => {
    await runCompound("Across Folders");
    const launches = await spy.waitFor(2);
    assert.deepStrictEqual(launches.sort(byName), [
      { name: "App Only", folder: "app", noDebug: true },
      { name: "Run", folder: "lib", noDebug: true },
    ]);
  });

  test("prefers a configuration from the same file as the compound", async () => {
    await runCompound("Prefers Own Source");
    assert.deepStrictEqual(await spy.waitFor(1), [
      { name: "Shared", folder: undefined, noDebug: true },
    ]);
  });

  for (const [compound, message] of [
    [
      "Ambiguous",
      'There are multiple launch configurations "Run" in the workspace. Use folder name to qualify the configuration.',
    ],
    ["Missing", 'Could not find launch configuration "Nope" in the workspace.'],
    [
      "Wrong Folder",
      'Can not find folder with name "nope" for configuration "Run" in compound "Wrong Folder".',
    ],
    ["With Missing Task", 'Could not find the task "nope".'],
  ]) {
    test(`reports and runs nothing: ${compound}`, async () => {
      await runCompound(compound);
      assert.deepStrictEqual(await errors.messages(), [{ message, items: [] }]);
      assert.deepStrictEqual(await spy.waitFor(1, 500), []);
    });
  }

  test("runs the preLaunchTask first", async () => {
    const started: string[] = [];
    const listener = vscode.tasks.onDidStartTask((e) => started.push(e.execution.task.name));
    try {
      await runCompound("With Task");
      assert.deepStrictEqual(await spy.waitFor(1), [
        { name: "WS One", folder: undefined, noDebug: true },
      ]);
      assert.deepStrictEqual(started, ["succeed"]);
    } finally {
      listener.dispose();
    }
  });

  test("asks what to do when the preLaunchTask fails, and runs nothing on dismiss", async () => {
    await runCompound("With Failing Task");
    assert.deepStrictEqual(await errors.messages(), [
      {
        message: 'The preLaunchTask "fail" terminated with exit code 3.',
        items: ["Run Anyway", "Show Errors"],
      },
    ]);
    assert.deepStrictEqual(await spy.waitFor(1, 500), []);
  });

  test("runs anyway when asked to after the preLaunchTask fails", async () => {
    errors.dispose();
    errors = new MessageStub("Run Anyway", "showErrorMessage");
    await runCompound("With Failing Task");
    assert.deepStrictEqual(await spy.waitFor(1), [
      { name: "WS One", folder: undefined, noDebug: true },
    ]);
  });

  test("runs a compound from user settings", async () => {
    await setUserLaunchConfigs(
      [USER_CONFIG],
      [{ name: "User Compound", configurations: ["User One", "WS One"] }],
    );
    try {
      await vscode.commands.executeCommand(COMMAND);
      await picker.accept("User Compound", "user settings");
      const launches = await spy.waitFor(2);
      assert.deepStrictEqual(launches.sort(byName), [
        { name: "User One", folder: undefined, noDebug: true },
        { name: "WS One", folder: undefined, noDebug: true },
      ]);
    } finally {
      await setUserLaunchConfigs(undefined);
    }
  });
});

// real sessions: the launch spy of the suite above is disposed by now
suite("Compounds outside launch.json, real sessions", () => {
  let picker: PickerStub;

  suiteSetup(async () => {
    await activateExtension();
  });

  setup(() => {
    picker = new PickerStub();
  });

  teardown(async () => {
    picker.dispose();
    await vscode.debug.stopDebugging();
  });

  async function startTwoSessions(compound: string): Promise<vscode.DebugSession[]> {
    const started: vscode.DebugSession[] = [];
    const listener = vscode.debug.onDidStartDebugSession((session) => {
      if (!session.parentSession) {
        started.push(session);
      }
    });
    try {
      await vscode.commands.executeCommand(COMMAND);
      await picker.accept(compound, "workspace");
      await waitUntil(() => started.length >= 2, 20000);
      assert.deepStrictEqual(started.map((s) => s.name).sort(), ["Wait A", "Wait B"]);
      return started;
    } finally {
      listener.dispose();
    }
  }

  // js-debug runs the program in a child session, which stops together with its parent
  async function stopFirst(sessions: vscode.DebugSession[], timeout = 5000): Promise<string[]> {
    const terminated: string[] = [];
    const listener = vscode.debug.onDidTerminateDebugSession((s) => {
      if (!s.parentSession) {
        terminated.push(s.name);
      }
    });
    try {
      await vscode.debug.stopDebugging(sessions[0]);
      await waitUntil(() => terminated.length >= 2, timeout);
      return terminated.sort();
    } finally {
      listener.dispose();
    }
  }

  test("stops every session when one stops with stopAll", async () => {
    const sessions = await startTwoSessions("Stop Together");
    assert.deepStrictEqual(await stopFirst(sessions), ["Wait A", "Wait B"]);
  });

  test("stops only the one session without stopAll", async () => {
    const sessions = await startTwoSessions("Stop Separately");
    assert.deepStrictEqual(await stopFirst(sessions, 2000), [sessions[0].name]);
  });
});
