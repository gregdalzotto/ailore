import type { ResolvedConfig } from '../config/schema.js';
import type { EmbeddingProvider } from '../providers/types.js';
import { resolveIndexDir, VectorStore, type SearchResult } from './store.js';

/** Thrown when a query runs before `ailore index` has created an index. */
export class IndexNotFoundError extends Error {
  constructor(indexDir: string) {
    super(`No index found at "${indexDir}". Run "ailore index" first.`);
    this.name = 'IndexNotFoundError';
  }
}

/** Embeds the query and returns the most relevant stored chunks. */
export async function retrieve(
  cwd: string,
  config: ResolvedConfig,
  embedder: EmbeddingProvider,
  query: string,
  topK?: number,
): Promise<SearchResult[]> {
  const indexDir = resolveIndexDir(cwd, config.indexDir);
  const store = await VectorStore.load(indexDir);
  if (!store) throw new IndexNotFoundError(config.indexDir);

  const [queryVector] = await embedder.embed([query]);
  if (!queryVector) return [];

  const hits = store.search(queryVector, topK ?? config.retrieval.topK);
  // Drop weakly-related chunks so they don't dilute the generation context.
  return hits.filter((hit) => hit.score >= config.retrieval.minScore);
}
