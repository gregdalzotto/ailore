# Modos de recuperação

[← Índice de docs](../../README.pt-BR.md) · [English 🇬🇧](../en/retrieval-modes.md)

A busca semântica (vetorial) é ótima em _significado_, mas fraca em _tokens exatos_ — nomes de símbolos, mensagens de erro, flags. O **BM25** lexical é o oposto. O `ailore` usa **hybrid** por padrão, fundindo os dois ranqueamentos via [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf): um resultado que ambos gostam sobe ao topo, sem precisar calibrar scores.

| Modo      | Como ranqueia                                 | Melhor para                                            |
| --------- | --------------------------------------------- | ------------------------------------------------------ |
| `hybrid`  | cosseno + BM25, fundidos via RRF (**padrão**) | A maioria das buscas — robusto a frasear e a símbolos. |
| `vector`  | similaridade de cosseno pura                  | Perguntas conceituais sem termo exato a casar.         |
| `keyword` | BM25 puro (sem chamar embeddings)             | Identificadores/strings exatos; também o mais rápido.  |

## Definindo o modo

Por chamada:

```bash
ailore search --mode keyword "reciprocalRankFusion"   # símbolo exato
ailore ask    --mode vector  "como funciona o cache?"  # conceitual
```

De forma persistente, no `ailore.config.json`:

```jsonc
{ "retrieval": { "mode": "hybrid" } }
```

Ou via ambiente: `export AILORE_RETRIEVAL_MODE=hybrid`.

## Como funciona a fusão

Para uma consulta, o `ailore` produz dois ranqueamentos independentes dos mesmos trechos armazenados:

1. **Vetorial** — embeda a consulta e pontua todos os trechos por similaridade de cosseno.
2. **Lexical (BM25)** — um índice de palavra-chave montado em memória a partir do texto dos trechos, com um tokenizador ciente de código que quebra `camelCase` / `snake_case` mantendo também o token inteiro.

O [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) então os combina por **posição (rank)**, não por score: cada trecho recebe `1 / (k + rank)` de cada lista, somado e reordenado. Um trecho que os dois métodos colocam no topo sobe, enquanto o score exibido continua sendo a similaridade de cosseno. Como o RRF compara posições, ele funde as duas escalas de score incomparáveis de forma limpa.

Nenhuma reindexação é necessária para usar qualquer modo — o índice BM25 é reconstruído a partir dos trechos já em disco.

Veja [Como funciona](./architecture.md) para o pipeline completo.
