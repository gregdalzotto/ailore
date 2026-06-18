# FAQ

[← Docs index](../../README.md) · [Português 🇧🇷](../pt-BR/faq.md)

<details>
<summary><b>Which languages can I use for questions and search?</b></summary>

Any language — there is no language setting. But the two stages behave differently:

- **Asking (`ask`)**: the chat model answers in whatever language you write in. Ask in Portuguese → get a Portuguese answer, even if the code is in English.
- **Searching (retrieval)**: quality depends on the **embedding model**. `nomic-embed-text` is English-optimized; for strong Portuguese (or any cross-language search like a PT-BR question over English code), use a multilingual model.

To switch to multilingual search:

```bash
ollama pull bge-m3
# set "embeddingModel": "bge-m3" in ailore.config.json, then:
ailore index
```

Changing the embedding model requires a full re-index (vectors from different models aren't comparable). ailore detects the change and rebuilds automatically.

</details>

<details>
<summary><b>Do I need an API key? Does it cost anything?</b></summary>

No. With **Ollama** (the default) everything runs locally and for free — no API key, no usage cost. You only need a key if you choose a hosted provider:

```bash
export OPENAI_API_KEY=sk-...
ailore ask -p openai "..."
```

</details>

<details>
<summary><b>Is my code sent anywhere? Is it private?</b></summary>

- **With Ollama:** nothing leaves your machine. Indexing and answering happen entirely on your computer.
- **With a hosted provider (OpenAI/Gemini/OpenRouter):** the text of the chunks retrieved for a question, plus your question, is sent to that provider to generate the answer — same as any API call. Your API keys are read only from environment variables and are never written to the config file or the index.

</details>

<details>
<summary><b>How do I use ailore on any project without editing the config every time?</b></summary>

The config file lives per-project. To set your preferred models machine-wide, export environment variables (e.g. in `~/.zshrc` or `~/.bashrc`):

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

Use `include`/`exclude` globs in `ailore.config.json`. For example, to ignore markdown so answers come from code:

```jsonc
{ "exclude": ["**/*.md"] }
```

Then re-index with `ailore index`. You can also scope a single run to a subfolder: `ailore index ./src`.

</details>

<details>
<summary><b>I get "No index found. Run ailore index first."</b></summary>

`search` and `ask` read an index that `index` creates. Run `ailore index` in the project first. If you run commands from a different folder, point them at the project with `-C`: `ailore ask -C /path/to/project "..."`.

</details>

<details>
<summary><b>I get an Ollama connection error or "model not found"</b></summary>

- **Connection error:** the Ollama server isn't running. Open the Ollama app, or run `ollama serve` in a separate terminal.
- **Model not found:** pull the model first, e.g. `ollama pull bge-m3`, and confirm with `ollama list`. The name in `ailore.config.json` must match exactly.

</details>

<details>
<summary><b>I changed some files — do I need to re-index everything?</b></summary>

No. `ailore index` is incremental: it hashes each file and only re-embeds the ones that changed (and prunes deleted files). Just run `ailore index` again — it will report something like `1 changed · 41 unchanged · 0 removed`.

</details>

<details>
<summary><b>How large a project can it handle?</b></summary>

Search is an exact cosine scan kept fully in memory, which is fast and accurate for small-to-medium codebases (up to roughly tens of thousands of chunks). For very large monorepos, scope the index to the relevant folders (`ailore index ./src`) or use `exclude` globs. An approximate-nearest-neighbour index for huge repos is on the [roadmap](../../README.md#roadmap).

</details>

<details>
<summary><b>How do I uninstall or reset?</b></summary>

```bash
rm -rf .ailore            # delete a project's index (rebuilt on next `ailore index`)
npm uninstall -g ailore   # remove the global command
```

</details>
