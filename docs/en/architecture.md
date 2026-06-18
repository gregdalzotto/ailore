# How it works

[🏠 Home](../../README.md) · [📚 Docs](./README.md) · [Português 🇧🇷](../pt-BR/architecture.md)

```
files ──▶ scan (respect .gitignore) ──▶ chunk (line-aligned) ──▶ embed ──▶ .ailore/index.json
                                                                              │
query ──▶ ┌─ cosine (semantic) ─┐                                            │
          ├─ BM25 (lexical) ────┤─ RRF fuse (top-k) ─▶ grounded prompt ─▶ LLM ┘──▶ answer + citations
          └─────────────────────┘
```

- **Chunking** is line-aligned so every chunk carries an exact line range — that's what makes citations precise.
- **Retrieval** is hybrid by default: an exact (brute-force) cosine scan for meaning, a BM25 ranking for exact tokens, fused with [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf). Both rankings run over the same stored chunks; the BM25 index is built in-memory at query time, so it needs nothing extra on disk. Switch to pure `vector` or `keyword` with `retrieval.mode`. See [Retrieval modes](./retrieval-modes.md).
- **Incremental** re-indexing hashes each file and skips unchanged ones; deleted files are pruned.

## The index

The index is a single `.ailore/index.json` file — no database to run, no native modules. It holds per-file content hashes (for incremental updates), the embedded chunks with their `path:startLine-endLine` ranges, and metadata about the embedding model used. Changing the embedding model triggers an automatic rebuild, since vectors from different models aren't comparable.

## Scale

Search is an exact cosine scan kept fully in memory — fast and accurate for small-to-medium codebases (up to roughly tens of thousands of chunks). For very large monorepos, scope the index to the relevant folders (`ailore index ./src`) or use `exclude` globs. An approximate-nearest-neighbour index is on the [roadmap](../../README.md#roadmap).

<!-- nav-footer -->

---

<div align="center"><sub>[← Prev: Editor / MCP integration](./mcp.md) · [📚 All guides](./README.md) · [Next: Use as a library →](./library-api.md)</sub></div>
