# Changelog

## [2.0.0](https://github.com/Quatters/select-and-run-without-debug/compare/v1.1.5...v2.0.0) (2026-10-23)


### ⚠ BREAKING CHANGES

* VS Code versions older than 1.90 are no longer supported.

### Features

* require VS Code 1.90 or newer ([e3e7ada](https://github.com/Quatters/select-and-run-without-debug/commit/e3e7ada6e60f77759b926172f6724143ded78049))


### Bug Fixes

* hide configurations marked with presentation.hidden ([612c53e](https://github.com/Quatters/select-and-run-without-debug/commit/612c53e7ec94843f580093f3d3f3dc7eeb5d60b0))
* ignore accept when no item is selected ([d3e4b8f](https://github.com/Quatters/select-and-run-without-debug/commit/d3e4b8f9646739443a50f1e0f942a400f319e159))
* keep the picker open when the command is run again ([e4bd59d](https://github.com/Quatters/select-and-run-without-debug/commit/e4bd59d266cd7eb6fc47b22443ab589a5eb7302f))
* remember same-named configurations from different folders separately ([e2c9e70](https://github.com/Quatters/select-and-run-without-debug/commit/e2c9e70d6441bada184573632eeee58a523f27d6))

## [1.1.5] - 2023-11-16
- Fix: compounds from ``launch.json`` now start as expected. Compounds from
``.code-workspace`` still cannot start 😢.

## [1.1.4] - 2023-10-28
- Fix: If ``*.code-workspace`` configs used without ``launch.json`` files, then
workspace configs shown multiple times.
- Fix: If ``*.code-workspace`` configs used with ``launch.json``, then
workspace configs not shown sometimes.

## [1.1.3] - 2023-10-28
- Feature: Support for configs placed at ``*.code-workspace``.
- Update icon.
- Internals: Move from ``npm`` to ``yarn``.
- Internals: Setup ``eslint`` and ``prettier``.

## [1.1.2] - 2023-10-26
- Feature: Support for compound configs.
- Update icon.

## [1.1.1] - 2023-02-05
- Fix: Multiple execution at once when selecting config.
- Fix: Moving to top not working if item was previously memoized.

## [1.1.0] - 2023-02-05
- Memoize last launched configs and move them to top
- Refactor code.

## [1.0.0] - 2022-10-26
- Add support for multiproject workspaces
- Move category from Keymaps to Other

## [0.1.0] - 2022-10-10
- Initial release
