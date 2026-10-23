import * as vscode from "vscode";

const STORAGE_KEY = "recentItems";

/** Identifies a picker item; stored as is, so the format must stay compatible with older versions. */
interface RecentItem {
  label: string;
  description?: string;
}

function isSame(a: RecentItem, b: RecentItem): boolean {
  return a.label === b.label && a.description === b.description;
}

/** Most recently run picker items, per workspace. */
export class RecentConfigs {
  constructor(private readonly state: vscode.Memento) {}

  private get items(): RecentItem[] {
    return this.state.get<RecentItem[]>(STORAGE_KEY, []);
  }

  /** Recently run items first, most recent at the top, the rest in their original order. */
  sort<T extends RecentItem>(items: readonly T[]): T[] {
    const recent = this.items
      .map((recentItem) => items.find((item) => isSame(item, recentItem)))
      .filter((item) => item !== undefined);
    return [...recent, ...items.filter((item) => !recent.includes(item))];
  }

  async add({ label, description }: RecentItem): Promise<void> {
    const item = { label, description };
    const rest = this.items.filter((recentItem) => !isSame(recentItem, item));
    await this.state.update(STORAGE_KEY, [item, ...rest]);
  }

  async clear(): Promise<void> {
    await this.state.update(STORAGE_KEY, undefined);
  }
}
