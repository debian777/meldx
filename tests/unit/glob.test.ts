import { describe, expect, it } from 'vitest';
import { globToRegExp, makeExcludeMatcher } from '../../src/util/glob';

describe('globToRegExp', () => {
  it('matches a single segment with *', () => {
    expect(globToRegExp('*.txt').test('a.txt')).toBe(true);
    expect(globToRegExp('*.txt').test('dir/a.txt')).toBe(false);
  });

  it('matches across segments with **', () => {
    expect(globToRegExp('**/*.ts').test('src/deep/a.ts')).toBe(true);
    expect(globToRegExp('**/*.ts').test('a.ts')).toBe(true);
  });

  it('matches a single char with ?', () => {
    expect(globToRegExp('a?.js').test('ab.js')).toBe(true);
    expect(globToRegExp('a?.js').test('abc.js')).toBe(false);
  });
});

describe('makeExcludeMatcher', () => {
  it('excludes the .git directory and its contents by default', () => {
    const match = makeExcludeMatcher(['**/.git/**']);
    expect(match('.git', 'dir')).toBe(true);
    expect(match('.git/config', 'file')).toBe(true);
    expect(match('src/index.ts', 'file')).toBe(false);
  });

  it('ignores blank patterns', () => {
    const match = makeExcludeMatcher(['', '  ']);
    expect(match('anything', 'file')).toBe(false);
  });

  it('matches nested node_modules', () => {
    const match = makeExcludeMatcher(['**/node_modules/**']);
    expect(match('packages/a/node_modules/lib/index.js', 'file')).toBe(true);
  });
});
