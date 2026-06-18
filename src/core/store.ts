import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { cosineSimilarity, topKIndices } from './cosine.js';

/** One embedded, citable slice of a source file. */
export interface StoredChunk {
  id: string;
  file: string;
  startLine: number;
  endLine: number;
  text: string;
  vector: number[];
}

/** Per-file bookkeeping that powers incremental re-indexing. */
export interface FileRecord {
  hash: string;
  chunkIds: string[];
}

/**
 * Metadata persisted alongside the chunks.
 *
 * - v1 stored chunk vectors inline in `index.json` (as JSON number arrays).
 * - v2 keeps `index.json` lightweight (metadata + chunk text only) and packs
 *   the vectors into a binary `vectors.bin` sidecar — far smaller on disk and
 *   much faster to load. A v1 index is read transparently and upgraded to v2
 *   on the next save, with no re-embedding.
 */
export interface IndexMeta {
  version: 1 | 2;
  root: string;
  embeddingProvider: string;
  embeddingModel: string;
  dimension: number;
  createdAt: string;
  updatedAt: string;
}

/** A chunk as written to `index.json` — everything except its vector. */
type PersistedChunk = Omit<StoredChunk, 'vector'>;

interface IndexFile {
  meta: IndexMeta;
  files: Record<string, FileRecord>;
  // v1 chunks carry an inline `vector`; v2 chunks do not (it lives in the bin).
  chunks: Array<PersistedChunk & { vector?: number[] }>;
}

/** A single search hit with its similarity score. */
export interface SearchResult {
  chunk: StoredChunk;
  score: number;
}

const INDEX_FILENAME = 'index.json';
const VECTORS_FILENAME = 'vectors.bin';

/** Packs per-chunk vectors into one contiguous little-endian Float32 buffer. */
function packVectors(chunks: StoredChunk[], dimension: number): Buffer {
  const floats = new Float32Array(chunks.length * dimension);
  for (let i = 0; i < chunks.length; i++) {
    floats.set(chunks[i]!.vector, i * dimension);
  }
  return Buffer.from(floats.buffer, floats.byteOffset, floats.byteLength);
}

/** Reads a packed Float32 buffer back into one `number[]` per chunk, in order. */
function unpackVectors(buf: Buffer, count: number, dimension: number): number[][] {
  if (count === 0 || dimension === 0) return Array.from({ length: count }, () => []);
  // Copy into a fresh ArrayBuffer so the Float32Array view is correctly aligned.
  const aligned = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const floats = new Float32Array(aligned);
  const vectors: number[][] = [];
  for (let i = 0; i < count; i++) {
    vectors.push(Array.from(floats.subarray(i * dimension, (i + 1) * dimension)));
  }
  return vectors;
}

/**
 * A file-backed vector store. Embeddings live in a single JSON file under the
 * index directory — no native dependencies, no database to provision. Search is
 * an exact (brute-force) cosine scan, which is fast and accurate for the small-
 * to-medium corpora this tool targets.
 */
export class VectorStore {
  private constructor(
    private readonly indexPath: string,
    private readonly vectorsPath: string,
    public meta: IndexMeta,
    private files: Record<string, FileRecord>,
    private chunks: StoredChunk[],
  ) {}

  /** Loads an existing index from disk, or returns `null` if none exists. */
  static async load(indexDir: string): Promise<VectorStore | null> {
    const indexPath = resolve(indexDir, INDEX_FILENAME);
    const vectorsPath = resolve(indexDir, VECTORS_FILENAME);

    let raw: string;
    try {
      raw = await readFile(indexPath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }

    const data = JSON.parse(raw) as IndexFile;
    let chunks: StoredChunk[];

    if (data.meta.version >= 2) {
      // v2: vectors live in the binary sidecar, in chunk order.
      let buf: Buffer;
      try {
        buf = await readFile(vectorsPath);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new Error(
            `Index is corrupt: "${INDEX_FILENAME}" exists but "${VECTORS_FILENAME}" is missing. Re-run "ailore index".`,
          );
        }
        throw err;
      }
      const vectors = unpackVectors(buf, data.chunks.length, data.meta.dimension);
      chunks = data.chunks.map((c, i) => ({
        id: c.id,
        file: c.file,
        startLine: c.startLine,
        endLine: c.endLine,
        text: c.text,
        vector: vectors[i] as number[],
      }));
    } else {
      // v1: vectors are inline. Kept working as-is; upgraded to v2 on next save.
      chunks = data.chunks.map((c) => ({
        id: c.id,
        file: c.file,
        startLine: c.startLine,
        endLine: c.endLine,
        text: c.text,
        vector: c.vector ?? [],
      }));
    }

    return new VectorStore(indexPath, vectorsPath, data.meta, data.files, chunks);
  }

  /** Creates a fresh, empty index in memory. */
  static create(
    indexDir: string,
    meta: Omit<IndexMeta, 'version' | 'createdAt' | 'updatedAt'>,
    now: string,
  ): VectorStore {
    const indexPath = resolve(indexDir, INDEX_FILENAME);
    const vectorsPath = resolve(indexDir, VECTORS_FILENAME);
    return new VectorStore(
      indexPath,
      vectorsPath,
      { version: 2, createdAt: now, updatedAt: now, ...meta },
      {},
      [],
    );
  }

  get fileCount(): number {
    return Object.keys(this.files).length;
  }

  get chunkCount(): number {
    return this.chunks.length;
  }

  /** Returns the stored hash for a file, if it was indexed before. */
  getFileHash(relPath: string): string | undefined {
    return this.files[relPath]?.hash;
  }

  /** Every file path currently present in the index. */
  indexedFiles(): string[] {
    return Object.keys(this.files);
  }

  /** Replaces all chunks for a file (removing any previous ones). */
  upsertFile(relPath: string, hash: string, chunks: StoredChunk[]): void {
    this.removeFile(relPath);
    this.files[relPath] = { hash, chunkIds: chunks.map((c) => c.id) };
    this.chunks.push(...chunks);
  }

  /** Drops a file and all of its chunks from the index. */
  removeFile(relPath: string): void {
    const record = this.files[relPath];
    if (!record) return;
    const ids = new Set(record.chunkIds);
    this.chunks = this.chunks.filter((c) => !ids.has(c.id));
    delete this.files[relPath];
  }

  /** Returns the `topK` chunks most similar to the query embedding. */
  search(queryVector: number[], topK: number): SearchResult[] {
    if (this.chunks.length === 0) return [];
    const scores = this.chunks.map((c) => cosineSimilarity(queryVector, c.vector));
    return topKIndices(scores, topK).map((index) => ({
      chunk: this.chunks[index] as StoredChunk,
      score: scores[index] as number,
    }));
  }

  /**
   * Scores every chunk against the query embedding and returns them sorted by
   * descending cosine similarity. Hybrid retrieval needs the full vector
   * ranking (not just the top-K) to fuse with the lexical ranking.
   */
  scoreAll(queryVector: number[]): SearchResult[] {
    return this.chunks
      .map((chunk) => ({ chunk, score: cosineSimilarity(queryVector, chunk.vector) }))
      .sort((a, b) => b.score - a.score);
  }

  /** All stored chunks, e.g. for building a lexical (BM25) index. */
  allChunks(): readonly StoredChunk[] {
    return this.chunks;
  }

  /**
   * Persists the index to disk, refreshing `updatedAt`. Always writes the v2
   * format: a lightweight `index.json` (no vectors) plus a `vectors.bin`
   * sidecar. Loading a v1 index and saving therefore upgrades it in place.
   */
  async save(now: string): Promise<void> {
    this.meta.updatedAt = now;
    this.meta.version = 2;
    await mkdir(dirname(this.indexPath), { recursive: true });

    const persistedChunks: PersistedChunk[] = this.chunks.map((c) => ({
      id: c.id,
      file: c.file,
      startLine: c.startLine,
      endLine: c.endLine,
      text: c.text,
    }));
    const data: IndexFile = { meta: this.meta, files: this.files, chunks: persistedChunks };

    await writeFile(this.indexPath, JSON.stringify(data), 'utf-8');
    await writeFile(this.vectorsPath, packVectors(this.chunks, this.meta.dimension));
  }
}

/** Resolves the absolute path to the index directory under `cwd`. */
export function resolveIndexDir(cwd: string, indexDir: string): string {
  return join(resolve(cwd), indexDir);
}
