import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import type { CancellationToken } from 'vscode';
import type { GitChange } from './refParse';
import { parseNameStatusZ } from './refParse';

/** In-flight git processes, killed on extension deactivate. */
const active = new Set<ChildProcess>();

/** Terminate every in-flight git process (called from `deactivate`). */
export function killAllGitProcesses(): void {
  for (const child of active) {
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
  active.clear();
}

interface RunResult {
  stdout: Buffer;
  stderr: string;
  code: number;
}

/**
 * Thin, cancellable wrapper around the `git` CLI. Chosen over the `vscode.git`
 * extension API for determinism and testability: no activation dependency, and
 * behavior is identical across VS Code and Cursor.
 */
export class GitCli {
  constructor(private readonly gitPath?: string) {}

  private bin(): string {
    return this.gitPath && this.gitPath.length > 0 ? this.gitPath : 'git';
  }

  private run(args: string[], cwd: string, token?: CancellationToken): Promise<RunResult> {
    return new Promise<RunResult>((resolve, reject) => {
      const child = spawn(this.bin(), args, { cwd });
      active.add(child);
      const out: Buffer[] = [];
      let err = '';
      const sub = token?.onCancellationRequested(() => {
        try {
          child.kill('SIGTERM');
        } catch {
          // ignore
        }
      });
      child.stdout?.on('data', (d: Buffer) => out.push(d));
      child.stderr?.on('data', (d: Buffer) => (err += d.toString()));
      child.on('error', (e) => {
        active.delete(child);
        sub?.dispose();
        reject(e);
      });
      child.on('close', (code) => {
        active.delete(child);
        sub?.dispose();
        resolve({ stdout: Buffer.concat(out), stderr: err, code: code ?? -1 });
      });
    });
  }

  private async runText(args: string[], cwd: string, token?: CancellationToken): Promise<string> {
    const r = await this.run(args, cwd, token);
    if (r.code !== 0) {
      const detail = r.stderr.trim() || `exit code ${r.code}`;
      throw new Error(`git ${args.join(' ')} failed: ${detail}`);
    }
    return r.stdout.toString('utf8');
  }

  /** Preflight: resolve the git version, surfacing a clear "git not found". */
  async version(token?: CancellationToken): Promise<string> {
    try {
      return (await this.runText(['--version'], process.cwd(), token)).trim();
    } catch (e) {
      throw new Error(
        `Unable to run git (${this.bin()}). Install git or set "meldx.gitPath". ${(e as Error).message}`,
      );
    }
  }

  /** Repository root for `cwd`, or throws when it is not inside a git repo. */
  async repoRoot(cwd: string, token?: CancellationToken): Promise<string> {
    return (await this.runText(['-C', cwd, 'rev-parse', '--show-toplevel'], cwd, token)).trim();
  }

  /** Changed files for `refArgs` (`[ref]` vs working tree, or `[refA, refB]`). */
  async diffNameStatus(repoRoot: string, refArgs: string[], token?: CancellationToken): Promise<GitChange[]> {
    const raw = await this.runText(
      ['-C', repoRoot, 'diff', '--name-status', '-z', ...refArgs],
      repoRoot,
      token,
    );
    return parseNameStatusZ(raw);
  }

  /** Blob content for `<ref>:<path>`; empty string when the path is absent. */
  async showBlob(repoRoot: string, ref: string, filePath: string, token?: CancellationToken): Promise<string> {
    const r = await this.run(['-C', repoRoot, 'show', `${ref}:${filePath}`], repoRoot, token);
    return r.code === 0 ? r.stdout.toString('utf8') : '';
  }

  /** Short ref names for a QuickPick (branches, remotes, tags), HEAD first. */
  async listRefs(repoRoot: string, token?: CancellationToken): Promise<string[]> {
    const raw = await this.runText(
      ['-C', repoRoot, 'for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes', 'refs/tags'],
      repoRoot,
      token,
    );
    const refs = raw
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return ['HEAD', ...refs];
  }
}
