# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- "New Comparison…" command and title-bar button so a fresh comparison can be
  started while one is already active (previously only reachable from the empty
  welcome view).
- Release scripts: `release`, `release:minor`, `release:pre`, `release:beta` for
  cutting tagged releases via `npm version` + `git push --follow-tags`.

### Changed

- Release workflow marks GitHub releases as pre-releases for pre/beta tags.
- Bumped dev dependencies and raised `engines.vscode` (and `@types/vscode`) to
  1.125.0.

### Fixed

- Resolved dependency vulnerabilities (`diff`, `serialize-javascript`) via npm
  `overrides`.

## [0.0.1] - 2026-07-20

### Added

- Initial release.
- Folder ↔ Folder recursive comparison with a difference tree (added / removed /
  modified / type-changed / identical).
- Content-hash based status classification with lazy, bounded-parallel hashing.
- Git comparisons: working tree ↔ ref and ref ↔ ref via the `git` CLI.
- `meldx-git:` content provider serving blobs through `git show`, enabling native
  side-by-side diffs for any ref.
- Native diff on click via the built-in `vscode.diff` command.
- File decorations (status badges + colors) in the comparison tree.
- Commands: Compare Folders, Compare Selected Folders (Explorer), Compare With Git
  Ref, Compare Two Git Refs, Refresh, Swap Sides, Toggle Identical, Open Diff.
- Configuration: `meldx.exclude`, `meldx.showIdentical`, `meldx.gitPath`,
  `meldx.followSymlinks`.

[Unreleased]: https://github.com/debian777/meldx/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/debian777/meldx/releases/tag/v0.0.1
