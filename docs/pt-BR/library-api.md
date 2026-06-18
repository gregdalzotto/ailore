# Uso como biblioteca

[🏠 Início](../../README.pt-BR.md) · [📚 Docs](./README.md) · [English 🇬🇧](../en/library-api.md)

O `ailore` é primariamente uma CLI, mas o motor de indexação e recuperação é exportado para você embuti-lo nas suas próprias ferramentas.

```ts
import { loadConfig, createEmbeddingProvider, buildIndex, retrieve } from 'ailore';

const config = await loadConfig(process.cwd());
const embedder = createEmbeddingProvider(config);

await buildIndex(process.cwd(), config, embedder);

const hits = await retrieve(process.cwd(), config, embedder, 'como funciona o cache?');
for (const { chunk, score } of hits) {
  console.log(`${chunk.file}:${chunk.startLine}-${chunk.endLine} (${score.toFixed(3)})`);
}
```

## O que é exportado

- **Config:** `loadConfig`, `DEFAULTS`, `DEFAULT_MODELS`, `PROVIDERS`, `RETRIEVAL_MODES`, e os tipos `ResolvedConfig` / `Provider` / `RetrievalMode`.
- **Indexação e recuperação:** `buildIndex`, `retrieve`, `IndexNotFoundError`, `VectorStore`, `resolveIndexDir`.
- **Blocos do RAG:** `buildRagMessages`, `formatContext`, `uniqueSources`, `chunkText`, `cosineSimilarity`, `Bm25Index`, `reciprocalRankFusion`, `tokenize`.
- **Provedores:** `createChatProvider`, `createEmbeddingProvider`, `ProviderError`.
- **MCP:** `startMcpServer`, `runSearchTool`, `runAskTool`.

Todos os exports são tipados; veja o `.d.ts` incluído para as assinaturas completas.

<!-- nav-footer -->

---

<div align="center"><sub>[← Anterior: Como funciona](./architecture.md) · [📚 Todos os guias](./README.md) · [Próximo: Perguntas frequentes →](./faq.md)</sub></div>
