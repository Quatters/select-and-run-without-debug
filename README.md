# Select and Run Without Debug

[![CI](https://img.shields.io/github/actions/workflow/status/Quatters/select-and-run-without-debug/ci.yml?branch=master&label=CI)](https://github.com/Quatters/select-and-run-without-debug/actions/workflows/ci.yml)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/quatters/select-and-run-without-debug?label=Open%20VSX%20Downloads)](https://open-vsx.org/extension/quatters/select-and-run-without-debug)
[![VS Marketplace Installs](https://vsmarketplacebadges.dev/installs-short/quatters.select-and-run-without-debug.svg?label=VS%20Marketplace%20Installs)](https://marketplace.visualstudio.com/items?itemName=quatters.select-and-run-without-debug)
[![VS Marketplace Rating](https://vsmarketplacebadges.dev/rating-short/quatters.select-and-run-without-debug.svg?label=VS%20Marketplace%20Rating)](https://marketplace.visualstudio.com/items?itemName=quatters.select-and-run-without-debug&ssr=false#review-details)

Pick a launch configuration and run it without debugging, the same way the built-in
**Debug: Select and Start Debugging** command starts it with debugging.

Open the Command Palette, run **Debug: Select and Run Without Debug** and choose a configuration.

## Features

- Configurations and compounds from `launch.json`, `.code-workspace` files and user settings
- Multi-root workspaces: each configuration shows the folder it comes from
- Recently run configurations are listed first
- **Debug: Run Last Without Debug** runs the most recently run configuration again, without the picker
- `presentation` works like in the built-in picker: configurations are sorted by `group` and `order`,
  groups are separated, and ones with `"hidden": true` are not listed

## Keyboard shortcuts

Open **Preferences: Open Keyboard Shortcuts (JSON)** and add, for example:

```json
[
  {
    "key": "ctrl+alt+f5",
    "command": "select-and-run-without-debug.activate"
  },
  {
    "key": "ctrl+alt+shift+f5",
    "command": "select-and-run-without-debug.runLast"
  }
]
```

To run a specific configuration without the picker, pass its name in `args`:

```json
{
  "key": "ctrl+alt+1",
  "command": "select-and-run-without-debug.activate",
  "args": "Server"
}
```

If several folders of a multi-root workspace have a configuration with that name, add the folder
as the picker shows it next to the name (`workspace` for configurations from the `.code-workspace`
file, `user settings` for ones from user settings): `"args": { "name": "Server", "folder": "backend" }`.

## Known issues

VS Code can start only compounds from `launch.json` (see
[microsoft/vscode#109083](https://github.com/microsoft/vscode/issues/109083)), so compounds from a
`.code-workspace` file or user settings are started by the extension itself. It supports
`configurations`, `stopAll` and `preLaunchTask`, with these differences from VS Code:

- A background `preLaunchTask` (a watch task with `isBackground`) is not waited for: extensions can't
  tell when it is ready, so the configurations start right after the task.
- A `preLaunchTask` counts as failed only by its exit code, problems found by its problem matcher are
  not taken into account.

## Requirements

VS Code 1.90 or newer.

## Release notes

See [CHANGELOG.md](CHANGELOG.md).

## Development

```sh
pnpm install
pnpm test
```

Press F5 in VS Code to run the extension in a new window.
