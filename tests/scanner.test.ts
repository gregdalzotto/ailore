import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scanFiles } from '../src/core/scanner.js';

describe('scanFiles', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'ailore-scan-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns text files relative to the root', async () => {
    await writeFile(join(dir, 'a.ts'), 'export const a = 1;');
    await writeFile(join(dir, 'b.md'), '# Title');
    const files = await scanFiles(dir, { maxFileSizeBytes: 1_000_000 });
    const names = files.map((f) => f.relPath).sort();
    expect(names).toEqual(['a.ts', 'b.md']);
  });

  it('skips files with binary extensions', async () => {
    await writeFile(join(dir, 'logo.png'), 'not really a png but has the ext');
    await writeFile(join(dir, 'keep.txt'), 'hello');
    const files = await scanFiles(dir, { maxFileSizeBytes: 1_000_000 });
    expect(files.map((f) => f.relPath)).toEqual(['keep.txt']);
  });

  it('skips files larger than the size limit', async () => {
    await writeFile(join(dir, 'big.txt'), 'x'.repeat(2000));
    await writeFile(join(dir, 'small.txt'), 'tiny');
    const files = await scanFiles(dir, { maxFileSizeBytes: 100 });
    expect(files.map((f) => f.relPath)).toEqual(['small.txt']);
  });

  it('respects include globs', async () => {
    await writeFile(join(dir, 'a.ts'), 'a');
    await writeFile(join(dir, 'b.md'), 'b');
    const files = await scanFiles(dir, { include: ['**/*.ts'], maxFileSizeBytes: 1_000_000 });
    expect(files.map((f) => f.relPath)).toEqual(['a.ts']);
  });
});
