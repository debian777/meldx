/** Blob coordinates carried inside a `meldx-git:` URI. */
export interface GitUriParts {
  repoRoot: string;
  ref: string;
  path: string;
}

/** Custom URI schemes registered by the extension. */
export const GIT_SCHEME = 'meldx-git';
export const EMPTY_SCHEME = 'meldx-empty';
export const NODE_SCHEME = 'meldx-node';
