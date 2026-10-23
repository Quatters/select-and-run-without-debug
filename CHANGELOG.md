# Changelog

## [2.1.0](https://github.com/Quatters/select-and-run-without-debug/compare/v2.0.0...v2.1.0) (2026-10-23)


### Features

* add a command to run the last configuration again ([f8ca8c9](https://github.com/Quatters/select-and-run-without-debug/commit/f8ca8c9c4ded3fec664d86270bf3bd3871e2333f))
* explain an empty list and offer to add a configuration ([4835f3c](https://github.com/Quatters/select-and-run-without-debug/commit/4835f3cb338a9f01caf52b1a48939212b97aa563))
* list configurations in the same order as the built-in picker ([e037f32](https://github.com/Quatters/select-and-run-without-debug/commit/e037f323747b4a276dfd166c13db6d9c88f80e18))
* list launch configurations from user settings ([9891274](https://github.com/Quatters/select-and-run-without-debug/commit/989127455fee6ed3d2adc7bee791063021764219))
* run a configuration named in the command arguments ([4614506](https://github.com/Quatters/select-and-run-without-debug/commit/46145066af605b7a31b820e769635cb12329abd8))
* separate recently used configurations in the picker ([05a9541](https://github.com/Quatters/select-and-run-without-debug/commit/05a9541299729b6d727141a1d21f7cefe4bc3d78))
* sort and group configurations by presentation ([f17ed98](https://github.com/Quatters/select-and-run-without-debug/commit/f17ed9866d568082585cf8ffe0f326660a9ca867))
* start compounds from .code-workspace files and user settings ([0b5e2af](https://github.com/Quatters/select-and-run-without-debug/commit/0b5e2af462ca821fe662997ca996675c13a607a3))


### Bug Fixes

* stop passing compounds outside launch.json to VS Code as configurations ([f663ab5](https://github.com/Quatters/select-and-run-without-debug/commit/f663ab5fc2f7c2e91eb9cdbf6acbdfe44213253d))

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
