import type { GitUriParts } from './types';

/**
 * Encode git blob coordinates into a URI query string. Stored in the query
 * (never the path) because refs and paths contain characters (`:`, `/`) that
 * are ambiguous inside a URI path. Pure + round-trip tested.
 */
export function encodeGitQuery(parts: GitUriParts): string {
  const p = new URLSearchParams();
  p.set('root', parts.repoRoot);
  p.set('ref', parts.ref);
  p.set('path', parts.path);
  return p.toString();
}

/** Decode a URI query string produced by {@link encodeGitQuery}. */
export function decodeGitQuery(query: string): GitUriParts {
  const p = new URLSearchParams(query);
  return {
    repoRoot: p.get('root') ?? '',
    ref: p.get('ref') ?? '',
    path: p.get('path') ?? '',
  };
}
