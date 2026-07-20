import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

function getChannel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel('MeldX');
  }
  return channel;
}

export function logInfo(message: string): void {
  getChannel().appendLine(`[info] ${message}`);
}

export function logError(message: string, err?: unknown): void {
  const suffix = err === undefined ? '' : `: ${err instanceof Error ? err.message : String(err)}`;
  getChannel().appendLine(`[error] ${message}${suffix}`);
}

export function disposeLogger(): void {
  channel?.dispose();
  channel = undefined;
}
