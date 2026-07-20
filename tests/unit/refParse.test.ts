import { describe, expect, it } from 'vitest';
import {
  gitCodeToStatus,
  normalizeRef,
  parseLsTreeNameOnlyZ,
  parseNameStatusZ,
} from '../../src/git/refParse';

describe('gitCodeToStatus', () => {
  it('maps known codes', () => {
    expect(gitCodeToStatus('A')).toBe('added');
    expect(gitCodeToStatus('D')).toBe('removed');
    expect(gitCodeToStatus('T')).toBe('type-changed');
    expect(gitCodeToStatus('M')).toBe('modified');
  });

  it('defaults unknown codes to modified', () => {
    expect(gitCodeToStatus('X')).toBe('modified');
    expect(gitCodeToStatus(undefined)).toBe('modified');
  });
});

describe('parseNameStatusZ', () => {
  it('parses simple add/delete/modify records', () => {
    const raw = 'A\0new.txt\0M\0changed.txt\0D\0gone.txt\0';
    expect(parseNameStatusZ(raw)).toEqual([
      { status: 'added', path: 'new.txt' },
      { status: 'modified', path: 'changed.txt' },
      { status: 'removed', path: 'gone.txt' },
    ]);
  });

  it('expands a rename into a removed old path plus an added new path', () => {
    const raw = 'R100\0old/name.ts\0new/name.ts\0';
    expect(parseNameStatusZ(raw)).toEqual([
      { status: 'removed', path: 'old/name.ts' },
      { status: 'added', path: 'new/name.ts' },
    ]);
  });

  it('treats a copy as an added new path', () => {
    const raw = 'C075\0src/a.ts\0src/b.ts\0';
    expect(parseNameStatusZ(raw)).toEqual([{ status: 'added', path: 'src/b.ts' }]);
  });

  it('handles paths with spaces and unicode', () => {
    const raw = 'M\0dir with spaces/файл.txt\0';
    expect(parseNameStatusZ(raw)).toEqual([
      { status: 'modified', path: 'dir with spaces/файл.txt' },
    ]);
  });

  it('returns an empty list for empty input', () => {
    expect(parseNameStatusZ('')).toEqual([]);
  });
});

describe('parseLsTreeNameOnlyZ', () => {
  it('splits NUL-delimited names', () => {
    expect(parseLsTreeNameOnlyZ('a.txt\0dir/b.txt\0')).toEqual(['a.txt', 'dir/b.txt']);
  });
});

describe('normalizeRef', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeRef('  origin/main \n')).toBe('origin/main');
  });
});
