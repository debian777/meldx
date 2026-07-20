import * as vscode from 'vscode';
import type { SessionController } from '../session';

/** `meldx.compareFolders` — pick a left (base) and right (target) folder. */
export function registerCompareFolders(controller: SessionController): vscode.Disposable {
  return vscode.commands.registerCommand('meldx.compareFolders', async () => {
    const left = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Select Left (Base) Folder',
    });
    if (!left?.[0]) {
      return;
    }
    const right = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Select Right (Target) Folder',
    });
    if (!right?.[0]) {
      return;
    }
    await controller.startFolders(left[0].fsPath, right[0].fsPath);
  });
}
