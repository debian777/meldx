import { describe, expect, it } from 'vitest';
import { decodeGitQuery, encodeGitQuery } from '../../src/git/uri';

describe('git uri query encode/decode', () => {
  it('round-trips repoRoot, ref and path', () => {
    const parts = { repoRoot: '/home/u/proj', ref: 'origin/main', path: 'src/a.ts' };
    expect(decodeGitQuery(encodeGitQuery(parts))).toEqual(parts);
  });

  it('preserves refs and paths containing colons, slashes and spaces', () => {
    const parts = { repoRoot: '/tmp/re po', ref: 'HEAD~3', path: 'dir with spaces/файл:v2.txt' };
    expect(decodeGitQuery(encodeGitQuery(parts))).toEqual(parts);
  });

  it('decodes missing keys to empty strings', () => {
    expect(decodeGitQuery('')).toEqual({ repoRoot: '', ref: '', path: '' });
  });
});
