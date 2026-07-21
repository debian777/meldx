import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

const EXTENSION_ID = 'debian777.meldx';

const EXPECTED_COMMANDS = [
  'meldx.newComparison',
  'meldx.compareFolders',
  'meldx.compareSelectedFolders',
  'meldx.compareWithRef',
  'meldx.compareTwoRefs',
  'meldx.refresh',
  'meldx.swapSides',
  'meldx.toggleIdentical',
  'meldx.openDiff',
];

describe('MeldX extension', () => {
  before(async () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `extension ${EXTENSION_ID} should be present`);
    await ext!.activate();
  });

  it('activates', () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.strictEqual(ext?.isActive, true);
  });

  it('registers all contributed commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    for (const command of EXPECTED_COMMANDS) {
      assert.ok(commands.includes(command), `missing command: ${command}`);
    }
  });

  it('serves an empty document for the meldx-empty scheme', async () => {
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse('meldx-empty:/absent.txt'));
    assert.strictEqual(doc.getText(), '');
  });

  it('opens a native diff editor for two folder files', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'meldx-it-'));
    const left = path.join(dir, 'left.txt');
    const right = path.join(dir, 'right.txt');
    fs.writeFileSync(left, 'hello\n');
    fs.writeFileSync(right, 'hello world\n');

    await vscode.commands.executeCommand(
      'vscode.diff',
      vscode.Uri.file(left),
      vscode.Uri.file(right),
      'MeldX integration diff',
    );

    assert.ok(vscode.window.tabGroups.activeTabGroup.activeTab, 'a diff tab should be open');
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    // On Windows the editor releases its file handle asynchronously after
    // close, so an immediate delete can hit EPERM; retry with backoff.
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
});
