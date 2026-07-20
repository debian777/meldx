import type { CancellationToken } from 'vscode';

/** Error thrown when an operation is cancelled via a CancellationToken. */
export class CancelledError extends Error {
  constructor() {
    super('Operation cancelled');
    this.name = 'CancelledError';
  }
}

export function isCancelledError(err: unknown): boolean {
  return err instanceof CancelledError;
}

export function throwIfCancelled(token: CancellationToken): void {
  if (token.isCancellationRequested) {
    throw new CancelledError();
  }
}
