import type { NodeStatus } from '../types';

/** A single change reported by git, already mapped to a MeldX status. */
export interface GitChange {
  status: NodeStatus;
  path: string;
}

/** Map a single git status code (from `--name-status`) to a MeldX status. */
export function gitCodeToStatus(code: string | undefined): NodeStatus {
  switch (code) {
    case 'A':
      return 'added';
    case 'D':
      return 'removed';
    case 'T':
      return 'type-changed';
    case 'M':
      return 'modified';
    default:
      return 'modified';
  }
}

/**
 * Parse the NUL-delimited output of `git diff --name-status -z`.
 *
 * Regular records are `"<code>\0<path>\0"`. Rename/copy records are
 * `"<Rnnn|Cnnn>\0<oldPath>\0<newPath>\0"`. Renames are expanded into a
 * `removed` (old path) plus an `added` (new path); copies into an `added`.
 * This function is pure so it can be unit-tested without git.
 */
export function parseNameStatusZ(raw: string): GitChange[] {
  const tokens = raw.split('\0').filter((t) => t.length > 0);
  const out: GitChange[] = [];
  let i = 0;
  while (i < tokens.length) {
    const code = tokens[i++];
    if (code === undefined) {
      break;
    }
    const c = code[0];
    if (c === 'R' || c === 'C') {
      const oldPath = tokens[i++];
      const newPath = tokens[i++];
      if (oldPath === undefined || newPath === undefined) {
        break;
      }
      if (c === 'R') {
        out.push({ status: 'removed', path: oldPath });
      }
      out.push({ status: 'added', path: newPath });
    } else {
      const p = tokens[i++];
      if (p === undefined) {
        break;
      }
      out.push({ status: gitCodeToStatus(c), path: p });
    }
  }
  return out;
}

/** Parse the NUL-delimited output of `git ls-tree -r -z --name-only <ref>`. */
export function parseLsTreeNameOnlyZ(raw: string): string[] {
  return raw.split('\0').filter((t) => t.length > 0);
}

/** Normalize a user-entered ref string (trim surrounding whitespace). */
export function normalizeRef(ref: string): string {
  return ref.trim();
}
