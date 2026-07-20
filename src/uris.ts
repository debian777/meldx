import * as vscode from 'vscode';
import type { NodeStatus } from './types';
import type { GitUriParts } from './git/types';
import { EMPTY_SCHEME, GIT_SCHEME, NODE_SCHEME } from './git/types';
import { decodeGitQuery, encodeGitQuery } from './git/uri';

/** Build a `meldx-git:` URI carrying blob coordinates in its query. */
export function gitUri(parts: GitUriParts): vscode.Uri {
  return vscode.Uri.from({ scheme: GIT_SCHEME, path: `/${parts.path}`, query: encodeGitQuery(parts) });
}

/** Recover blob coordinates from a `meldx-git:` URI. */
export function gitPartsFromUri(uri: vscode.Uri): GitUriParts {
  return decodeGitQuery(uri.query);
}

/** Build a `meldx-empty:` URI representing an absent side (add/remove diffs). */
export function emptyUri(relPath: string): vscode.Uri {
  return vscode.Uri.from({ scheme: EMPTY_SCHEME, path: `/${relPath}` });
}

/** Build a `meldx-node:` URI whose query carries the node status, so the
 *  `FileDecorationProvider` can color a row in O(1) without a re-scan. */
export function nodeUri(relPath: string, status: NodeStatus): vscode.Uri {
  return vscode.Uri.from({ scheme: NODE_SCHEME, path: `/${relPath}`, query: `status=${status}` });
}

/** Read the status previously encoded by {@link nodeUri}. */
export function statusFromNodeUri(uri: vscode.Uri): NodeStatus {
  const status = new URLSearchParams(uri.query).get('status');
  return (status as NodeStatus | null) ?? 'pending';
}
