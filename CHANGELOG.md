# Change Log

## [Unreleased]

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
