<div align="center">

# ailore

**Local-first semantic search & RAG for your codebase and docs.**

Ask questions in natural language and get answers grounded in _your own files_ — with exact `path:line` citations. Runs fully offline with [Ollama](https://ollama.com), or with OpenAI, Gemini and OpenRouter.

[![npm version](https://img.shields.io/npm/v/ailore.svg)](https://www.npmjs.com/package/ailore)
[![npm downloads](https://img.shields.io/npm/dm/ailore.svg)](https://www.npmjs.com/package/ailore)
[![CI](https://github.com/gregdalzotto/ailore/actions/workflows/ci.yml/badge.svg)](https://github.com/gregdalzotto/ailore/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

[Português 🇧🇷](./README.pt-BR.md)

<br>

![ailore demo — index, search and ask with citations](./media/demo.gif)

</div>

---

## Why the name?

**`ailore` = AI + lore.**

In English, _lore_ means the accumulated, often informal knowledge about something — the kind of understanding that gets buried in a codebase and usually lives only in the heads of the people who have been around the longest (_"the lore of this project"_). That hidden, hard-to-extract knowledge is exactly what this tool surfaces: it reads your files and turns them into answers you can ask for in plain language. The `ai` prefix makes the purpose explicit. Short, easy to type, easy to remember: `ailore ask "how does auth work?"`.

## What it does

- 🔍 **Hybrid search** over any folder of code or documentation — semantic (vector) and lexical (BM25) ranking fused, so it nails both concepts and exact symbols.
- 💬 **Grounded answers** (RAG): ask a question, get a synthesized answer that cites the exact source lines it used.
- 🔒 **Local-first**: with Ollama, nothing ever leaves your machine — no API key, no cost.
- 🔌 **Provider-agnostic**: swap between Ollama, OpenAI, Gemini and OpenRouter with a single flag.
- ⚡ **Incremental indexing**: only changed files are re-embedded, so re-indexing a big repo is cheap.
- 📎 **Trustworthy citations**: every chunk maps back to `path:startLine-endLine`, so you can verify answers.
- 🪶 **Zero heavy dependencies**: the index is a plain file, no database to run, no native modules.

## Demo

```console
$ ailore index
• Indexing . with ollama:bge-m3
✓ Indexed 42 files / 113 chunks

$ ailore ask "how does incremental indexing skip unchanged files?"
ailore stores a content hash for every file. On the next run it re-hashes each
file and compares: unchanged files are skipped, only changed ones are
re-embedded, and deleted files are pruned. [core/indexer.ts:54-96]

Sources:
  core/indexer.ts:54-96
  core/hash.ts:1-9
```

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

## Step-by-step tutorial (beginner-friendly)

Never used a tool like this? This walkthrough goes from zero to your first
answer, showing exactly what to type and what to expect at each step. It uses
the **100% local** setup (Ollama) — no API key, no cost, nothing leaves your
machine.

<details>
<summary><b>Open the full walkthrough</b></summary>

### 1. Check you have Node.js 20+

```bash
node --version
```

If it prints `v20.x` or higher, you're good. If it says a lower version or
`command not found`, install Node.js from [nodejs.org](https://nodejs.org) and
run the command again.

### 2. Install ailore

```bash
npm install -g ailore
ailore --version
```

`ailore --version` should print a version number. If your shell says
`command not found: ailore`, close and reopen the terminal, then try again.

### 3. Install Ollama and pull two models

ailore needs **two** models: one to turn text into vectors (for search) and one
to write answers (for `ask`).

1. Install Ollama from [ollama.com](https://ollama.com). It runs a small local
   server in the background.
2. Pull one chat model and one embedding model:

   ```bash
   ollama pull llama3.2   # chat model — writes the answers
   ollama pull bge-m3     # embedding model — multilingual (great for EN + PT-BR)
   ```

   > Prefer English only? Use `nomic-embed-text` instead of `bge-m3` — it's
   > smaller and faster, but weaker for other languages.

3. Confirm they downloaded:

   ```bash
   ollama list
   ```

   You should see `llama3.2` and `bge-m3` in the list.

### 4. Create a config in your project

```bash
cd /path/to/your-project
ailore init
```

Open the generated `ailore.config.json` and make sure the model names match what
you pulled in step 3:

```jsonc
{
  "chatModel": "llama3.2",
  "embeddingModel": "bge-m3",
}
```

### 5. Build the index

```bash
ailore index
```

Expected output (numbers vary by project):

```
• Indexing /path/to/your-project with ollama:bge-m3
  scanning files...
  embedding chunks: 113
✓ Indexed 42 files / 113 chunks
```

### 6. Search (no AI, just ranked snippets)

```bash
ailore search "how does authentication work"
```

You get a list of the most relevant snippets, each with a `path:line` reference
and a relevance score.

### 7. Ask (a full answer with citations)

```bash
ailore ask "how does authentication work?"
```

The answer streams into your terminal and the source files it used are listed at
the end. You can ask in any language — including Portuguese.

🎉 That's the whole loop: **install → models → config → index → search → ask.**

</details>

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

Ranked snippets, no LLM call. Uses hybrid retrieval by default; switch with `--mode`. Great for quickly jumping to relevant code.

```bash
ailore search "jwt refresh token rotation"
ailore search --mode keyword "TokenRotationError"   # exact-symbol lookup
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
  "retrieval": { "topK": 6, "minScore": 0, "mode": "hybrid" },
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
| Mode        | `retrieval.mode` · `AILORE_RETRIEVAL_MODE` · `--mode`                 | `hybrid`         | Ranking strategy: `vector`, `keyword` or `hybrid` (see below).            |

#### Retrieval modes

Semantic (vector) search is great at _meaning_ but weak at _exact tokens_ — symbol names, error strings, flags. Lexical **BM25** is the opposite. `ailore` defaults to **hybrid**, fusing both rankings with [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) so a result both rankers like floats to the top — no score calibration needed.

| Mode      | How it ranks                               | Best for                                           |
| --------- | ------------------------------------------ | -------------------------------------------------- |
| `hybrid`  | cosine + BM25, fused via RRF (**default**) | Most queries — robust across phrasing and symbols. |
| `vector`  | pure cosine similarity                     | Conceptual questions with no exact term to match.  |
| `keyword` | pure BM25 (no embedding call)              | Exact identifiers/strings; also the fastest path.  |

```bash
# Deterministic, concise answer
ailore ask --seed 42 --temperature 0 --max-tokens 300 "what does the cache do?"

# Only use strongly-relevant context
ailore ask --min-score 0.35 -k 10 "how is rate limiting configured?"

# Find an exact symbol fast, no embedding round-trip
ailore search --mode keyword "reciprocalRankFusion"
```

| Env var                                                          | Purpose                                            |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| `OPENAI_API_KEY`                                                 | OpenAI auth                                        |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY`                              | Gemini auth                                        |
| `OPENROUTER_API_KEY`                                             | OpenRouter auth                                    |
| `OLLAMA_BASE_URL`                                                | Ollama endpoint (default `http://localhost:11434`) |
| `AILORE_PROVIDER`, `AILORE_CHAT_MODEL`, `AILORE_EMBEDDING_MODEL` | Override without flags                             |
| `AILORE_RETRIEVAL_MODE`                                          | Retrieval mode: `vector` / `keyword` / `hybrid`    |

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
query ──▶ ┌─ cosine (semantic) ─┐                                            │
          ├─ BM25 (lexical) ────┤─ RRF fuse (top-k) ─▶ grounded prompt ─▶ LLM ┘──▶ answer + citations
          └─────────────────────┘
```

- **Chunking** is line-aligned so every chunk carries an exact line range — that's what makes citations precise.
- **Retrieval** is hybrid by default: an exact (brute-force) cosine scan for meaning, a BM25 ranking for exact tokens, fused with [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf). Both rankings run over the same stored chunks; the BM25 index is built in-memory at query time, so it needs nothing extra on disk. Switch to pure `vector` or `keyword` with `retrieval.mode`.
- **Incremental** re-indexing hashes each file and skips unchanged ones; deleted files are pruned.

## FAQ

<details>
<summary><b>Which languages can I use for questions and search?</b></summary>

Any language — there is no language setting. But the two stages behave differently:

- **Asking (`ask`)**: the chat model answers in whatever language you write in.
  Ask in Portuguese → get a Portuguese answer, even if the code is in English.
- **Searching (retrieval)**: quality depends on the **embedding model**.
  `nomic-embed-text` is English-optimized; for strong Portuguese (or any
  cross-language search like a PT-BR question over English code), use a
  multilingual model.

To switch to multilingual search:

```bash
ollama pull bge-m3
# set "embeddingModel": "bge-m3" in ailore.config.json, then:
ailore index
```

Changing the embedding model requires a full re-index (vectors from different
models aren't comparable). ailore detects the change and rebuilds automatically.

</details>

<details>
<summary><b>Do I need an API key? Does it cost anything?</b></summary>

No. With **Ollama** (the default) everything runs locally and for free — no API
key, no usage cost. You only need a key if you choose a hosted provider:

```bash
export OPENAI_API_KEY=sk-...
ailore ask -p openai "..."
```

</details>

<details>
<summary><b>Is my code sent anywhere? Is it private?</b></summary>

- **With Ollama:** nothing leaves your machine. Indexing and answering happen
  entirely on your computer.
- **With a hosted provider (OpenAI/Gemini/OpenRouter):** the text of the chunks
  retrieved for a question, plus your question, is sent to that provider to
  generate the answer — same as any API call. Your API keys are read only from
  environment variables and are never written to the config file or the index.

</details>

<details>
<summary><b>How do I use ailore on any project without editing the config every time?</b></summary>

The config file lives per-project. To set your preferred models machine-wide,
export environment variables (e.g. in `~/.zshrc` or `~/.bashrc`):

```bash
export AILORE_CHAT_MODEL=llama3.2
export AILORE_EMBEDDING_MODEL=bge-m3
```

Now you can `cd` into any project and just run `ailore index` / `ailore ask`.

</details>

<details>
<summary><b>How do I get the same answer every time (reproducible)?</b></summary>

Pass a fixed `--seed` and a temperature of `0`:

```bash
ailore ask --seed 42 --temperature 0 "what does the cache layer do?"
```

</details>

<details>
<summary><b>The answer quotes the docs instead of the code — how do I control what gets indexed?</b></summary>

Use `include`/`exclude` globs in `ailore.config.json`. For example, to ignore
markdown so answers come from code:

```jsonc
{ "exclude": ["**/*.md"] }
```

Then re-index with `ailore index`. You can also scope a single run to a subfolder:
`ailore index ./src`.

</details>

<details>
<summary><b>I get "No index found. Run ailore index first."</b></summary>

`search` and `ask` read an index that `index` creates. Run `ailore index` in the
project first. If you run commands from a different folder, point them at the
project with `-C`: `ailore ask -C /path/to/project "..."`.

</details>

<details>
<summary><b>I get an Ollama connection error or "model not found"</b></summary>

- **Connection error:** the Ollama server isn't running. Open the Ollama app, or
  run `ollama serve` in a separate terminal.
- **Model not found:** pull the model first, e.g. `ollama pull bge-m3`, and
  confirm with `ollama list`. The name in `ailore.config.json` must match exactly.

</details>

<details>
<summary><b>I changed some files — do I need to re-index everything?</b></summary>

No. `ailore index` is incremental: it hashes each file and only re-embeds the
ones that changed (and prunes deleted files). Just run `ailore index` again — it
will report something like `1 changed · 41 unchanged · 0 removed`.

</details>

<details>
<summary><b>How large a project can it handle?</b></summary>

Search is an exact cosine scan kept fully in memory, which is fast and accurate
for small-to-medium codebases (up to roughly tens of thousands of chunks). For
very large monorepos, scope the index to the relevant folders (`ailore index ./src`)
or use `exclude` globs. An approximate-nearest-neighbour index for huge repos is
on the [roadmap](#roadmap).

</details>

<details>
<summary><b>How do I uninstall or reset?</b></summary>

```bash
rm -rf .ailore            # delete a project's index (rebuilt on next `ailore index`)
npm uninstall -g ailore   # remove the global command
```

</details>

## Roadmap

- [ ] Approximate nearest-neighbour index for very large repos
- [ ] Watch mode (`ailore index --watch`)
- [ ] PDF and notebook ingestion
- [ ] Re-ranking step before generation

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © [Gregori Dalzotto](https://github.com/gregdalzotto)
