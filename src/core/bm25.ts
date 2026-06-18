/**
 * A lightweight in-memory BM25 lexical index.
 *
 * Vector search is great at meaning but weak at exact tokens — symbol names,
 * error strings, flags, identifiers. BM25 covers exactly that gap, so fusing
 * the two (see {@link reciprocalRankFusion}) gives noticeably better retrieval
 * for code than either alone. The index is rebuilt from the stored chunk text
 * on demand, so it needs no extra persisted state.
 */

/** Standard BM25 free parameters (Robertson/Sparck-Jones defaults). */
const K1 = 1.5;
const B = 0.75;

/**
 * Splits text into lowercase terms with code in mind: it breaks on any
 * non-alphanumeric run AND on camelCase / PascalCase boundaries, while keeping
 * the original compound token too. So `parseConfigFile` yields
 * `parseconfigfile`, `parse`, `config`, `file` — a query for any of those
 * still matches.
 */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[^A-Za-z0-9]+/)) {
    if (!raw) continue;
    const lower = raw.toLowerCase();
    out.push(lower);
    // Split sub-words on camelCase / letter↔digit transitions.
    const parts = raw.split(/(?<=[a-z])(?=[A-Z])|(?<=[A-Za-z])(?=[0-9])|(?<=[0-9])(?=[A-Za-z])/);
    if (parts.length > 1) {
      for (const part of parts) out.push(part.toLowerCase());
    }
  }
  return out;
}

interface Doc {
  id: string;
  tf: Map<string, number>;
  length: number;
}

/** A BM25 index over a set of `{ id, text }` documents (one per chunk). */
export class Bm25Index {
  private constructor(
    private readonly docs: Doc[],
    private readonly df: Map<string, number>,
    private readonly avgLength: number,
  ) {}

  /** Builds the index from chunk-like documents. */
  static build(documents: readonly { id: string; text: string }[]): Bm25Index {
    const docs: Doc[] = [];
    const df = new Map<string, number>();
    let totalLength = 0;

    for (const doc of documents) {
      const tokens = tokenize(doc.text);
      const tf = new Map<string, number>();
      for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
      for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
      docs.push({ id: doc.id, tf, length: tokens.length });
      totalLength += tokens.length;
    }

    const avgLength = docs.length > 0 ? totalLength / docs.length : 0;
    return new Bm25Index(docs, df, avgLength);
  }

  /**
   * Scores every document against `query` and returns `{ id, score }` for the
   * matches (score > 0), sorted from most to least relevant.
   */
  search(query: string): { id: string; score: number }[] {
    const queryTerms = new Set(tokenize(query));
    if (queryTerms.size === 0 || this.docs.length === 0) return [];

    const n = this.docs.length;
    const results: { id: string; score: number }[] = [];

    for (const doc of this.docs) {
      let score = 0;
      for (const term of queryTerms) {
        const freq = doc.tf.get(term);
        if (!freq) continue;
        const docFreq = this.df.get(term) ?? 0;
        // BM25 idf with the +0.5 smoothing that keeps it non-negative.
        const idf = Math.log(1 + (n - docFreq + 0.5) / (docFreq + 0.5));
        const norm = 1 - B + (B * doc.length) / (this.avgLength || 1);
        score += idf * ((freq * (K1 + 1)) / (freq + K1 * norm));
      }
      if (score > 0) results.push({ id: doc.id, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }
}

/**
 * Fuses several ranked id-lists into one combined ranking via Reciprocal Rank
 * Fusion. Each list contributes `1 / (k + rank)` per id; ids ranked highly by
 * multiple rankers float to the top. RRF needs no score calibration between
 * rankers, which is why it fuses cosine similarity and BM25 cleanly despite
 * their incomparable scales.
 *
 * @param rankings  ordered id-lists (best first), one per ranker
 * @param k         damping constant; 60 is the value from the original paper
 */
export function reciprocalRankFusion(rankings: string[][], k = 60): string[] {
  const fused = new Map<string, number>();
  for (const ranking of rankings) {
    for (let rank = 0; rank < ranking.length; rank++) {
      const id = ranking[rank] as string;
      fused.set(id, (fused.get(id) ?? 0) + 1 / (k + rank + 1));
    }
  }
  return [...fused.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
