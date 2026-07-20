import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type { CancellationToken } from 'vscode';
import type { NodeKind, SideEntry, SideStat } from '../types';
import type { Side } from '../diff/model';
import type { ExcludeMatcher } from '../util/glob';
import { throwIfCancelled } from '../util/cancellation';
import { joinRel } from '../util/pathkey';

/**
 * A {@link Side} backed by the filesystem. Directory listing uses the async
 * `opendir` iterator (low, bounded memory) and honors the exclude matcher.
 * Symlinks are treated as leaf files unless `followSymlinks` is enabled, in
 * which case the target kind is resolved via `stat`.
 */
export class FsSide implements Side {
  constructor(
    readonly root: string,
    readonly label: string,
    private readonly exclude: ExcludeMatcher,
    private readonly followSymlinks: boolean,
  ) {}

  absPath(relPath: string): string {
    return relPath ? path.join(this.root, relPath) : this.root;
  }

  contentUri(relPath: string): vscode.Uri {
    return vscode.Uri.file(this.absPath(relPath));
  }

  async listChildren(relPath: string, token: CancellationToken): Promise<SideEntry[]> {
    let dir: fs.Dir;
    try {
      dir = await fs.promises.opendir(this.absPath(relPath));
    } catch {
      return [];
    }
    const out: SideEntry[] = [];
    for await (const entry of dir) {
      throwIfCancelled(token);
      const childRel = joinRel(relPath, entry.name);
      let kind: NodeKind;
      if (entry.isDirectory()) {
        kind = 'dir';
      } else if (entry.isFile()) {
        kind = 'file';
      } else if (entry.isSymbolicLink()) {
        kind = await this.symlinkKind(childRel);
      } else {
        continue;
      }
      if (this.exclude(childRel, kind)) {
        continue;
      }
      out.push({ name: entry.name, kind });
    }
    return out;
  }

  async stat(relPath: string, token: CancellationToken): Promise<SideStat | null> {
    throwIfCancelled(token);
    try {
      const s = await fs.promises.stat(this.absPath(relPath));
      return { kind: s.isDirectory() ? 'dir' : 'file', size: s.size };
    } catch {
      return null;
    }
  }

  private async symlinkKind(relPath: string): Promise<NodeKind> {
    if (!this.followSymlinks) {
      return 'file';
    }
    try {
      const s = await fs.promises.stat(this.absPath(relPath));
      return s.isDirectory() ? 'dir' : 'file';
    } catch {
      return 'file';
    }
  }
}
