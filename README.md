# Select and Run Without Debug

Simple tool that allows you to select and run debug configuration without debugging from command palette. It's
behavior is similar to built-in `Select and Start Debugging`.

To use this tool run the command palette, start typing "Select and Run Without Debug" and then select your
configuration.

It's also possible to map a shortcut:

- Go to the Keyboard Shortcuts.
- Search for "select-and-run-without-debug".
- Map a keyboard shortcut at your own.

## Features

- Support for workspaces with one or more projects
- Support for compound configs

## Release Notes

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
