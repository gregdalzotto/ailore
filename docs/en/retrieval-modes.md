# Retrieval modes

[← Docs index](../../README.md) · [Português 🇧🇷](../pt-BR/retrieval-modes.md)

Semantic (vector) search is great at _meaning_ but weak at _exact tokens_ — symbol names, error strings, flags. Lexical **BM25** is the opposite. `ailore` defaults to **hybrid**, fusing both rankings with [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) so a result both rankers like floats to the top — no score calibration needed.

| Mode      | How it ranks                               | Best for                                           |
| --------- | ------------------------------------------ | -------------------------------------------------- |
| `hybrid`  | cosine + BM25, fused via RRF (**default**) | Most queries — robust across phrasing and symbols. |
| `vector`  | pure cosine similarity                     | Conceptual questions with no exact term to match.  |
| `keyword` | pure BM25 (no embedding call)              | Exact identifiers/strings; also the fastest path.  |

## Setting the mode

Per call:

```bash
ailore search --mode keyword "reciprocalRankFusion"   # exact symbol
ailore ask    --mode vector  "how does caching work?"  # conceptual
```

Persistently, in `ailore.config.json`:

```jsonc
{ "retrieval": { "mode": "hybrid" } }
```

Or via the environment: `export AILORE_RETRIEVAL_MODE=hybrid`.

## How the fusion works

For a query, `ailore` produces two independent rankings of the same stored chunks:

1. **Vector** — embeds the query and scores every chunk by cosine similarity.
2. **Lexical (BM25)** — a keyword index built in-memory from the chunk text, with a code-aware tokenizer that splits `camelCase` / `snake_case` while keeping the whole token.

[Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) then combines them by **rank**, not score: each chunk gets `1 / (k + rank)` from each list, summed and re-sorted. A chunk both methods rank highly rises to the top, while the displayed score stays the cosine similarity. Because RRF compares positions, it fuses the two incomparable score scales cleanly.

No re-index is required to use any mode — the BM25 index is rebuilt from the chunks already on disk.

See [How it works](./architecture.md) for the full pipeline.
