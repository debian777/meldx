import * as vscode from 'vscode';

/**
 * `meldx.newComparison` — always-available entry point to start a fresh
 * comparison once one is already active (the welcome-view links only show
 * while the tree is empty). Presents the three comparison types as a quick
 * pick and delegates to the existing command.
 */
export function registerNewComparison(): vscode.Disposable {
  return vscode.commands.registerCommand('meldx.newComparison', async () => {
    const picks: Array<vscode.QuickPickItem & { command: string }> = [
      {
        label: '$(file-directory) Compare Folders…',
        detail: 'Pick a left (base) and right (target) folder.',
        command: 'meldx.compareFolders',
      },
      {
        label: '$(git-compare) Compare With Git Ref (Working Tree)…',
        detail: 'Diff the working tree against a branch, tag, or commit.',
        command: 'meldx.compareWithRef',
      },
      {
        label: '$(git-branch) Compare Two Git Refs…',
        detail: 'Diff two branches, tags, or commits against each other.',
        command: 'meldx.compareTwoRefs',
      },
    ];
    const choice = await vscode.window.showQuickPick(picks, {
      title: 'MeldX: New Comparison',
      placeHolder: 'Choose what to compare',
    });
    if (!choice) {
      return;
    }
    await vscode.commands.executeCommand(choice.command);
  });
}
