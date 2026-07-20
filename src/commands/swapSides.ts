import * as vscode from 'vscode';
import type { SessionController } from '../session';

/** `meldx.swapSides` — swap left/right and rebuild (O(1) spec transform). */
export function registerSwapSides(controller: SessionController): vscode.Disposable {
  return vscode.commands.registerCommand('meldx.swapSides', () => controller.swap());
}
