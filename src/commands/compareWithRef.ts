import * as vscode from 'vscode';
import type { SessionController } from '../session';
import { normalizeRef } from '../git/refParse';

const ENTER_MANUALLY = '$(edit) Enter ref manually…';

/** Prompt the user to choose a ref from the repo (or type one manually). */
export async function pickRef(
  controller: SessionController,
  repoRoot: string,
  placeHolder: string,
): Promise<string | undefined> {
  const refs = await controller.listRefs(repoRoot);
  const pick = await vscode.window.showQuickPick([...refs, ENTER_MANUALLY], { placeHolder });
  if (!pick) {
    return undefined;
  }
  if (pick === ENTER_MANUALLY) {
    const entered = await vscode.window.showInputBox({
      prompt: 'Enter a git ref (branch, tag, or commit-ish)',
      placeHolder: 'e.g. main, origin/main, HEAD~3, <sha>',
    });
    return entered ? normalizeRef(entered) : undefined;
  }
  return normalizeRef(pick);
}

/** `meldx.compareWithRef` — compare a ref against the working tree. */
export function registerCompareWithRef(controller: SessionController): vscode.Disposable {
  return vscode.commands.registerCommand('meldx.compareWithRef', async () => {
    const repoRoot = await controller.discoverRepoRoot();
    if (!repoRoot) {
      return;
    }
    const ref = await pickRef(controller, repoRoot, 'Compare this ref against the working tree');
    if (!ref) {
      return;
    }
    await controller.startRefWorktree(repoRoot, ref);
  });
}
