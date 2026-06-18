import type { ResolvedConfig } from '../config/schema.js';
import type { EmbeddingProvider } from '../providers/types.js';
import { Bm25Index, reciprocalRankFusion } from './bm25.js';
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

  const k = topK ?? config.retrieval.topK;
  const { mode, minScore } = config.retrieval;

  // Pure semantic search: embed the query, rank by cosine, drop weak chunks.
  if (mode === 'vector') {
    const [queryVector] = await embedder.embed([query]);
    if (!queryVector) return [];
    return store.search(queryVector, k).filter((hit) => hit.score >= minScore);
  }

  // Pure lexical search: BM25 only, no embedding call at all.
  if (mode === 'keyword') {
    const lexical = Bm25Index.build(store.allChunks()).search(query);
    return resultsFromBm25(store, lexical).slice(0, k);
  }

  // Hybrid: fuse the full cosine ranking with the BM25 ranking via RRF. Each
  // result keeps its cosine score (for display), but ordering comes from the
  // fused rank, so exact-token matches that cosine alone would bury surface.
  const [queryVector] = await embedder.embed([query]);
  if (!queryVector) return [];

  const vectorRanked = store.scoreAll(queryVector);
  const scoreById = new Map(vectorRanked.map((r) => [r.chunk.id, r]));
  const vectorRanking = vectorRanked.map((r) => r.chunk.id);
  const lexicalRanking = Bm25Index.build(store.allChunks())
    .search(query)
    .map((hit) => hit.id);

  const fused = reciprocalRankFusion([vectorRanking, lexicalRanking]);
  const results: SearchResult[] = [];
  for (const id of fused) {
    const hit = scoreById.get(id);
    if (hit) results.push(hit);
    if (results.length >= k) break;
  }
  return results;
}

/** Maps BM25 hits back to full `SearchResult`s, carrying the lexical score. */
function resultsFromBm25(
  store: VectorStore,
  lexical: { id: string; score: number }[],
): SearchResult[] {
  const byId = new Map(store.allChunks().map((c) => [c.id, c]));
  const results: SearchResult[] = [];
  for (const { id, score } of lexical) {
    const chunk = byId.get(id);
    if (chunk) results.push({ chunk, score });
  }
  return results;
}
