import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { VectorStore, type StoredChunk } from '../src/core/store.js';

function chunk(id: string, file: string, vector: number[]): StoredChunk {
  return { id, file, startLine: 1, endLine: 1, text: id, vector };
}

describe('VectorStore', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'ailore-test-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns null when loading a non-existent index', async () => {
    expect(await VectorStore.load(dir)).toBeNull();
  });

  it('persists and reloads chunks', async () => {
    const store = VectorStore.create(
      dir,
      { root: dir, embeddingProvider: 'ollama', embeddingModel: 'm', dimension: 2 },
      '2026-01-01T00:00:00.000Z',
    );
    store.upsertFile('a.ts', 'hash-a', [chunk('a.ts:1-1', 'a.ts', [1, 0])]);
    await store.save('2026-01-01T00:00:00.000Z');

    const reloaded = await VectorStore.load(dir);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.chunkCount).toBe(1);
    expect(reloaded!.getFileHash('a.ts')).toBe('hash-a');
  });

  it('upsert replaces previous chunks for the same file', () => {
    const store = VectorStore.create(
      dir,
      { root: dir, embeddingProvider: 'ollama', embeddingModel: 'm', dimension: 2 },
      'now',
    );
    store.upsertFile('a.ts', 'h1', [chunk('a.ts:1-1', 'a.ts', [1, 0])]);
    store.upsertFile('a.ts', 'h2', [
      chunk('a.ts:1-2', 'a.ts', [0, 1]),
      chunk('a.ts:3-4', 'a.ts', [1, 1]),
    ]);
    expect(store.fileCount).toBe(1);
    expect(store.chunkCount).toBe(2);
    expect(store.getFileHash('a.ts')).toBe('h2');
  });

  it('removeFile drops the file and its chunks', () => {
    const store = VectorStore.create(
      dir,
      { root: dir, embeddingProvider: 'ollama', embeddingModel: 'm', dimension: 2 },
      'now',
    );
    store.upsertFile('a.ts', 'h', [chunk('a.ts:1-1', 'a.ts', [1, 0])]);
    store.upsertFile('b.ts', 'h', [chunk('b.ts:1-1', 'b.ts', [0, 1])]);
    store.removeFile('a.ts');
    expect(store.fileCount).toBe(1);
    expect(store.indexedFiles()).toEqual(['b.ts']);
  });

  it('search ranks by cosine similarity', () => {
    const store = VectorStore.create(
      dir,
      { root: dir, embeddingProvider: 'ollama', embeddingModel: 'm', dimension: 2 },
      'now',
    );
    store.upsertFile('x.ts', 'h', [
      chunk('x.ts:1-1', 'x.ts', [1, 0]),
      chunk('x.ts:2-2', 'x.ts', [0, 1]),
    ]);
    const results = store.search([0.9, 0.1], 2);
    expect(results[0]?.chunk.id).toBe('x.ts:1-1');
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
  });

  it('search on an empty store returns nothing', () => {
    const store = VectorStore.create(
      dir,
      { root: dir, embeddingProvider: 'ollama', embeddingModel: 'm', dimension: 2 },
      'now',
    );
    expect(store.search([1, 0], 5)).toEqual([]);
  });
});

describe('VectorStore — v2 binary format & migration', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'ailore-v2-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const exists = (p: string) =>
    access(p).then(
      () => true,
      () => false,
    );

  it('writes a binary sidecar (no inline vectors) and reloads from it', async () => {
    const store = VectorStore.create(
      dir,
      { root: dir, embeddingProvider: 'ollama', embeddingModel: 'm', dimension: 3 },
      'now',
    );
    store.upsertFile('a.ts', 'h', [chunk('a.ts:1-1', 'a.ts', [0.1, 0.2, 0.3])]);
    await store.save('now');

    const idx = JSON.parse(await readFile(join(dir, 'index.json'), 'utf-8'));
    expect(idx.meta.version).toBe(2);
    expect(idx.chunks[0].vector).toBeUndefined();
    expect(await exists(join(dir, 'vectors.bin'))).toBe(true);

    const reloaded = await VectorStore.load(dir);
    const hit = reloaded!.search([0.1, 0.2, 0.3], 1)[0];
    expect(hit!.chunk.id).toBe('a.ts:1-1');
    expect(hit!.score).toBeCloseTo(1);
  });

  it('reads a legacy v1 index and upgrades it to v2 on save (no re-embed)', async () => {
    const v1 = {
      meta: {
        version: 1,
        root: dir,
        embeddingProvider: 'ollama',
        embeddingModel: 'm',
        dimension: 2,
        createdAt: 'now',
        updatedAt: 'now',
      },
      files: { 'a.ts': { hash: 'h', chunkIds: ['a.ts:1-1'] } },
      chunks: [{ id: 'a.ts:1-1', file: 'a.ts', startLine: 1, endLine: 1, text: 't', vector: [1, 0] }],
    };
    await writeFile(join(dir, 'index.json'), JSON.stringify(v1));

    const store = await VectorStore.load(dir);
    expect(store).not.toBeNull();
    expect(store!.search([1, 0], 1)[0]!.chunk.id).toBe('a.ts:1-1');

    await store!.save('now2');
    const idx = JSON.parse(await readFile(join(dir, 'index.json'), 'utf-8'));
    expect(idx.meta.version).toBe(2);
    expect(idx.chunks[0].vector).toBeUndefined();
    expect(await exists(join(dir, 'vectors.bin'))).toBe(true);

    const reloaded = await VectorStore.load(dir);
    expect(reloaded!.search([1, 0], 1)[0]!.chunk.id).toBe('a.ts:1-1');
  });

  it('reports a clear error when the v2 vectors sidecar is missing', async () => {
    const store = VectorStore.create(
      dir,
      { root: dir, embeddingProvider: 'ollama', embeddingModel: 'm', dimension: 2 },
      'now',
    );
    store.upsertFile('a.ts', 'h', [chunk('a.ts:1-1', 'a.ts', [1, 0])]);
    await store.save('now');
    await rm(join(dir, 'vectors.bin'));

    await expect(VectorStore.load(dir)).rejects.toThrow(/vectors\.bin/);
  });
});
