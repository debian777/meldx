import type * as vscode from 'vscode';
import type { Side } from '../diff/model';
import { gitUri } from '../uris';

/**
 * A {@link Side} over a fixed git ref. Content is addressed through a
 * `meldx-git:` URI, resolved lazily by the content provider via `git show`.
 */
export class GitSide implements Side {
  constructor(
    private readonly repoRoot: string,
    private readonly ref: string,
    readonly label: string,
  ) {}

  contentUri(relPath: string): vscode.Uri {
    return gitUri({ repoRoot: this.repoRoot, ref: this.ref, path: relPath });
  }
}
