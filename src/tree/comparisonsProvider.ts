import * as vscode from 'vscode';
import type { DiffNode } from '../types';
import { isHiddenWhenIdenticalOff } from '../diff/classify';
import type { DiffModel } from '../diff/model';
import { readConfig } from '../config';
import { nodeUri } from '../uris';

/**
 * Thin `TreeDataProvider` renderer over whatever {@link DiffModel} is active.
 * Holds no comparison logic: it asks the model for children, hides identical
 * files when the toggle is off, and maps each node to a `TreeItem` whose
 * `resourceUri` (a `meldx-node:` URI) drives decoration coloring.
 */
export class ComparisonsProvider implements vscode.TreeDataProvider<DiffNode> {
  private model: DiffModel | undefined;
  private readonly emitter = new vscode.EventEmitter<DiffNode | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;

  setModel(model: DiffModel | undefined): void {
    this.model = model;
    this.emitter.fire(undefined);
  }

  refresh(node?: DiffNode): void {
    this.emitter.fire(node);
  }

  getTreeItem(node: DiffNode): vscode.TreeItem {
    const collapsible =
      node.kind === 'dir'
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None;
    const item = new vscode.TreeItem(nodeUri(node.relPath, node.status), collapsible);
    item.id = node.relPath;
    item.contextValue = node.kind === 'dir' ? 'meldx.dir' : 'meldx.file';
    if (node.kind === 'file') {
      item.command = { command: 'meldx.openDiff', title: 'Open Diff', arguments: [node] };
    }
    return item;
  }

  async getChildren(node?: DiffNode): Promise<DiffNode[]> {
    if (!this.model) {
      return [];
    }
    const parent = node ? node.relPath : '';
    const children = await this.model.getChildren(parent);
    if (readConfig().showIdentical) {
      return children;
    }
    return children.filter((n) => !isHiddenWhenIdenticalOff(n.kind, n.status));
  }

  dispose(): void {
    this.emitter.dispose();
  }
}
