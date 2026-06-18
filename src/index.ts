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
  RETRIEVAL_MODES,
  type FileConfig,
  type Provider,
  type ResolvedConfig,
  type RetrievalMode,
} from './config/schema.js';

export { buildIndex, type IndexProgress, type IndexResult } from './core/indexer.js';
export { retrieve, IndexNotFoundError } from './core/retriever.js';
export { buildRagMessages, formatContext, uniqueSources } from './core/rag.js';
export { chunkText, type Chunk, type ChunkOptions } from './core/chunker.js';
export { cosineSimilarity, topKIndices } from './core/cosine.js';
export { Bm25Index, reciprocalRankFusion, tokenize } from './core/bm25.js';
export {
  VectorStore,
  resolveIndexDir,
  type SearchResult,
  type StoredChunk,
  type IndexMeta,
} from './core/store.js';

export { startMcpServer } from './mcp/server.js';
export { runAskTool, runSearchTool, type McpToolContext } from './mcp/tools.js';

export { createChatProvider, createEmbeddingProvider } from './providers/factory.js';
export {
  ProviderError,
  type ChatMessage,
  type ChatOptions,
  type ChatProvider,
  type EmbeddingProvider,
} from './providers/types.js';
