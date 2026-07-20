// Pure domain types shared across MeldX. This module MUST NOT import `vscode`
// so that it can be loaded by fast unit tests (vitest) without an editor host.

export type NodeKind = 'dir' | 'file';

/**
 * Status of a node in the difference tree.
 * - `pending`  : classification not yet computed (file awaiting hashing).
 */
export type NodeStatus =
  | 'added'
  | 'removed'
  | 'modified'
  | 'type-changed'
  | 'identical'
  | 'pending';

/** Whether two file contents are known to be equal. */
export type ContentEquality = 'equal' | 'different' | 'unknown';

/** A single entry as listed by a source at one directory level. */
export interface SideEntry {
  name: string;
  kind: NodeKind;
}

/** Minimal stat information used for classification. */
export interface SideStat {
  kind: NodeKind;
  size: number;
}

/**
 * A node in the difference tree. Deliberately free of parent pointers and eager
 * children arrays so the tree can be materialized lazily and stay memory-lean.
 * `left`/`right` hold the node's kind on each side, or `null` when absent there.
 */
export interface DiffNode {
  id: string;
  name: string;
  relPath: string;
  kind: NodeKind;
  status: NodeStatus;
  left: NodeKind | null;
  right: NodeKind | null;
}
