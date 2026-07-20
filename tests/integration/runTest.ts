import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

/**
 * Downloads (once) and launches a headless VS Code, pointing it at this
 * extension and the compiled Mocha suite. On Linux CI this must be wrapped in
 * `xvfb-run -a`.
 */
async function main(): Promise<void> {
  try {
    // out-test/tests/integration → repo root is three levels up.
    const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
    const extensionTestsPath = path.resolve(__dirname, './index');
    // VS Code creates a Unix domain socket under the user-data-dir; on macOS/Linux
    // that path must stay under ~103 chars, so keep it short and outside the repo.
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mxu-'));
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--user-data-dir', userDataDir],
    });
  } catch (err) {
    console.error('Failed to run integration tests:', err);
    process.exit(1);
  }
}

void main();
