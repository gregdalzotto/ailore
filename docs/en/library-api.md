# Use as a library

[← Docs index](../../README.md) · [Português 🇧🇷](../pt-BR/library-api.md)

`ailore` is primarily a CLI, but the indexing and retrieval engine is exported so you can embed it in your own tooling.

```ts
import { loadConfig, createEmbeddingProvider, buildIndex, retrieve } from 'ailore';

const config = await loadConfig(process.cwd());
const embedder = createEmbeddingProvider(config);

await buildIndex(process.cwd(), config, embedder);

const hits = await retrieve(process.cwd(), config, embedder, 'how does caching work?');
for (const { chunk, score } of hits) {
  console.log(`${chunk.file}:${chunk.startLine}-${chunk.endLine} (${score.toFixed(3)})`);
}
```

## What's exported

- **Config:** `loadConfig`, `DEFAULTS`, `DEFAULT_MODELS`, `PROVIDERS`, `RETRIEVAL_MODES`, and the `ResolvedConfig` / `Provider` / `RetrievalMode` types.
- **Indexing & retrieval:** `buildIndex`, `retrieve`, `IndexNotFoundError`, `VectorStore`, `resolveIndexDir`.
- **RAG building blocks:** `buildRagMessages`, `formatContext`, `uniqueSources`, `chunkText`, `cosineSimilarity`, `Bm25Index`, `reciprocalRankFusion`, `tokenize`.
- **Providers:** `createChatProvider`, `createEmbeddingProvider`, `ProviderError`.
- **MCP:** `startMcpServer`, `runSearchTool`, `runAskTool`.

All exports are typed; see the bundled `.d.ts` for full signatures.
