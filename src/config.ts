import * as vscode from 'vscode';

/** Effective MeldX configuration, resolved from `workspace.getConfiguration`. */
export interface MeldxConfig {
  exclude: string[];
  showIdentical: boolean;
  gitPath: string | undefined;
  followSymlinks: boolean;
}

export function readConfig(): MeldxConfig {
  const c = vscode.workspace.getConfiguration('meldx');
  const gitPath = (c.get<string>('gitPath', '') ?? '').trim();
  return {
    exclude: c.get<string[]>('exclude', ['**/.git/**']),
    showIdentical: c.get<boolean>('showIdentical', false),
    gitPath: gitPath.length > 0 ? gitPath : undefined,
    followSymlinks: c.get<boolean>('followSymlinks', false),
  };
}

export async function setShowIdentical(value: boolean): Promise<void> {
  await vscode.workspace
    .getConfiguration('meldx')
    .update('showIdentical', value, vscode.ConfigurationTarget.Global);
}
