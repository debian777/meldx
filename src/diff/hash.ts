import { createReadStream } from 'fs';
import { createHash } from 'crypto';
import type { CancellationToken } from 'vscode';
import { CancelledError } from '../util/cancellation';

/**
 * Streamed SHA-1 of a file's raw bytes. Never reads the whole file into memory
 * (`createReadStream` → `crypto` on the libuv threadpool), and aborts promptly
 * when the token is cancelled. Content is hashed byte-for-byte, so line-ending
 * differences (CRLF vs LF) are treated as content differences by design.
 */
export function hashFile(absPath: string, token: CancellationToken): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash('sha1');
    const stream = createReadStream(absPath);
    const sub = token.onCancellationRequested(() => {
      stream.destroy();
      reject(new CancelledError());
    });
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', (err) => {
      sub.dispose();
      reject(err);
    });
    stream.on('end', () => {
      sub.dispose();
      resolve(hash.digest('hex'));
    });
  });
}
