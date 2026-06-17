import type { ResolvedConfig } from '../config/schema.js';
import type { EmbeddingProvider } from '../providers/types.js';
import { chunkText } from './chunker.js';
import { hashContent } from './hash.js';
import { scanFiles } from './scanner.js';
import { resolveIndexDir, VectorStore, type StoredChunk } from './store.js';

export interface IndexProgress {
  phase: 'scan' | 'embed' | 'save' | 'done';
  /** Files that changed and are being (re)embedded. */
  changed: number;
  /** Files removed since the last index. */
  removed: number;
  /** Files skipped because their content was unchanged. */
  unchanged: number;
  /** Total chunks embedded in this run. */
  embeddedChunks: number;
}

export interface IndexResult {
  fileCount: number;
  chunkCount: number;
  changed: number;
  removed: number;
  unchanged: number;
}

/** How many chunks to embed per provider request. */
const EMBED_BATCH_SIZE = 64;

/**
 * Builds (or incrementally updates) the index for `root`.
 *
 * Only files whose content hash changed since the previous run are re-embedded;
 * deleted files are pruned. This makes re-indexing a large repo cheap after the
 * first pass.
 */
export async function buildIndex(
  cwd: string,
  config: ResolvedConfig,
  embedder: EmbeddingProvider,
  onProgress?: (progress: IndexProgress) => void,
): Promise<IndexResult> {
  const now = new Date().toISOString();
  const indexDir = resolveIndexDir(cwd, config.indexDir);

  onProgress?.({ phase: 'scan', changed: 0, removed: 0, unchanged: 0, embeddedChunks: 0 });
  const files = await scanFiles(cwd, {
    include: config.include,
    exclude: config.exclude,
    maxFileSizeBytes: config.maxFileSizeBytes,
  });

  // Reuse an existing index when its embedding model still matches; otherwise
  // start fresh so we never mix vectors from incompatible models.
  let store = await VectorStore.load(indexDir);
  if (
    store &&
    (store.meta.embeddingModel !== config.embeddingModel ||
      store.meta.embeddingProvider !== config.embeddingProvider)
  ) {
    store = null;
  }
  if (!store) {
    store = VectorStore.create(
      indexDir,
      {
        root: cwd,
        embeddingProvider: config.embeddingProvider,
        embeddingModel: config.embeddingModel,
        dimension: 0,
      },
      now,
    );
  }

  // Determine which files changed, and prune files that disappeared.
  const present = new Set(files.map((f) => f.relPath));
  let removed = 0;
  for (const indexed of store.indexedFiles()) {
    if (!present.has(indexed)) {
      store.removeFile(indexed);
      removed++;
    }
  }

  const pending: { relPath: string; hash: string; chunks: ReturnType<typeof chunkText> }[] = [];
  let unchanged = 0;
  for (const file of files) {
    const hash = hashContent(file.content);
    if (store.getFileHash(file.relPath) === hash) {
      unchanged++;
      continue;
    }
    pending.push({ relPath: file.relPath, hash, chunks: chunkText(file.content, config.chunk) });
  }

  onProgress?.({
    phase: 'embed',
    changed: pending.length,
    removed,
    unchanged,
    embeddedChunks: 0,
  });

  // Flatten every pending chunk into one queue, embed in batches, then map the
  // resulting vectors back onto their files.
  const flat = pending.flatMap((file) => file.chunks.map((chunk) => ({ file, chunk })));
  const vectors: number[][] = [];
  for (let i = 0; i < flat.length; i += EMBED_BATCH_SIZE) {
    const batch = flat.slice(i, i + EMBED_BATCH_SIZE);
    const embedded = await embedder.embed(batch.map((item) => item.chunk.text));
    vectors.push(...embedded);
    onProgress?.({
      phase: 'embed',
      changed: pending.length,
      removed,
      unchanged,
      embeddedChunks: vectors.length,
    });
  }

  if (vectors.length > 0 && (vectors[0] as number[]).length > 0) {
    store.meta.dimension = (vectors[0] as number[]).length;
  }

  let cursor = 0;
  for (const file of pending) {
    const storedChunks: StoredChunk[] = file.chunks.map((chunk) => {
      const vector = vectors[cursor++] as number[];
      return {
        id: `${file.relPath}:${chunk.startLine}-${chunk.endLine}`,
        file: file.relPath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        text: chunk.text,
        vector,
      };
    });
    store.upsertFile(file.relPath, file.hash, storedChunks);
  }

  onProgress?.({
    phase: 'save',
    changed: pending.length,
    removed,
    unchanged,
    embeddedChunks: vectors.length,
  });
  await store.save(now);

  onProgress?.({
    phase: 'done',
    changed: pending.length,
    removed,
    unchanged,
    embeddedChunks: vectors.length,
  });

  return {
    fileCount: store.fileCount,
    chunkCount: store.chunkCount,
    changed: pending.length,
    removed,
    unchanged,
  };
}
