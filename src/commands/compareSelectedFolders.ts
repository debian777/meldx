import * as vscode from 'vscode';
import type { SessionController } from '../session';

/**
 * `meldx.compareSelectedFolders` — Explorer context command. VS Code passes the
 * clicked resource plus the full multi-selection; we require exactly two.
 */
export function registerCompareSelectedFolders(controller: SessionController): vscode.Disposable {
  return vscode.commands.registerCommand(
    'meldx.compareSelectedFolders',
    async (_clicked: vscode.Uri | undefined, selection: vscode.Uri[] | undefined) => {
      const uris = selection && selection.length > 0 ? selection : _clicked ? [_clicked] : [];
      if (uris.length !== 2) {
        void vscode.window.showErrorMessage('MeldX: Select exactly two folders to compare.');
        return;
      }
      await controller.startFolders(uris[0]!.fsPath, uris[1]!.fsPath);
    },
  );
}
