# Configuração

[🏠 Início](../../README.pt-BR.md) · [📚 Docs](./README.md) · [English 🇬🇧](../en/configuration.md)

O `ailore` resolve a configuração nesta ordem (o último vence):

**padrões internos → `ailore.config.json` → variáveis de ambiente → flags de CLI**

API keys são lidas **somente** do ambiente, nunca do arquivo de config, para que segredos jamais sejam commitados.

## Arquivo de config

Rode `ailore init` para criar um, depois edite:

```jsonc
// ailore.config.json
{
  "provider": "ollama",
  "embeddingProvider": "ollama",
  "chatModel": "llama3.1",
  "embeddingModel": "nomic-embed-text",
  "retrieval": { "topK": 6, "minScore": 0, "mode": "hybrid" },
  "generation": { "temperature": 0.2, "maxTokens": 1024, "topP": 1, "seed": 42 },
  "chunk": { "maxChars": 1200, "overlapLines": 2 },
  "exclude": ["**/*.test.ts"],
}
```

## Ajuste de geração e recuperação

Nada é hardcoded — todo parâmetro relevante pode ser definido no arquivo de config, via variável de ambiente ou por chamada com uma flag (a flag vence). Útil para equilibrar custo, determinismo e tamanho da resposta:

| Parâmetro    | Config / Env / Flag                                                   | Padrão             | O que faz                                                                                                       |
| ------------ | --------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Temperatura  | `generation.temperature` · `AILORE_TEMPERATURE` · `-t, --temperature` | `0.2`              | Aleatoriedade. Mantenha baixo para respostas factuais e fundamentadas.                                          |
| Máx. tokens  | `generation.maxTokens` · `AILORE_MAX_TOKENS` · `--max-tokens`         | padrão do provedor | Limita o tamanho da resposta.                                                                                   |
| Top-p        | `generation.topP` · `AILORE_TOP_P` · `--top-p`                        | padrão do provedor | Corte do nucleus sampling (0–1).                                                                                |
| Seed         | `generation.seed` · `AILORE_SEED` · `--seed`                          | nenhum             | Fixe para respostas **reprodutíveis** (mesma pergunta → mesma saída).                                           |
| Top-k        | `retrieval.topK` · `-k, --top-k`                                      | `6`                | Quantos trechos alimentar o modelo.                                                                             |
| Score mínimo | `retrieval.minScore` · `AILORE_MIN_SCORE` · `--min-score`             | `0`                | Descarta trechos abaixo desse score de cosseno para que correspondências fracas não diluam o contexto.          |
| Modo         | `retrieval.mode` · `AILORE_RETRIEVAL_MODE` · `--mode`                 | `hybrid`           | Estratégia de ranqueamento: `vector`, `keyword` ou `hybrid`. Veja [Modos de recuperação](./retrieval-modes.md). |

```bash
# Resposta determinística e concisa
ailore ask --seed 42 --temperature 0 --max-tokens 300 "o que o cache faz?"

# Usar apenas contexto fortemente relevante
ailore ask --min-score 0.35 -k 10 "como o rate limiting é configurado?"

# Achar um símbolo exato rápido, sem ida ao modelo de embedding
ailore search --mode keyword "reciprocalRankFusion"
```

## O que é indexado

Os arrays de globs `include` / `exclude` controlam o corpus. O `ailore` sempre respeita o `.gitignore` e pula binários. Exemplo — indexar código mas não markdown:

```jsonc
{ "exclude": ["**/*.md"] }
```

## Variáveis de ambiente

| Variável de ambiente                                             | Função                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| `OPENAI_API_KEY`                                                 | Autenticação OpenAI                                  |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY`                              | Autenticação Gemini                                  |
| `OPENROUTER_API_KEY`                                             | Autenticação OpenRouter                              |
| `OLLAMA_BASE_URL`                                                | Endpoint do Ollama (padrão `http://localhost:11434`) |
| `AILORE_PROVIDER`, `AILORE_CHAT_MODEL`, `AILORE_EMBEDDING_MODEL` | Override sem flags                                   |
| `AILORE_RETRIEVAL_MODE`                                          | Modo de recuperação: `vector` / `keyword` / `hybrid` |

> [!TIP]
> Exporte `AILORE_CHAT_MODEL` / `AILORE_EMBEDDING_MODEL` no perfil do seu shell para definir padrões na máquina inteira e dispensar config por projeto.

<!-- nav-footer -->

---

<div align="center"><sub>[← Anterior: Comandos](./commands.md) · [📚 Todos os guias](./README.md) · [Próximo: Modos de recuperação →](./retrieval-modes.md)</sub></div>
