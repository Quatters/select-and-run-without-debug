# Select and Run Without Debug

Pick a launch configuration and run it without debugging, the same way the built-in
**Debug: Select and Start Debugging** command starts it with debugging.

Open the Command Palette, run **Debug: Select and Run Without Debug** and choose a configuration.

## Features

- Configurations and compounds from `launch.json` and from `.code-workspace` files
- Multi-root workspaces: each configuration shows the folder it comes from
- Recently run configurations are listed first
- Configurations hidden with `"presentation": { "hidden": true }` are not listed

## Keyboard shortcut

Open **Preferences: Open Keyboard Shortcuts (JSON)** and add:

```json
{
  "key": "ctrl+shift+f5",
  "command": "select-and-run-without-debug.activate"
}
```

## Known issues

- Compounds defined in a `.code-workspace` file do not start: the VS Code API cannot start them by
  name, see [microsoft/vscode#109083](https://github.com/microsoft/vscode/issues/109083).

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
