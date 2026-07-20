import * as vscode from 'vscode';
import type { NodeStatus } from '../types';
import { NODE_SCHEME } from '../git/types';
import { statusFromNodeUri } from '../uris';

function decorationFor(status: NodeStatus): vscode.FileDecoration | undefined {
  switch (status) {
    case 'added':
      return new vscode.FileDecoration('A', 'Added', new vscode.ThemeColor('gitDecoration.addedResourceForeground'));
    case 'removed':
      return new vscode.FileDecoration('D', 'Removed', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
    case 'modified':
      return new vscode.FileDecoration('M', 'Modified', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'));
    case 'type-changed':
      return new vscode.FileDecoration('T', 'Type changed', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'));
    default:
      return undefined;
  }
}

/**
 * Colors tree rows by decorating their `meldx-node:` `resourceUri`. Status is
 * read from the URI query (O(1), no re-scan). `refresh()` re-decorates all rows.
 */
export class DecorationProvider implements vscode.FileDecorationProvider, vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations = this.emitter.event;

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    if (uri.scheme !== NODE_SCHEME) {
      return undefined;
    }
    return decorationFor(statusFromNodeUri(uri));
  }

  refresh(): void {
    this.emitter.fire(undefined);
  }

  dispose(): void {
    this.emitter.dispose();
  }
}
