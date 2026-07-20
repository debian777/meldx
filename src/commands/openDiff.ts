import * as vscode from 'vscode';
import type { DiffNode } from '../types';
import type { SessionController } from '../session';

/** `meldx.openDiff` — open the native diff editor for a file node. */
export function registerOpenDiff(controller: SessionController): vscode.Disposable {
  return vscode.commands.registerCommand('meldx.openDiff', (node: DiffNode) => {
    controller.openDiff(node);
  });
}
