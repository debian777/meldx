import * as vscode from 'vscode';
import type { DiffNode } from './types';
import type { DiffModel } from './diff/model';
import { AsyncHashPool } from './diff/pool';
import { FolderDiffModel } from './diff/folderModel';
import { FsSide } from './fs/fsSide';
import { GitSide } from './git/gitSide';
import { GitDiffModel } from './git/gitModel';
import type { GitCli } from './git/gitCli';
import type { GitContentProvider } from './git/contentProvider';
import type { ComparisonsProvider } from './tree/comparisonsProvider';
import type { DecorationProvider } from './tree/decorationProvider';
import { readConfig } from './config';
import { GIT_SCHEME } from './git/types';
import { makeExcludeMatcher } from './util/glob';
import { logError } from './util/logger';
import { baseName, toPosix } from './util/pathkey';

type SessionSpec =
  | { kind: 'folder'; leftRoot: string; rightRoot: string }
  | { kind: 'ref-worktree'; repoRoot: string; ref: string }
  | { kind: 'ref-ref'; repoRoot: string; refA: string; refB: string };

/**
 * Owns the current comparison. Commands describe *what* to compare (a
 * {@link SessionSpec}); the controller builds the matching {@link DiffModel},
 * publishes it to the tree, and rebuilds on refresh/swap so no stale state or
 * hash cache survives. Swap and refresh are expressed as spec transforms +
 * rebuild, which keeps status inversion correct without ad-hoc mutation.
 */
export class SessionController implements vscode.Disposable {
  private model: DiffModel | undefined;
  private spec: SessionSpec | undefined;

  constructor(
    private readonly provider: ComparisonsProvider,
    readonly git: GitCli,
    private readonly content: GitContentProvider,
    private readonly deco: DecorationProvider,
  ) {}

  async startFolders(leftRoot: string, rightRoot: string): Promise<void> {
    this.spec = { kind: 'folder', leftRoot, rightRoot };
    await this.rebuild();
    await reveal();
  }

  async startRefWorktree(repoRoot: string, ref: string): Promise<void> {
    this.spec = { kind: 'ref-worktree', repoRoot, ref };
    await this.rebuild();
    await reveal();
  }

  async startRefRef(repoRoot: string, refA: string, refB: string): Promise<void> {
    this.spec = { kind: 'ref-ref', repoRoot, refA, refB };
    await this.rebuild();
    await reveal();
  }

  refresh(): void {
    if (!this.spec) {
      return;
    }
    void this.rebuild();
    for (const doc of vscode.workspace.textDocuments) {
      if (doc.uri.scheme === GIT_SCHEME) {
        this.content.refresh(doc.uri);
      }
    }
  }

  swap(): void {
    const s = this.spec;
    if (!s) {
      return;
    }
    if (s.kind === 'folder') {
      this.spec = { kind: 'folder', leftRoot: s.rightRoot, rightRoot: s.leftRoot };
    } else if (s.kind === 'ref-ref') {
      this.spec = { kind: 'ref-ref', repoRoot: s.repoRoot, refA: s.refB, refB: s.refA };
    } else {
      void vscode.window.showInformationMessage('MeldX: Swap is not available for ref ↔ working tree.');
      return;
    }
    void this.rebuild();
  }

  onConfigChanged(): void {
    if (this.spec) {
      void this.rebuild();
    }
  }

  openDiff(node: DiffNode): void {
    const result = this.model?.resolveDiff(node);
    if (!result) {
      return;
    }
    void vscode.commands.executeCommand('vscode.diff', result.left, result.right, result.title);
  }

  /** Resolve the git repo root for the workspace (or a folder the user picks). */
  async discoverRepoRoot(): Promise<string | undefined> {
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const cwd = ws ?? (await pickFolder('Select a folder inside a git repository'));
    if (!cwd) {
      return undefined;
    }
    try {
      return await this.git.repoRoot(cwd);
    } catch (e) {
      logError('repoRoot discovery failed', e);
      void vscode.window.showErrorMessage(`MeldX: ${cwd} is not inside a git repository.`);
      return undefined;
    }
  }

  listRefs(repoRoot: string): Promise<string[]> {
    return this.git.listRefs(repoRoot);
  }

  dispose(): void {
    this.model?.dispose();
    this.model = undefined;
  }

  private async rebuild(): Promise<void> {
    const spec = this.spec;
    if (!spec) {
      return;
    }
    try {
      const model = await this.build(spec);
      this.model?.dispose();
      this.model = model;
      this.provider.setModel(model);
      this.deco.refresh();
    } catch (e) {
      logError('failed to build comparison', e);
      void vscode.window.showErrorMessage(`MeldX: ${(e as Error).message}`);
    }
  }

  private async build(spec: SessionSpec): Promise<DiffModel> {
    const cfg = readConfig();
    if (spec.kind === 'folder') {
      const exclude = makeExcludeMatcher(cfg.exclude);
      const left = new FsSide(spec.leftRoot, baseName(toPosix(spec.leftRoot)), exclude, cfg.followSymlinks);
      const right = new FsSide(spec.rightRoot, baseName(toPosix(spec.rightRoot)), exclude, cfg.followSymlinks);
      return new FolderDiffModel(left, right, new AsyncHashPool(), `${left.label} ↔ ${right.label}`);
    }
    if (spec.kind === 'ref-worktree') {
      const changes = await this.git.diffNameStatus(spec.repoRoot, [spec.ref]);
      const left = new GitSide(spec.repoRoot, spec.ref, spec.ref);
      const right = new FsSide(spec.repoRoot, 'working tree', makeExcludeMatcher([]), false);
      return new GitDiffModel(changes, left, right, `${spec.ref} ↔ working tree`);
    }
    const changes = await this.git.diffNameStatus(spec.repoRoot, [spec.refA, spec.refB]);
    const left = new GitSide(spec.repoRoot, spec.refA, spec.refA);
    const right = new GitSide(spec.repoRoot, spec.refB, spec.refB);
    return new GitDiffModel(changes, left, right, `${spec.refA} ↔ ${spec.refB}`);
  }
}

async function reveal(): Promise<void> {
  try {
    await vscode.commands.executeCommand('meldx.comparisons.focus');
  } catch {
    // view focus is best-effort
  }
}

async function pickFolder(label: string): Promise<string | undefined> {
  const picked = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    openLabel: label,
  });
  return picked?.[0]?.fsPath;
}
