import type { DiffNode, NodeKind, NodeStatus } from '../types';
import type { DiffModel, DiffResult, Side } from '../diff/model';
import { sortDiffNodes } from '../diff/model';
import { emptyUri } from '../uris';
import type { GitChange } from './refParse';

function sidesFor(status: NodeStatus): { left: NodeKind | null; right: NodeKind | null } {
  if (status === 'added') {
    return { left: null, right: 'file' };
  }
  if (status === 'removed') {
    return { left: 'file', right: null };
  }
  return { left: 'file', right: 'file' };
}

/**
 * ref ↔ ref or ref ↔ working-tree comparison. Status comes directly from
 * `git diff --name-status` (no folder hashing); this class turns that flat list
 * of changed files into a nested tree, grouping by directory. Directories that
 * contain changes are shown as modified containers. Because git only reports
 * changed paths, identical files never appear here.
 */
export class GitDiffModel implements DiffModel {
  private readonly childrenByParent = new Map<string, DiffNode[]>();
  private readonly seen = new Set<string>();

  constructor(
    changes: GitChange[],
    private readonly left: Side,
    private readonly right: Side,
    readonly title: string,
  ) {
    for (const change of changes) {
      this.insert(change);
    }
  }

  private insert(change: GitChange): void {
    const segments = change.path.split('/');
    let parent = '';
    for (let i = 0; i < segments.length - 1; i++) {
      const name = segments[i] as string;
      const rel = parent ? `${parent}/${name}` : name;
      if (!this.seen.has(rel)) {
        this.seen.add(rel);
        this.addChild(parent, {
          id: rel,
          name,
          relPath: rel,
          kind: 'dir',
          status: 'modified',
          left: 'dir',
          right: 'dir',
        });
      }
      parent = rel;
    }
    const rel = change.path;
    if (this.seen.has(rel)) {
      return;
    }
    this.seen.add(rel);
    const name = segments[segments.length - 1] as string;
    const sides = sidesFor(change.status);
    this.addChild(parent, {
      id: rel,
      name,
      relPath: rel,
      kind: 'file',
      status: change.status,
      left: sides.left,
      right: sides.right,
    });
  }

  private addChild(parent: string, node: DiffNode): void {
    const list = this.childrenByParent.get(parent);
    if (list) {
      list.push(node);
    } else {
      this.childrenByParent.set(parent, [node]);
    }
  }

  getChildren(parentRelPath: string): Promise<DiffNode[]> {
    return Promise.resolve(sortDiffNodes(this.childrenByParent.get(parentRelPath) ?? []));
  }

  resolveDiff(node: DiffNode): DiffResult | undefined {
    if (node.kind !== 'file') {
      return undefined;
    }
    const left = node.left ? this.left.contentUri(node.relPath) : emptyUri(node.relPath);
    const right = node.right ? this.right.contentUri(node.relPath) : emptyUri(node.relPath);
    return { left, right, title: `${node.name} (${this.left.label} ↔ ${this.right.label})` };
  }

  dispose(): void {
    this.childrenByParent.clear();
    this.seen.clear();
  }
}
