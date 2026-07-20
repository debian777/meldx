import type { CancellationToken } from 'vscode';
import { CancellationTokenSource } from 'vscode';
import type { ContentEquality, DiffNode, NodeKind } from '../types';
import { classify } from './classify';
import type { DiffModel, DiffResult } from './model';
import { sortDiffNodes } from './model';
import type { HashPool } from './pool';
import type { FsSide } from '../fs/fsSide';
import { emptyUri } from '../uris';
import { joinRel, pathKey } from '../util/pathkey';

interface Pair {
  name: string;
  left: NodeKind | null;
  right: NodeKind | null;
}

/**
 * Folder ↔ folder comparison, materialized lazily one directory level at a
 * time. `getChildren` merge-joins both sides for a single level, classifies
 * each entry (hashing files only when sizes match), and returns the fully
 * classified level. Directories are neutral containers whose descendants carry
 * the real differences and are classified on demand when expanded.
 */
export class FolderDiffModel implements DiffModel {
  private readonly cts = new CancellationTokenSource();

  constructor(
    private readonly left: FsSide,
    private readonly right: FsSide,
    private readonly pool: HashPool,
    readonly title: string,
  ) {}

  async getChildren(parentRelPath: string): Promise<DiffNode[]> {
    const token = this.cts.token;
    const [leftEntries, rightEntries] = await Promise.all([
      this.left.listChildren(parentRelPath, token),
      this.right.listChildren(parentRelPath, token),
    ]);

    const pairs = new Map<string, Pair>();
    for (const e of leftEntries) {
      pairs.set(pathKey(joinRel(parentRelPath, e.name)), { name: e.name, left: e.kind, right: null });
    }
    for (const e of rightEntries) {
      const key = pathKey(joinRel(parentRelPath, e.name));
      const existing = pairs.get(key);
      if (existing) {
        existing.right = e.kind;
      } else {
        pairs.set(key, { name: e.name, left: null, right: e.kind });
      }
    }

    const nodes: DiffNode[] = [];
    const pending: Array<Promise<void>> = [];
    for (const pair of pairs.values()) {
      const relPath = joinRel(parentRelPath, pair.name);
      // A node is expandable only when neither side is a file.
      const kind: NodeKind = pair.left !== 'file' && pair.right !== 'file' ? 'dir' : 'file';
      const node: DiffNode = {
        id: relPath,
        name: pair.name,
        relPath,
        kind,
        status: 'pending',
        left: pair.left,
        right: pair.right,
      };
      if (pair.left === 'file' && pair.right === 'file') {
        pending.push(
          this.equality(relPath, token).then((eq) => {
            node.status = classify(pair.left, pair.right, eq);
          }),
        );
      } else {
        node.status = classify(pair.left, pair.right, 'unknown');
      }
      nodes.push(node);
    }
    await Promise.all(pending);
    return sortDiffNodes(nodes);
  }

  resolveDiff(node: DiffNode): DiffResult {
    const left = node.left ? this.left.contentUri(node.relPath) : emptyUri(node.relPath);
    const right = node.right ? this.right.contentUri(node.relPath) : emptyUri(node.relPath);
    return { left, right, title: `${node.name} (${this.left.label} ↔ ${this.right.label})` };
  }

  dispose(): void {
    this.cts.cancel();
    this.cts.dispose();
    this.pool.dispose();
  }

  private async equality(relPath: string, token: CancellationToken): Promise<ContentEquality> {
    const [leftStat, rightStat] = await Promise.all([
      this.left.stat(relPath, token),
      this.right.stat(relPath, token),
    ]);
    if (!leftStat || !rightStat) {
      return 'unknown';
    }
    if (leftStat.size !== rightStat.size) {
      return 'different';
    }
    const [a, b] = await Promise.all([
      this.pool.hash(this.left.absPath(relPath), token),
      this.pool.hash(this.right.absPath(relPath), token),
    ]);
    return a === b ? 'equal' : 'different';
  }
}
