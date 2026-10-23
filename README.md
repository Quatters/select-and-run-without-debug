# Select and Run Without Debug

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

- Compounds defined in a `.code-workspace` file or in user settings do not start: the VS Code API
  cannot start them by name, see [microsoft/vscode#109083](https://github.com/microsoft/vscode/issues/109083).

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
