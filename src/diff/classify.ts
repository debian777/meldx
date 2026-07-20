import type { ContentEquality, NodeKind, NodeStatus } from '../types';

/**
 * Pure status classification for a single tree node.
 *
 * Semantics: the comparison runs from a "left" (base) side to a "right"
 * (target) side. A node present only on the left has been `removed`; present
 * only on the right it has been `added`. Directories present on both sides are
 * treated as unchanged containers (`identical`) — their descendants carry the
 * real differences and are classified on their own.
 */
export function classify(
  left: NodeKind | null,
  right: NodeKind | null,
  content: ContentEquality,
): NodeStatus {
  if (left === null && right === null) {
    return 'identical';
  }
  if (left === null) {
    return 'added';
  }
  if (right === null) {
    return 'removed';
  }
  if (left !== right) {
    return 'type-changed';
  }
  if (left === 'dir') {
    // Both are directories: a neutral container. Directory subtree differences
    // are represented by the children, not by the directory node itself.
    return content === 'different' ? 'modified' : 'identical';
  }
  // Both are files.
  if (content === 'equal') {
    return 'identical';
  }
  if (content === 'different') {
    return 'modified';
  }
  return 'pending';
}

/** A file node whose status is `identical` and should be hidden when the
 *  "show identical" toggle is off. Directories are always kept. */
export function isHiddenWhenIdenticalOff(kind: NodeKind, status: NodeStatus): boolean {
  return kind === 'file' && status === 'identical';
}
