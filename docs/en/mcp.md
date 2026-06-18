# Editor / MCP integration

[← Docs index](../../README.md) · [Português 🇧🇷](../pt-BR/mcp.md)

`ailore` speaks the [Model Context Protocol](https://modelcontextprotocol.io), so any MCP-capable client (Claude clients, Cursor, …) can use your index as a tool. Index once, then let the assistant call `ailore_search` / `ailore_ask` while you work — answers stay grounded in your files, with `path:line` citations.

The server exposes two tools:

| Tool            | What it does                              | Arguments                    |
| --------------- | ----------------------------------------- | ---------------------------- |
| `ailore_search` | Ranked snippets, no LLM call.             | `query`, `topK?`, `mode?`    |
| `ailore_ask`    | A grounded answer with a list of sources. | `question`, `topK?`, `mode?` |

`mode` is one of `vector` / `keyword` / `hybrid` (see [Retrieval modes](./retrieval-modes.md)).

## Prerequisites (once)

The MCP SDK is an **optional** dependency, so the base install stays lean. Install it alongside `ailore`, then index the project you want to query:

```bash
# 1. Install ailore + the optional MCP SDK, globally and side by side
npm install -g ailore @modelcontextprotocol/sdk

# 2. Index the project (Ollama running, or a provider configured)
cd /path/to/your-project
ailore index
```

> If the SDK is missing, `ailore mcp` prints exactly what to install — it never fails silently.

## Claude Code

Register the server with one command:

```bash
claude mcp add ailore -- ailore mcp -C /absolute/path/to/your-project
```

- `--` separates Claude's own flags from the server command. Use an **absolute** path with `-C` (the client may launch from a different working directory).
- **Scope** (optional): the default is `local` (this project, just you). Use `-s user` for all your projects, or `-s project` to share via a committed `.mcp.json`.
- **Hosted provider?** Pass the key into the server's environment: `claude mcp add ailore -e OPENAI_API_KEY=sk-... -- ailore mcp -C /path`. With Ollama (local) no key is needed.

Verify and use:

```bash
claude mcp list          # ailore should show ✔ Connected
claude mcp get ailore
```

In a session, type `/mcp` to see connected servers and their tools. Then just ask naturally — the assistant calls `ailore_search` / `ailore_ask` on its own. You can nudge it: _"use the ailore tools to answer from the indexed code."_

Remove with `claude mcp remove ailore`.

## Claude Desktop

Edit the config file (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```jsonc
{
  "mcpServers": {
    "ailore": {
      "command": "ailore",
      "args": ["mcp", "-C", "/absolute/path/to/your-project"],
      "env": { "OPENAI_API_KEY": "sk-..." }, // omit when using Ollama
    },
  },
}
```

Restart Claude Desktop. The tools appear under the tools (🔌) menu.

## Cursor and other MCP clients

The shape is the same for any client — a stdio server entry:

```jsonc
{
  "mcpServers": {
    "ailore": {
      "command": "ailore",
      "args": ["mcp", "-C", "/absolute/path/to/your-project"],
    },
  },
}
```

## Notes

- **`ailore_ask`** needs the chat provider available (Ollama running, or an API key in the server's environment). **`ailore_search --mode keyword`** needs neither — just the index.
- Communication is over **stdio**: stdout carries the protocol, so `ailore` logs only to stderr.
- Re-run `ailore index` whenever the code changes so the tools stay current.
