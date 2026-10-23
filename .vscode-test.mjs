import { defineConfig } from "@vscode/test-cli";

// each test file runs in its own VS Code instance with the given workspace opened
const workspaces = {
  single: "test-fixtures/single",
  multi: "test-fixtures/multi/multi.code-workspace",
  "ws-dot": "test-fixtures/ws-dot/ws-dot.code-workspace",
  "ws-only": "test-fixtures/ws-only/ws-only.code-workspace",
  "no-folder": undefined,
};

export default defineConfig(
  Object.entries(workspaces).map(([label, workspaceFolder]) => ({
    label,
    files: `out/test/${label}.test.js`,
    workspaceFolder,
    version: process.env.VSCODE_TEST_VERSION ?? "stable",
    launchArgs: ["--disable-extensions", "--disable-workspace-trust"],
    mocha: { ui: "tdd", timeout: 20000 },
  })),
);
