import * as vscode from 'vscode';
import type { SessionController } from '../session';
import { pickRef } from './compareWithRef';

/** `meldx.compareTwoRefs` — compare two git refs against each other. */
export function registerCompareTwoRefs(controller: SessionController): vscode.Disposable {
  return vscode.commands.registerCommand('meldx.compareTwoRefs', async () => {
    const repoRoot = await controller.discoverRepoRoot();
    if (!repoRoot) {
      return;
    }
    const refA = await pickRef(controller, repoRoot, 'Select the left (base) ref');
    if (!refA) {
      return;
    }
    const refB = await pickRef(controller, repoRoot, 'Select the right (target) ref');
    if (!refB) {
      return;
    }
    await controller.startRefRef(repoRoot, refA, refB);
  });
}
