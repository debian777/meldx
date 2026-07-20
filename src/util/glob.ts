import type { NodeKind } from '../types';

/**
 * Minimal glob matcher supporting `**`, `*` and `?`, matched against
 * POSIX-style relative paths. Pure and unit-tested.
 */
export function globToRegExp(pattern: string): RegExp {
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*') {
      if (pattern[i + 1] === '*') {
        // `**` (optionally followed by `/`) matches any number of segments.
        if (pattern[i + 2] === '/') {
          re += '(?:.*/)?';
          i += 2;
        } else {
          re += '.*';
          i += 1;
        }
      } else {
        re += '[^/]*';
      }
    } else if (ch === '?') {
      re += '[^/]';
    } else if (ch !== undefined && '\\^$.|+()[]{}'.includes(ch)) {
      re += `\\${ch}`;
    } else {
      re += ch;
    }
  }
  return new RegExp(`^${re}$`);
}

export type ExcludeMatcher = (relPath: string, kind: NodeKind) => boolean;

/**
 * Build a matcher that returns true when a relative path should be excluded.
 * Directories are also tested with a trailing slash so a pattern like
 * `**\/.git/**` excludes the `.git` directory node itself.
 */
export function makeExcludeMatcher(patterns: string[]): ExcludeMatcher {
  const regexps = patterns
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => globToRegExp(p));
  return (relPath: string, kind: NodeKind): boolean => {
    for (const re of regexps) {
      if (re.test(relPath)) {
        return true;
      }
      if (kind === 'dir' && re.test(`${relPath}/`)) {
        return true;
      }
    }
    return false;
  };
}
