import * as vscode from 'vscode';
import type { CancellationToken } from 'vscode';
import type { GitCli } from './gitCli';
import { gitPartsFromUri } from '../uris';

/**
 * Serves `meldx-git:` virtual documents by streaming `git show <ref>:<path>`.
 * `onDidChange` is fired on refresh so any open blob re-reads its content.
 */
export class GitContentProvider implements vscode.TextDocumentContentProvider, vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this.emitter.event;

  constructor(private readonly git: GitCli) {}

  provideTextDocumentContent(uri: vscode.Uri, token: CancellationToken): Promise<string> {
    const { repoRoot, ref, path } = gitPartsFromUri(uri);
    return this.git.showBlob(repoRoot, ref, path, token);
  }

  refresh(uri: vscode.Uri): void {
    this.emitter.fire(uri);
  }

  dispose(): void {
    this.emitter.dispose();
  }
}

/** Serves `meldx-empty:` documents (the absent side of an add/remove diff). */
export class EmptyContentProvider implements vscode.TextDocumentContentProvider {
  provideTextDocumentContent(): string {
    return '';
  }
}
