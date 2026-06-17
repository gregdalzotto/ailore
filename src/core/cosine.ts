/**
 * Cosine similarity between two equal-length vectors.
 *
 * Returns a value in [-1, 1] where 1 means identical direction. Used to rank
 * stored chunks against a query embedding. Throws on a length mismatch so a
 * misconfigured embedding model is caught early instead of silently scoring 0.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] as number;
    const bv = b[i] as number;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Returns the indices of the `k` highest scores, sorted descending. */
export function topKIndices(scores: number[], k: number): number[] {
  return scores
    .map((score, index) => ({ score, index }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k)
    .map((item) => item.index);
}
