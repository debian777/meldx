import type * as vscode from 'vscode';
import type { DiffNode } from '../types';

/**
 * A comparison side, addressed by relative path. Concrete sides know how to
 * turn a relative path into a `Uri` that VS Code can open in a diff editor
 * (a real file for the filesystem, a `meldx-git:` virtual doc for git blobs).
 */
export interface Side {
  readonly label: string;
  contentUri(relPath: string): vscode.Uri;
}

/** The two URIs (plus a title) handed to the `vscode.diff` command. */
export interface DiffResult {
  left: vscode.Uri;
  right: vscode.Uri;
  title: string;
}

/**
 * A materialized comparison. Implementations differ in how children are
 * produced (lazy filesystem walk vs. a precomputed git change list) but share
 * one contract so the tree renderer stays a thin, logic-free view.
 */
export interface DiffModel {
  readonly title: string;
  /** Children of `parentRelPath` (`''` for the roots). */
  getChildren(parentRelPath: string): Promise<DiffNode[]>;
  /** The left/right URIs to diff for a node, or undefined when not diffable. */
  resolveDiff(node: DiffNode): DiffResult | undefined;
  dispose(): void;
}

/** Stable ordering: directories first, then case-insensitive name order. */
export function sortDiffNodes(nodes: DiffNode[]): DiffNode[] {
  return [...nodes].sort((a, b) => {
    if ((a.kind === 'dir') !== (b.kind === 'dir')) {
      return a.kind === 'dir' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
