<div align="center">

# ailore

**Busca semântica e RAG local-first para seu código e documentação.**

Faça perguntas em linguagem natural e receba respostas fundamentadas nos _seus próprios arquivos_ — com citações exatas no formato `arquivo:linha`. Funciona 100% offline com [Ollama](https://ollama.com), ou com OpenAI, Gemini e OpenRouter.

[![CI](https://github.com/gregdalzotto/ailore/actions/workflows/ci.yml/badge.svg)](https://github.com/gregdalzotto/ailore/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

[English 🇬🇧](./README.md)

</div>

---

## Por que o nome?

**`ailore` = AI + lore.**

Em inglês, _lore_ significa o conhecimento acumulado — muitas vezes informal — sobre algo: aquele entendimento que fica enterrado numa base de código e normalmente só vive na cabeça de quem está há mais tempo no projeto (_"the lore of this project"_). É exatamente esse conhecimento escondido e difícil de extrair que esta ferramenta traz à tona: ela lê seus arquivos e os transforma em respostas que você pode pedir em linguagem natural. O prefixo `ai` deixa o propósito explícito. Curto, fácil de digitar e de lembrar: `ailore ask "como funciona o auth?"`.

## O que faz

- 🔍 **Busca semântica** em qualquer pasta de código ou documentação.
- 💬 **Respostas fundamentadas** (RAG): pergunte e receba uma resposta sintetizada que **cita as linhas de origem** usadas.
- 🔒 **Local-first**: com Ollama, nada sai da sua máquina — sem API key, sem custo.
- 🔌 **Agnóstico de provedor**: alterne entre Ollama, OpenAI, Gemini e OpenRouter com uma flag.
- ⚡ **Indexação incremental**: só os arquivos alterados são re-embedados, então reindexar um repo grande é barato.
- 📎 **Citações confiáveis**: todo trecho aponta para `arquivo:linhaInicio-linhaFim`, então você pode verificar a resposta.
- 🪶 **Sem dependências pesadas**: o índice é um arquivo simples, sem banco para rodar, sem módulos nativos.

## Instalação

```bash
npm install -g ailore
# ou rode sem instalar:
npx ailore --help
```

Requer **Node.js >= 20**.

## Início rápido (100% local, sem API key)

1. Instale o [Ollama](https://ollama.com) e baixe um modelo de chat e um de embedding:

   ```bash
   ollama pull llama3.1
   ollama pull nomic-embed-text
   ```

2. Indexe um projeto e comece a perguntar:

   ```bash
   cd meu-projeto
   ailore index
   ailore ask "onde está implementado o rate limiter?"
   ```

Pronto. O índice é gravado em `.ailore/` no diretório atual.

## Uso

### `ailore index [caminho]`

Varre o diretório (respeitando o `.gitignore`), divide os arquivos em chunks alinhados por linha, gera embeddings e armazena tudo localmente. Reexecutar só re-embeda arquivos cujo conteúdo mudou.

```bash
ailore index                 # indexa o diretório atual
ailore index ./packages/api  # indexa uma subpasta
```

### `ailore ask <pergunta>`

Recupera os trechos mais relevantes e pede ao modelo para responder usando **apenas** esse contexto, com citações inline. A resposta aparece em streaming no terminal e as fontes são listadas ao final.

```bash
ailore ask "como validamos a assinatura dos webhooks?"
ailore ask -k 10 "resuma o processo de deploy"          # recupera mais contexto
ailore ask --no-stream "o que a camada de cache faz?"   # imprime tudo de uma vez
```

### `ailore search <consulta>`

Busca semântica pura — trechos ranqueados, sem chamar LLM. Ótimo para pular direto ao código relevante.

```bash
ailore search "rotação de refresh token jwt"
ailore search --json "migrations do banco" > hits.json
```

### `ailore init`

Cria um `ailore.config.json` inicial que você pode ajustar.

## Provedores

Escolha um provedor com `-p/--provider` (ou defina no arquivo de config). Embeddings e chat são configurados de forma independente — dá para misturar.

| Provedor     | Chat (padrão)        | Embedding (padrão)       | Requer               |
| ------------ | -------------------- | ------------------------ | -------------------- |
| `ollama`     | `llama3.1`           | `nomic-embed-text`       | Ollama rodando       |
| `openai`     | `gpt-4o-mini`        | `text-embedding-3-small` | `OPENAI_API_KEY`     |
| `gemini`     | `gemini-1.5-flash`   | `text-embedding-004`     | `GEMINI_API_KEY`     |
| `openrouter` | `openai/gpt-4o-mini` | _(cai para Ollama)_      | `OPENROUTER_API_KEY` |

```bash
export OPENAI_API_KEY=sk-...
ailore ask -p openai "explique o middleware de auth"

# Híbrido: embeddings locais, resposta hospedada
ailore ask -p openrouter --embedding-provider ollama "..."
```

> **Sobre o OpenRouter:** ele não oferece um endpoint de embeddings dedicado, então quando o OpenRouter é o provedor de chat, os embeddings caem automaticamente para o Ollama local. Use `--embedding-provider openai` se preferir embeddings hospedados.

## Configuração

O `ailore` resolve a configuração nesta ordem (o último vence):

**padrões internos → `ailore.config.json` → variáveis de ambiente → flags de CLI**

API keys são lidas **somente** do ambiente, nunca do arquivo de config, para que segredos jamais sejam commitados.

```jsonc
// ailore.config.json
{
  "provider": "ollama",
  "embeddingProvider": "ollama",
  "chatModel": "llama3.1",
  "embeddingModel": "nomic-embed-text",
  "retrieval": { "topK": 6, "minScore": 0 },
  "generation": { "temperature": 0.2, "maxTokens": 1024, "topP": 1, "seed": 42 },
  "chunk": { "maxChars": 1200, "overlapLines": 2 },
  "exclude": ["**/*.test.ts"],
}
```

### Ajuste de geração e recuperação

Nada é hardcoded — todo parâmetro relevante pode ser definido no arquivo de config, via variável de ambiente ou por chamada com uma flag (a flag vence). Útil para equilibrar custo, determinismo e tamanho da resposta:

| Parâmetro    | Config / Env / Flag                                                   | Padrão             | O que faz                                                                                              |
| ------------ | --------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| Temperatura  | `generation.temperature` · `AILORE_TEMPERATURE` · `-t, --temperature` | `0.2`              | Aleatoriedade. Mantenha baixo para respostas factuais e fundamentadas.                                 |
| Máx. tokens  | `generation.maxTokens` · `AILORE_MAX_TOKENS` · `--max-tokens`         | padrão do provedor | Limita o tamanho da resposta.                                                                          |
| Top-p        | `generation.topP` · `AILORE_TOP_P` · `--top-p`                        | padrão do provedor | Corte do nucleus sampling (0–1).                                                                       |
| Seed         | `generation.seed` · `AILORE_SEED` · `--seed`                          | nenhum             | Fixe para respostas **reprodutíveis** (mesma pergunta → mesma saída).                                  |
| Top-k        | `retrieval.topK` · `-k, --top-k`                                      | `6`                | Quantos trechos alimentar o modelo.                                                                    |
| Score mínimo | `retrieval.minScore` · `AILORE_MIN_SCORE` · `--min-score`             | `0`                | Descarta trechos abaixo desse score de cosseno para que correspondências fracas não diluam o contexto. |

```bash
# Resposta determinística e concisa
ailore ask --seed 42 --temperature 0 --max-tokens 300 "o que o cache faz?"

# Usar apenas contexto fortemente relevante
ailore ask --min-score 0.35 -k 10 "como o rate limiting é configurado?"
```

| Variável de ambiente                                             | Função                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| `OPENAI_API_KEY`                                                 | Autenticação OpenAI                                  |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY`                              | Autenticação Gemini                                  |
| `OPENROUTER_API_KEY`                                             | Autenticação OpenRouter                              |
| `OLLAMA_BASE_URL`                                                | Endpoint do Ollama (padrão `http://localhost:11434`) |
| `AILORE_PROVIDER`, `AILORE_CHAT_MODEL`, `AILORE_EMBEDDING_MODEL` | Override sem flags                                   |

## Uso como biblioteca

O motor de indexação/recuperação é exportado, então você pode embuti-lo nas suas próprias ferramentas:

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

## Como funciona

```
arquivos ─▶ varredura (.gitignore) ─▶ chunk (por linha) ─▶ embed ─▶ .ailore/index.json
                                                                       │
pergunta ─▶ embed ─▶ busca cosseno (top-k) ─▶ prompt fundamentado ─▶ LLM ─┘─▶ resposta + citações
```

- O **chunking** é alinhado por linha, então todo trecho carrega um intervalo de linhas exato — é isso que torna as citações precisas.
- A **busca** é um scan de cosseno exato (força bruta). Simples, preciso e rápido para os corpora pequenos e médios que esta ferramenta atende.
- A reindexação **incremental** faz hash de cada arquivo e pula os inalterados; arquivos deletados são removidos.

## Roadmap

- [ ] Índice de vizinhos aproximados (ANN) para repositórios muito grandes
- [ ] Modo watch (`ailore index --watch`)
- [ ] Ingestão de PDF e notebooks
- [ ] Etapa de re-ranking antes da geração

## Contribuindo

Contribuições são bem-vindas — veja [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licença

[MIT](./LICENSE) © [Gregori Dalzotto](https://github.com/gregdalzotto)
