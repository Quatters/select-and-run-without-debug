# Select and Run Without Debug

Simple tool that allows you to select and run debug configuration without
debugging from command palette. It's behavior is similar to builtin
`Select and Start Debugging`.

To use this tool run the command palette, start typing
"Select and Run Without Debug" and then select your configuration.

It's also possible to map a shortcut:

- Go to the Keyboard Shortcuts.
- Search for "select-and-run-without-debug".
- Map a keyboard shortcut at your own.

Additionally, this extension adds run button to upper right corner
of the editor. If you don't want to use it, feel free to disable it
completely via settings.

## Features

- Support for workspaces with one or more projects
- Support for compound configs
- Additional configurable UI button for running without debug

## Known issues

When calling `Select and Run Without Debug` command, selected config will not
be saved for subsequent runs as it happens with built-in
`Select and Start Debugging`, because VS Code's extensions API does not
allow to read or write currently selected config. Related issue is
[here](https://github.com/microsoft/vscode/issues/77138).

As a workaround, there is a `Rerun Last Without Debug` command which runs
last config launched by `Select and Run Without Debug`. By default, rerun is
used for UI button, but it can be configured to use the config you see in
"Run and Debug" tab.

## Release Notes

### 1.2.0
- Add UI buttons to editor title which allow to start debug session.

### 1.1.4
- Fix bugs from previous release.

### 1.1.3
- Add support for configs placed at ``*.code-workspace``.
- Update icon.

### 1.1.2
- Add support for compound configs.
- Update icon.

### 1.1.1
- Bug fixes.

### 1.1.0
- Memoize last launched configs and move them to top.

### 1.0.0
- Add support for multiproject workspaces.

### 0.1.0
- Initial release.
