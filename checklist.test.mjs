import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('./checklist.mjs', import.meta.url));
const SEED = [
  { id: 1, text: 'a', done: false },
  { id: 2, text: 'b', done: true },
  { id: 3, text: 'c', done: false },
];

let dir;
let file;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'checklist-'));
  file = join(dir, 'checklist.json');
});

afterEach(() => {
  rmSync(dir, { recursive: true });
});

function run(args) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    env: { ...process.env, CHECKLIST_FILE: file },
    encoding: 'utf8',
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const seed = () => writeFileSync(file, `${JSON.stringify(SEED, null, 2)}\n`);

test('cli remove deletes the item from the stored file', () => {
  seed();
  run(['remove', '2']);
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), [SEED[0], SEED[2]]);
});

test('cli remove succeeds silently', () => {
  seed();
  assert.deepEqual(run(['remove', '2']), { status: 0, stdout: '', stderr: '' });
});

test('cli remove reports an unknown id', () => {
  seed();
  const result = run(['remove', '9']);
  assert.equal(result.status, 1);
  assert.equal(result.stderr, 'error: no item 9\n');
});

test('cli remove leaves the file unchanged on unknown id', () => {
  seed();
  const before = readFileSync(file);
  run(['remove', '9']);
  assert.ok(before.equals(readFileSync(file)));
});

test('cli remove on a missing file reports an unknown id', () => {
  const result = run(['remove', '1']);
  assert.equal(result.status, 1);
  assert.equal(result.stderr, 'error: no item 1\n');
  assert.equal(existsSync(file), false);
});

test('cli removing the only item leaves an empty checklist', () => {
  run(['add', 'milk']);
  run(['remove', '1']);
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), []);
  assert.equal(run(['list']).stdout, 'The checklist is empty.\n');
});

test('cli usage lists remove <id>', () => {
  assert.match(run(['frobnicate']).stderr, /remove <id>/);
});
