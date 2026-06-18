# Getting started

[← Docs index](../../README.md) · [Português 🇧🇷](../pt-BR/getting-started.md)

This walkthrough goes from zero to your first answer using the **100% local** setup (Ollama) — no API key, no cost, nothing leaves your machine.

## Quick start (3 steps)

1. Install [Ollama](https://ollama.com) and pull a chat and an embedding model:

   ```bash
   ollama pull llama3.1
   ollama pull nomic-embed-text
   ```

2. Install ailore and index a project:

   ```bash
   npm install -g ailore
   cd my-project
   ailore index
   ```

3. Ask:

   ```bash
   ailore ask "where is the rate limiter implemented?"
   ```

The index is written to `.ailore/` in the current directory.

## Step-by-step tutorial (beginner-friendly)

### 1. Check you have Node.js 20+

```bash
node --version
```

If it prints `v20.x` or higher, you're good. If it says a lower version or `command not found`, install Node.js from [nodejs.org](https://nodejs.org) and run the command again.

### 2. Install ailore

```bash
npm install -g ailore
ailore --version
```

`ailore --version` should print a version number. If your shell says `command not found: ailore`, close and reopen the terminal, then try again.

### 3. Install Ollama and pull two models

ailore needs **two** models: one to turn text into vectors (for search) and one to write answers (for `ask`).

1. Install Ollama from [ollama.com](https://ollama.com). It runs a small local server in the background.
2. Pull one chat model and one embedding model:

   ```bash
   ollama pull llama3.2   # chat model — writes the answers
   ollama pull bge-m3     # embedding model — multilingual (great for EN + PT-BR)
   ```

   > Prefer English only? Use `nomic-embed-text` instead of `bge-m3` — it's smaller and faster, but weaker for other languages.

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

Open the generated `ailore.config.json` and make sure the model names match what you pulled in step 3:

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

You get a list of the most relevant snippets, each with a `path:line` reference and a relevance score.

### 7. Ask (a full answer with citations)

```bash
ailore ask "how does authentication work?"
```

The answer streams into your terminal and the source files it used are listed at the end. You can ask in any language — including Portuguese.

🎉 That's the whole loop: **install → models → config → index → search → ask.**

## Next steps

- [Commands reference](./commands.md) — every command and flag.
- [Configuration](./configuration.md) — tune models, retrieval and generation.
- [Editor / MCP integration](./mcp.md) — let your AI assistant query the index.
- [FAQ](./faq.md) — languages, privacy, troubleshooting.
