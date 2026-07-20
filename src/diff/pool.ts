import * as os from 'os';
import type { CancellationToken } from 'vscode';
import { hashFile } from './hash';

/** A bounded content-hash pool with a per-session digest cache. */
export interface HashPool {
  hash(absPath: string, token: CancellationToken): Promise<string>;
  dispose(): void;
}

/**
 * Default async implementation. Hashing already runs on the libuv threadpool,
 * so a bounded async I/O pool saturates disk without worker-thread startup or
 * serialization cost, and shares one in-process cache. The cache is keyed by
 * absolute path and is valid for the lifetime of a single session (a refresh
 * builds a fresh pool).
 */
export class AsyncHashPool implements HashPool {
  private readonly cache = new Map<string, Promise<string>>();
  private active = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private readonly concurrency: number = Math.min(os.cpus().length, 8)) {}

  hash(absPath: string, token: CancellationToken): Promise<string> {
    const cached = this.cache.get(absPath);
    if (cached) {
      return cached;
    }
    const p = this.run(absPath, token);
    this.cache.set(absPath, p);
    return p;
  }

  private async run(absPath: string, token: CancellationToken): Promise<string> {
    await this.acquire();
    try {
      return await hashFile(absPath, token);
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.active < this.concurrency) {
      this.active++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.waiters.push(() => {
        this.active++;
        resolve();
      });
    });
  }

  private release(): void {
    this.active--;
    const next = this.waiters.shift();
    if (next) {
      next();
    }
  }

  dispose(): void {
    this.cache.clear();
    this.waiters.length = 0;
  }
}
