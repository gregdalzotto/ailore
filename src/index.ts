/**
 * Public library API.
 *
 * ailore is primarily a CLI, but the indexing and retrieval engine is exported
 * so it can be embedded in other tools. Example:
 *
 * ```ts
 * import { loadConfig, createEmbeddingProvider, buildIndex } from 'ailore';
 *
 * const config = await loadConfig(process.cwd());
 * const embedder = createEmbeddingProvider(config);
 * await buildIndex(process.cwd(), config, embedder);
 * ```
 */
export { loadConfig, type ConfigOverrides } from './config/config.js';
export {
  DEFAULT_MODELS,
  DEFAULTS,
  PROVIDERS,
  type FileConfig,
  type Provider,
  type ResolvedConfig,
} from './config/schema.js';

export { buildIndex, type IndexProgress, type IndexResult } from './core/indexer.js';
export { retrieve, IndexNotFoundError } from './core/retriever.js';
export { buildRagMessages, formatContext, uniqueSources } from './core/rag.js';
export { chunkText, type Chunk, type ChunkOptions } from './core/chunker.js';
export { cosineSimilarity, topKIndices } from './core/cosine.js';
export {
  VectorStore,
  resolveIndexDir,
  type SearchResult,
  type StoredChunk,
  type IndexMeta,
} from './core/store.js';

export { createChatProvider, createEmbeddingProvider } from './providers/factory.js';
export {
  ProviderError,
  type ChatMessage,
  type ChatOptions,
  type ChatProvider,
  type EmbeddingProvider,
} from './providers/types.js';
