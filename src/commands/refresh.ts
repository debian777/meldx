import * as vscode from 'vscode';
import type { SessionController } from '../session';

/** `meldx.refresh` — re-run the current comparison and re-read open blobs. */
export function registerRefresh(controller: SessionController): vscode.Disposable {
  return vscode.commands.registerCommand('meldx.refresh', () => controller.refresh());
}
