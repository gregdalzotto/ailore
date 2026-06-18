# Como funciona

[🏠 Início](../../README.pt-BR.md) · [📚 Docs](./README.md) · [English 🇬🇧](../en/architecture.md)

```
arquivos ─▶ varredura (.gitignore) ─▶ chunk (por linha) ─▶ embed ─▶ .ailore/index.json
                                                                       │
pergunta ─▶ ┌─ cosseno (semântico) ─┐                                  │
            ├─ BM25 (lexical) ──────┤─ fusão RRF (top-k) ─▶ prompt ─▶ LLM ┘─▶ resposta + citações
            └───────────────────────┘
```

- O **chunking** é alinhado por linha, então todo trecho carrega um intervalo de linhas exato — é isso que torna as citações precisas.
- A **recuperação** é híbrida por padrão: um scan de cosseno exato (força bruta) para significado, um ranqueamento BM25 para tokens exatos, fundidos com [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf). Os dois rodam sobre os mesmos trechos armazenados; o índice BM25 é montado em memória na hora da busca, então não ocupa nada a mais em disco. Troque para `vector` ou `keyword` puros via `retrieval.mode`. Veja [Modos de recuperação](./retrieval-modes.md).
- A reindexação **incremental** faz hash de cada arquivo e pula os inalterados; arquivos deletados são removidos.

## O índice

O índice fica em `.ailore/` — sem banco de dados para rodar, sem módulos nativos:

- **`index.json`** — metadados leves: hashes de conteúdo por arquivo (para atualizações incrementais), o texto do trecho com seu intervalo `arquivo:linhaInicio-linhaFim`, e o modelo de embedding usado.
- **`vectors.bin`** — os embeddings, empacotados como um `Float32Array` binário contíguo na ordem dos chunks. Manter os vetores fora do JSON deixa o `index.json` pequeno e rápido de parsear, então carregar um índice grande é rápido.

Trocar o modelo de embedding dispara uma reconstrução automática, já que vetores de modelos diferentes não são comparáveis.

> [!NOTE]
> Índices antigos de arquivo único (v1) são lidos de forma transparente e atualizados para este layout binário (v2) no próximo `ailore index` — sem reembedar.

## Escala

A busca é um scan de cosseno exato mantido inteiramente em memória — rápido e preciso para bases pequenas e médias (até cerca de dezenas de milhares de chunks). Para monorepos muito grandes, limite o índice às pastas relevantes (`ailore index ./src`) ou use globs de `exclude`. Um índice de vizinhos aproximados (ANN) está no [roadmap](../../README.pt-BR.md#roadmap).

<!-- nav-footer -->

---

<div align="center"><sub>[← Anterior: Integração com editores / MCP](./mcp.md) · [📚 Todos os guias](./README.md) · [Próximo: Segurança →](./security.md)</sub></div>
