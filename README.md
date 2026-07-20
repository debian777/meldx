# MeldX — Folder & Branch Diff for VS Code

Meld/DiffMerge-style **recursive folder comparison** and **git branch/ref comparison**, right inside VS Code (and Cursor), using the editor's native diff views. No external diff tool, no telemetry, no network access.

## Features

- **Folder ↔ Folder** — pick any two folders (or select two in the Explorer) and browse a lazy, recursive difference tree.
- **Git ref ↔ working tree** — compare any branch/tag/commit against your current working tree.
- **Git ref ↔ ref** — compare any two branches/tags/commits against each other.
- **Native diffs** — click any changed file to open VS Code's built-in side-by-side diff editor.
- **Content-based status** — folder comparisons classify files by streamed SHA-1 of their raw bytes (not mtime), with a size shortcut and a bounded, cancellable hash pool that scales to large trees.
- **Row decorations** — A/D/M/T badges and git-themed colors on every row.
- **Swap, refresh, toggle identical** — from the view title bar.

## Usage

Open the **MeldX** view from the Activity Bar, then run any of:

| Command | What it does |
| --- | --- |
| **MeldX: Compare Folders…** | Pick a left (base) and right (target) folder. |
| **Compare Selected Folders** | Select exactly two folders in the Explorer, right-click → compare. |
| **MeldX: Compare With Git Ref (Working Tree)…** | Pick a ref to diff against the working tree. |
| **MeldX: Compare Two Git Refs…** | Pick two refs to diff against each other. |

Use the view-title actions to **Refresh**, **Swap Sides**, **Toggle Identical Files**, and **Collapse All**.

## Configuration

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `meldx.exclude` | `string[]` | `["**/.git/**"]` | Glob patterns excluded from folder comparisons. |
| `meldx.showIdentical` | `boolean` | `false` | Show files that are identical on both sides. |
| `meldx.gitPath` | `string` | `""` | Absolute path to the `git` binary. Empty ⇒ resolved from `PATH`. |
| `meldx.followSymlinks` | `boolean` | `false` | Follow symbolic links when walking folders. |

## Notes & limitations

- **Line endings matter.** Folder comparisons hash raw bytes, so CRLF vs LF counts as a difference (by design).
- **Git mode shows changed files only.** `git diff --name-status` never reports identical files, so the "Toggle Identical" action has no effect in git comparisons. Untracked files are not shown for ref ↔ working-tree diffs (matching `git diff`).
- **Directories are lazy containers.** A directory present on both sides is shown and expanded on demand; its descendants carry the real differences.
- **Swap** is available for folder and ref ↔ ref comparisons (not ref ↔ working-tree).

## Install a local build

```bash
npm ci
npm run package            # produces meldx-<version>.vsix
code   --install-extension meldx-*.vsix   # VS Code
cursor --install-extension meldx-*.vsix   # Cursor
```

## Development

```bash
npm ci
npm run compile            # esbuild bundle → dist/extension.js
npm run watch              # rebuild on change
npm run lint               # eslint (flat config)
npm run typecheck          # tsc --noEmit
npm run test:unit          # vitest (pure logic)
npm run test:integration   # @vscode/test-electron (launches a headless VS Code)
```

Press <kbd>F5</kbd> in VS Code to launch the Extension Development Host.

## Publishing

CI (lint + tests + package + GitHub Release) runs with **no secrets** from day one. Registry publishing is built but **dormant** until you flip one flag. See the enable checklist below.

1. **VS Code Marketplace** (Azure DevOps): create a publisher, generate a `VSCE_PAT`.
   > ⚠️ Global Azure DevOps PATs are retired on **2026-12-01**; migrate to Microsoft Entra ID workload identity federation before then.
2. **Open VSX** (installs surface in Cursor): create an Eclipse account, sign the Publisher Agreement, generate an `OVSX_PAT`, and run once: `npx ovsx create-namespace debian777 -p $OVSX_PAT`.
3. Add repo **secrets** `VSCE_PAT` and `OVSX_PAT`.
4. Add repo **variable** `PUBLISH_ENABLED=true`.
5. `npm version <patch|minor|major>` then `git push --follow-tags` (or run the **release** workflow via *Run workflow*).

Publishing is double-gated: it runs only when `PUBLISH_ENABLED == 'true'` **and** the build is from a `v*.*.*` tag.

## License

[MIT](./LICENSE)
