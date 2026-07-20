import * as vscode from 'vscode';
import { readConfig, setShowIdentical } from '../config';

/** `meldx.toggleIdentical` — flip the "show identical files" setting. The
 *  config-change listener rebuilds the tree, so this handler only flips state. */
export function registerToggleIdentical(): vscode.Disposable {
  return vscode.commands.registerCommand('meldx.toggleIdentical', async () => {
    await setShowIdentical(!readConfig().showIdentical);
  });
}
