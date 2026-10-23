import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";

export const EXTENSION_ID = "quatters.select-and-run-without-debug";
export const COMMAND = "select-and-run-without-debug.activate";

export interface TestApi {
  clearRecentItems(): Promise<void>;
}

export interface Launch {
  name: string;
  folder: string | undefined;
  noDebug: boolean | undefined;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntil(condition: () => boolean, timeout: number): Promise<void> {
  const deadline = Date.now() + timeout;
  while (!condition() && Date.now() < deadline) {
    await sleep(20);
  }
}

export async function activateExtension(): Promise<TestApi> {
  const extension = vscode.extensions.getExtension<TestApi>(EXTENSION_ID);
  assert.ok(extension, `${EXTENSION_ID} is not installed`);
  return extension.activate();
}

/** `label (description)` for each item, to make assertions on picker contents readable. */
export function describeItems(items: readonly vscode.QuickPickItem[]): string[] {
  return items.map((item) =>
    item.description ? `${item.label} (${item.description})` : item.label,
  );
}

export function byName(a: Launch, b: Launch): number {
  return a.name.localeCompare(b.name);
}

/**
 * Records every debug session VS Code is about to start and cancels it,
 * so tests can check what was launched without a real debug adapter.
 */
export class LaunchSpy implements vscode.Disposable {
  private readonly launches: Launch[] = [];
  private readonly registration = vscode.debug.registerDebugConfigurationProvider("*", {
    resolveDebugConfiguration: (folder, config) => {
      this.launches.push({ name: config.name, folder: folder?.name, noDebug: config.noDebug });
      // undefined silently cancels the launch
      return undefined;
    },
  });

  clear(): void {
    this.launches.length = 0;
  }

  /** Waits for `count` launches, then a bit more to catch unexpected extra ones. */
  async waitFor(count: number, timeout = 5000): Promise<Launch[]> {
    await waitUntil(() => this.launches.length >= count, timeout);
    await sleep(200);
    return [...this.launches];
  }

  dispose(): void {
    this.registration.dispose();
  }
}

interface PickerSession {
  items(): readonly vscode.QuickPickItem[];
  matchOnDescription: boolean | undefined;
  accept(item: vscode.QuickPickItem | undefined): void;
}

/** Minimal event that calls listeners synchronously, so their errors reach the test. */
class TestEvent {
  private readonly listeners: (() => unknown)[] = [];

  readonly event = (listener: () => unknown, thisArgs?: unknown): vscode.Disposable => {
    const bound = () => listener.call(thisArgs);
    this.listeners.push(bound);
    return new vscode.Disposable(() => this.listeners.splice(this.listeners.indexOf(bound), 1));
  };

  fire(): void {
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
}

/**
 * Replaces both `window.createQuickPick` and `window.showQuickPick`,
 * so tests don't depend on which of them the extension uses.
 */
export class PickerStub implements vscode.Disposable {
  private readonly sandbox = sinon.createSandbox();
  private session: PickerSession | undefined;

  constructor() {
    this.sandbox.stub(vscode.window, "createQuickPick").callsFake(() => this.createQuickPick());
    (this.sandbox.stub(vscode.window, "showQuickPick") as sinon.SinonStub).callsFake(
      async (
        items: readonly vscode.QuickPickItem[] | Thenable<readonly vscode.QuickPickItem[]>,
        options?: vscode.QuickPickOptions,
      ) => {
        const resolvedItems = await items;
        return new Promise<vscode.QuickPickItem | undefined>((resolve) => {
          this.session = {
            items: () => resolvedItems,
            matchOnDescription: options?.matchOnDescription,
            accept: resolve,
          };
        });
      },
    );
  }

  private createQuickPick(): vscode.QuickPick<vscode.QuickPickItem> {
    const onDidAccept = new TestEvent();
    const onDidHide = new TestEvent();
    const quickPick = {
      items: [] as readonly vscode.QuickPickItem[],
      selectedItems: [] as readonly vscode.QuickPickItem[],
      activeItems: [] as readonly vscode.QuickPickItem[],
      value: "",
      placeholder: undefined as string | undefined,
      matchOnDescription: false,
      onDidAccept: onDidAccept.event,
      onDidHide: onDidHide.event,
      show: () => {
        this.session = {
          items: () => quickPick.items,
          get matchOnDescription() {
            return quickPick.matchOnDescription;
          },
          accept: (item) => {
            quickPick.selectedItems = item ? [item] : [];
            onDidAccept.fire();
          },
        };
      },
      hide: () => onDidHide.fire(),
      dispose: () => {},
    };
    return quickPick as unknown as vscode.QuickPick<vscode.QuickPickItem>;
  }

  private async shown(): Promise<PickerSession> {
    await waitUntil(() => this.session !== undefined, 5000);
    assert.ok(this.session, "picker was not shown");
    return this.session;
  }

  async items(): Promise<readonly vscode.QuickPickItem[]> {
    return (await this.shown()).items();
  }

  async matchOnDescription(): Promise<boolean | undefined> {
    return (await this.shown()).matchOnDescription;
  }

  /** Picks the item like the user would by pressing Enter on it. */
  async accept(label: string, description?: string): Promise<void> {
    const session = await this.shown();
    const item = session.items().find((i) => i.label === label && i.description === description);
    assert.ok(
      item,
      `no item "${label}" (${description}) in ${JSON.stringify(describeItems(session.items()))}`,
    );
    this.session = undefined;
    session.accept(item);
  }

  /** Presses Enter while nothing is selected (e.g. the filter matches no items). */
  async acceptNothing(): Promise<void> {
    const session = await this.shown();
    this.session = undefined;
    session.accept(undefined);
  }

  dispose(): void {
    this.sandbox.restore();
  }
}
