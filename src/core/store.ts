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

/** Metadata persisted alongside the chunks. */
export interface IndexMeta {
  version: 1;
  root: string;
  embeddingProvider: string;
  embeddingModel: string;
  dimension: number;
  createdAt: string;
  updatedAt: string;
}

interface IndexFile {
  meta: IndexMeta;
  files: Record<string, FileRecord>;
  chunks: StoredChunk[];
}

/** A single search hit with its similarity score. */
export interface SearchResult {
  chunk: StoredChunk;
  score: number;
}

const INDEX_FILENAME = 'index.json';

/**
 * A file-backed vector store. Embeddings live in a single JSON file under the
 * index directory — no native dependencies, no database to provision. Search is
 * an exact (brute-force) cosine scan, which is fast and accurate for the small-
 * to-medium corpora this tool targets.
 */
export class VectorStore {
  private constructor(
    private readonly indexPath: string,
    public meta: IndexMeta,
    private files: Record<string, FileRecord>,
    private chunks: StoredChunk[],
  ) {}

  /** Loads an existing index from disk, or returns `null` if none exists. */
  static async load(indexDir: string): Promise<VectorStore | null> {
    const indexPath = resolve(indexDir, INDEX_FILENAME);
    try {
      const raw = await readFile(indexPath, 'utf-8');
      const data = JSON.parse(raw) as IndexFile;
      return new VectorStore(indexPath, data.meta, data.files, data.chunks);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  /** Creates a fresh, empty index in memory. */
  static create(
    indexDir: string,
    meta: Omit<IndexMeta, 'version' | 'createdAt' | 'updatedAt'>,
    now: string,
  ): VectorStore {
    const indexPath = resolve(indexDir, INDEX_FILENAME);
    return new VectorStore(
      indexPath,
      { version: 1, createdAt: now, updatedAt: now, ...meta },
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

  /** Persists the index to disk, refreshing `updatedAt`. */
  async save(now: string): Promise<void> {
    this.meta.updatedAt = now;
    await mkdir(dirname(this.indexPath), { recursive: true });
    const data: IndexFile = { meta: this.meta, files: this.files, chunks: this.chunks };
    await writeFile(this.indexPath, JSON.stringify(data), 'utf-8');
  }
}

/** Resolves the absolute path to the index directory under `cwd`. */
export function resolveIndexDir(cwd: string, indexDir: string): string {
  return join(resolve(cwd), indexDir);
}
