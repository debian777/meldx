import * as vscode from 'vscode';
import { readConfig } from './config';
import { EMPTY_SCHEME, GIT_SCHEME } from './git/types';
import { GitCli, killAllGitProcesses } from './git/gitCli';
import { EmptyContentProvider, GitContentProvider } from './git/contentProvider';
import { ComparisonsProvider } from './tree/comparisonsProvider';
import { DecorationProvider } from './tree/decorationProvider';
import { SessionController } from './session';
import { DisposableBag } from './util/disposables';
import { disposeLogger, logInfo } from './util/logger';
import { registerCompareFolders } from './commands/compareFolders';
import { registerCompareSelectedFolders } from './commands/compareSelectedFolders';
import { registerCompareWithRef } from './commands/compareWithRef';
import { registerCompareTwoRefs } from './commands/compareTwoRefs';
import { registerNewComparison } from './commands/newComparison';
import { registerRefresh } from './commands/refresh';
import { registerSwapSides } from './commands/swapSides';
import { registerToggleIdentical } from './commands/toggleIdentical';
import { registerOpenDiff } from './commands/openDiff';

export function activate(context: vscode.ExtensionContext): void {
  const bag = new DisposableBag();

  const provider = new ComparisonsProvider();
  bag.add(provider);
  bag.add(
    vscode.window.createTreeView('meldx.comparisons', {
      treeDataProvider: provider,
      showCollapseAll: true,
      canSelectMany: false,
    }),
  );

  const git = new GitCli(readConfig().gitPath);
  const content = new GitContentProvider(git);
  const empty = new EmptyContentProvider();
  const deco = new DecorationProvider();
  bag.add(content);
  bag.add(deco);
  bag.add(vscode.workspace.registerTextDocumentContentProvider(GIT_SCHEME, content));
  bag.add(vscode.workspace.registerTextDocumentContentProvider(EMPTY_SCHEME, empty));
  bag.add(vscode.window.registerFileDecorationProvider(deco));

  const controller = new SessionController(provider, git, content, deco);
  bag.add(controller);

  bag.add(registerCompareFolders(controller));
  bag.add(registerCompareSelectedFolders(controller));
  bag.add(registerCompareWithRef(controller));
  bag.add(registerCompareTwoRefs(controller));
  bag.add(registerNewComparison());
  bag.add(registerRefresh(controller));
  bag.add(registerSwapSides(controller));
  bag.add(registerToggleIdentical());
  bag.add(registerOpenDiff(controller));

  bag.add(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('meldx')) {
        controller.onConfigChanged();
      }
    }),
  );

  context.subscriptions.push(bag);
  logInfo('MeldX activated');
}

export function deactivate(): void {
  killAllGitProcesses();
  disposeLogger();
}
