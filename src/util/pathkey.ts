/** Path helpers. `relPath` values are POSIX-normalized (`/` separators). */

const CASE_INSENSITIVE = process.platform === 'win32' || process.platform === 'darwin';

/** Convert an OS path fragment to POSIX separators. */
export function toPosix(p: string): string {
  return p.split(/[\\/]+/).join('/');
}

/** Join a POSIX relative parent path with a child name. */
export function joinRel(parent: string, name: string): string {
  return parent ? `${parent}/${name}` : name;
}

/** Basename of a POSIX relative path. */
export function baseName(relPath: string): string {
  const idx = relPath.lastIndexOf('/');
  return idx === -1 ? relPath : relPath.slice(idx + 1);
}

/** Cache/identity key for a relative path, folded for case-insensitive OSes. */
export function pathKey(relPath: string): string {
  return CASE_INSENSITIVE ? relPath.toLowerCase() : relPath;
}
