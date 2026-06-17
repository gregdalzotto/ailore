<div align="center">

# ailore

**Local-first semantic search & RAG for your codebase and docs.**

Ask questions in natural language and get answers grounded in _your own files_ — with exact `path:line` citations. Runs fully offline with [Ollama](https://ollama.com), or with OpenAI, Gemini and OpenRouter.

[![CI](https://github.com/gregdalzotto/ailore/actions/workflows/ci.yml/badge.svg)](https://github.com/gregdalzotto/ailore/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

[Português 🇧🇷](./README.pt-BR.md)

</div>

---

## Why the name?

**`ailore` = AI + lore.**

In English, _lore_ means the accumulated, often informal knowledge about something — the kind of understanding that gets buried in a codebase and usually lives only in the heads of the people who have been around the longest (_"the lore of this project"_). That hidden, hard-to-extract knowledge is exactly what this tool surfaces: it reads your files and turns them into answers you can ask for in plain language. The `ai` prefix makes the purpose explicit. Short, easy to type, easy to remember: `ailore ask "how does auth work?"`.

## What it does

- 🔍 **Semantic search** over any folder of code or documentation.
- 💬 **Grounded answers** (RAG): ask a question, get a synthesized answer that cites the exact source lines it used.
- 🔒 **Local-first**: with Ollama, nothing ever leaves your machine — no API key, no cost.
- 🔌 **Provider-agnostic**: swap between Ollama, OpenAI, Gemini and OpenRouter with a single flag.
- ⚡ **Incremental indexing**: only changed files are re-embedded, so re-indexing a big repo is cheap.
- 📎 **Trustworthy citations**: every chunk maps back to `path:startLine-endLine`, so you can verify answers.
- 🪶 **Zero heavy dependencies**: the index is a plain file, no database to run, no native modules.

## Install

```bash
npm install -g ailore
# or run without installing:
npx ailore --help
```

Requires **Node.js >= 20**.

## Quick start (100% local, no API key)

1. Install [Ollama](https://ollama.com) and pull a chat and an embedding model:

   ```bash
   ollama pull llama3.1
   ollama pull nomic-embed-text
   ```

2. Index a project and start asking:

   ```bash
   cd my-project
   ailore index
   ailore ask "where is the rate limiter implemented?"
   ```

That's it. The index is written to `.ailore/` in the current directory.

## Usage

### `ailore index [path]`

Scans the directory (honoring `.gitignore`), splits files into line-aligned chunks, embeds them, and stores everything locally. Re-running only re-embeds files whose content changed.

```bash
ailore index                 # index the current directory
ailore index ./packages/api  # index a subfolder
```

### `ailore ask <question>`

Retrieves the most relevant chunks and asks the model to answer using only that context, with inline citations. The answer streams to your terminal and the sources are listed at the end.

```bash
ailore ask "how do we validate webhook signatures?"
ailore ask -k 10 "summarize the deployment process"   # retrieve more context
ailore ask --no-stream "what does the cache layer do?" # print all at once
```

### `ailore search <query>`

Pure semantic search — ranked snippets, no LLM call. Great for quickly jumping to relevant code.

```bash
ailore search "jwt refresh token rotation"
ailore search --json "database migrations" > hits.json
```

### `ailore init`

Writes a starter `ailore.config.json` you can tweak.

## Providers

Pick a provider with `-p/--provider` (or set it in the config file). Embeddings and chat are configured independently, so you can mix and match.

| Provider     | Chat default         | Embedding default        | Needs                |
| ------------ | -------------------- | ------------------------ | -------------------- |
| `ollama`     | `llama3.1`           | `nomic-embed-text`       | Ollama running       |
| `openai`     | `gpt-4o-mini`        | `text-embedding-3-small` | `OPENAI_API_KEY`     |
| `gemini`     | `gemini-1.5-flash`   | `text-embedding-004`     | `GEMINI_API_KEY`     |
| `openrouter` | `openai/gpt-4o-mini` | _(falls back to Ollama)_ | `OPENROUTER_API_KEY` |

```bash
export OPENAI_API_KEY=sk-...
ailore ask -p openai "explain the auth middleware"

# Hybrid: local embeddings, hosted answer
ailore ask -p openrouter --embedding-provider ollama "..."
```

> **Note on OpenRouter:** it does not offer a first-class embeddings endpoint, so when OpenRouter is your chat provider, embeddings transparently fall back to local Ollama. Set `--embedding-provider openai` if you prefer hosted embeddings.

## Configuration

`ailore` resolves configuration in this order (later wins):

**built-in defaults → `ailore.config.json` → environment variables → CLI flags**

API keys are **only** read from the environment, never from the config file, so secrets never end up committed.

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

### Tuning generation & retrieval

Nothing is hardcoded — every meaningful parameter can be set in the config file, via an env var, or per-call with a flag (flags win). Useful for trading off cost, determinism and answer length:

| Parameter   | Config / Env / Flag                                                   | Default          | What it does                                                              |
| ----------- | --------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| Temperature | `generation.temperature` · `AILORE_TEMPERATURE` · `-t, --temperature` | `0.2`            | Randomness. Keep low for factual, grounded answers.                       |
| Max tokens  | `generation.maxTokens` · `AILORE_MAX_TOKENS` · `--max-tokens`         | provider default | Caps the answer length.                                                   |
| Top-p       | `generation.topP` · `AILORE_TOP_P` · `--top-p`                        | provider default | Nucleus sampling cutoff (0–1).                                            |
| Seed        | `generation.seed` · `AILORE_SEED` · `--seed`                          | none             | Fix it for **reproducible** answers (same question → same output).        |
| Top-k       | `retrieval.topK` · `-k, --top-k`                                      | `6`              | How many chunks to feed the model.                                        |
| Min score   | `retrieval.minScore` · `AILORE_MIN_SCORE` · `--min-score`             | `0`              | Drop chunks below this cosine score so weak matches don't dilute context. |

```bash
# Deterministic, concise answer
ailore ask --seed 42 --temperature 0 --max-tokens 300 "what does the cache do?"

# Only use strongly-relevant context
ailore ask --min-score 0.35 -k 10 "how is rate limiting configured?"
```

| Env var                                                          | Purpose                                            |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| `OPENAI_API_KEY`                                                 | OpenAI auth                                        |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY`                              | Gemini auth                                        |
| `OPENROUTER_API_KEY`                                             | OpenRouter auth                                    |
| `OLLAMA_BASE_URL`                                                | Ollama endpoint (default `http://localhost:11434`) |
| `AILORE_PROVIDER`, `AILORE_CHAT_MODEL`, `AILORE_EMBEDDING_MODEL` | Override without flags                             |

## Use as a library

The indexing/retrieval engine is exported, so you can embed it in your own tooling:

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

## How it works

```
files ──▶ scan (respect .gitignore) ──▶ chunk (line-aligned) ──▶ embed ──▶ .ailore/index.json
                                                                              │
query ──▶ embed ──▶ cosine search (top-k) ──▶ build grounded prompt ──▶ LLM ──┘──▶ answer + citations
```

- **Chunking** is line-aligned so every chunk carries an exact line range — that's what makes citations precise.
- **Search** is an exact (brute-force) cosine scan. Simple, accurate, and fast for the small-to-medium corpora this targets.
- **Incremental** re-indexing hashes each file and skips unchanged ones; deleted files are pruned.

## Roadmap

- [ ] Approximate nearest-neighbour index for very large repos
- [ ] Watch mode (`ailore index --watch`)
- [ ] PDF and notebook ingestion
- [ ] Re-ranking step before generation

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © [Gregori Dalzotto](https://github.com/gregdalzotto)
