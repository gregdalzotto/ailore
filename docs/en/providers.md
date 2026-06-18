# Providers

[← Docs index](../../README.md) · [Português 🇧🇷](../pt-BR/providers.md)

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

# Hybrid setup: local embeddings, hosted answer
ailore ask -p openrouter --embedding-provider ollama "..."
```

## Mixing embeddings and chat

Because the two stages are decoupled, you can embed locally (free, private) and answer with a hosted model, or vice-versa:

```bash
# Local, private embeddings + a hosted chat model
ailore index --embedding-provider ollama
ailore ask -p openai --embedding-provider ollama "summarize the indexer"
```

> **Note on OpenRouter:** it does not offer a first-class embeddings endpoint, so when OpenRouter is your chat provider, embeddings transparently fall back to local Ollama. Set `--embedding-provider openai` if you prefer hosted embeddings.

## Privacy

- **With Ollama:** nothing leaves your machine — indexing and answering are fully local.
- **With a hosted provider:** the retrieved chunks plus your question are sent to that provider to generate the answer, like any API call. API keys are read only from environment variables. See the [FAQ](./faq.md) for details.
