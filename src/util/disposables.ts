import * as vscode from 'vscode';

/** A small bag that disposes everything added to it, in reverse order. */
export class DisposableBag implements vscode.Disposable {
  private items: vscode.Disposable[] = [];

  add<T extends vscode.Disposable>(item: T): T {
    this.items.push(item);
    return item;
  }

  dispose(): void {
    while (this.items.length > 0) {
      const item = this.items.pop();
      try {
        item?.dispose();
      } catch {
        // ignore disposal errors
      }
    }
  }
}
