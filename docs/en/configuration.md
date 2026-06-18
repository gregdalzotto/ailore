# Configuration

[🏠 Home](../../README.md) · [📚 Docs](./README.md) · [Português 🇧🇷](../pt-BR/configuration.md)

`ailore` resolves configuration in this order (later wins):

**built-in defaults → `ailore.config.json` → environment variables → CLI flags**

API keys are **only** read from the environment, never from the config file, so secrets never end up committed.

## Config file

Run `ailore init` to scaffold one, then edit:

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

## Tuning generation & retrieval

Nothing is hardcoded — every meaningful parameter can be set in the config file, via an env var, or per-call with a flag (flags win). Useful for trading off cost, determinism and answer length:

| Parameter   | Config / Env / Flag                                                   | Default          | What it does                                                                                    |
| ----------- | --------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| Temperature | `generation.temperature` · `AILORE_TEMPERATURE` · `-t, --temperature` | `0.2`            | Randomness. Keep low for factual, grounded answers.                                             |
| Max tokens  | `generation.maxTokens` · `AILORE_MAX_TOKENS` · `--max-tokens`         | provider default | Caps the answer length.                                                                         |
| Top-p       | `generation.topP` · `AILORE_TOP_P` · `--top-p`                        | provider default | Nucleus sampling cutoff (0–1).                                                                  |
| Seed        | `generation.seed` · `AILORE_SEED` · `--seed`                          | none             | Fix it for **reproducible** answers (same question → same output).                              |
| Top-k       | `retrieval.topK` · `-k, --top-k`                                      | `6`              | How many chunks to feed the model.                                                              |
| Min score   | `retrieval.minScore` · `AILORE_MIN_SCORE` · `--min-score`             | `0`              | Drop chunks below this cosine score so weak matches don't dilute context.                       |
| Mode        | `retrieval.mode` · `AILORE_RETRIEVAL_MODE` · `--mode`                 | `hybrid`         | Ranking strategy: `vector`, `keyword` or `hybrid`. See [Retrieval modes](./retrieval-modes.md). |

```bash
# Deterministic, concise answer
ailore ask --seed 42 --temperature 0 --max-tokens 300 "what does the cache do?"

# Only use strongly-relevant context
ailore ask --min-score 0.35 -k 10 "how is rate limiting configured?"

# Find an exact symbol fast, no embedding round-trip
ailore search --mode keyword "reciprocalRankFusion"
```

## What gets indexed

`include` / `exclude` glob arrays control the corpus. `ailore` always honors `.gitignore` and skips binaries. Example — index code but not markdown:

```jsonc
{ "exclude": ["**/*.md"] }
```

## Environment variables

| Env var                                                          | Purpose                                            |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| `OPENAI_API_KEY`                                                 | OpenAI auth                                        |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY`                              | Gemini auth                                        |
| `OPENROUTER_API_KEY`                                             | OpenRouter auth                                    |
| `OLLAMA_BASE_URL`                                                | Ollama endpoint (default `http://localhost:11434`) |
| `AILORE_PROVIDER`, `AILORE_CHAT_MODEL`, `AILORE_EMBEDDING_MODEL` | Override without flags                             |
| `AILORE_RETRIEVAL_MODE`                                          | Retrieval mode: `vector` / `keyword` / `hybrid`    |

> [!TIP]
> Export `AILORE_CHAT_MODEL` / `AILORE_EMBEDDING_MODEL` in your shell profile to set machine-wide defaults and skip per-project config.

<!-- nav-footer -->

---

<div align="center"><sub>[← Prev: Commands](./commands.md) · [📚 All guides](./README.md) · [Next: Retrieval modes →](./retrieval-modes.md)</sub></div>
