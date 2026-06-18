# Commands

[🏠 Home](../../README.md) · [📚 Docs](./README.md) · [Português 🇧🇷](../pt-BR/commands.md)

All commands accept the global flags `-C, --path <dir>` (operate on another directory), `-p, --provider`, `--embedding-provider`, `-m, --model`, `--embedding-model` and `--index-dir`. See [Configuration](./configuration.md) for the full list.

## `ailore index [path]`

Scans the directory (honoring `.gitignore`), splits files into line-aligned chunks, embeds them, and stores everything locally. Re-running only re-embeds files whose content changed.

```bash
ailore index                 # index the current directory
ailore index ./packages/api  # index a subfolder
```

## `ailore ask <question>`

Retrieves the most relevant chunks and asks the model to answer using only that context, with inline citations. The answer streams to your terminal and the sources are listed at the end.

```bash
ailore ask "how do we validate webhook signatures?"
ailore ask -k 10 "summarize the deployment process"    # retrieve more context
ailore ask --no-stream "what does the cache layer do?"  # print all at once
```

Flags: `-k, --top-k`, `--min-score`, `--mode`, `-t, --temperature`, `--max-tokens`, `--top-p`, `--seed`, `--no-stream`. See [Configuration](./configuration.md).

## `ailore search <query>`

Ranked snippets, no LLM call. Uses [hybrid retrieval](./retrieval-modes.md) by default; switch with `--mode`. Great for quickly jumping to relevant code.

```bash
ailore search "jwt refresh token rotation"
ailore search --mode keyword "TokenRotationError"   # exact-symbol lookup
ailore search --json "database migrations" > hits.json
```

## `ailore init`

Writes a starter `ailore.config.json` you can tweak. See [Configuration](./configuration.md).

## `ailore mcp`

Runs an [MCP](https://modelcontextprotocol.io) server over stdio, exposing two tools — `ailore_search` and `ailore_ask` — so an AI client can search and ask against your index **on its own**, with the same `path:line` citations.

```bash
ailore mcp                 # serve the current directory
ailore mcp -C ./my-project # serve a specific project
```

Full client setup (Claude, Cursor, …) is in [Editor / MCP integration](./mcp.md).

<!-- nav-footer -->

---

<div align="center"><sub>[← Prev: Getting started](./getting-started.md) · [📚 All guides](./README.md) · [Next: Configuration →](./configuration.md)</sub></div>
