# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- CI now enforces a **security gate**: a dedicated job audits the production
  runtime (`npm audit --omit=dev`, via `npm run audit:prod`) on every push and
  pull request, and the publish workflow runs the same check before releasing —
  so a vulnerable shipped dependency fails the build and can't reach users.

## [0.4.1] — 2026-06-18

### Security

- **File scanning is now bounded to the project root.** `include` globs that use
  `..` or absolute paths are rejected, so a committed `ailore.config.json` in an
  untrusted repository can no longer widen indexing to read files outside the
  directory ailore is pointed at (which, combined with a custom provider base
  URL, could exfiltrate them). This also fixes a crash where such patterns made
  globby throw with `.gitignore` handling on.
- Expanded `SECURITY.md` with the project's trust model: data flow per provider,
  environment-only API keys, the untrusted-config caveat, and prompt injection.
- Updated development tooling (vitest 2 → 3) to clear dev-only audit advisories.
  The published runtime has **0 known vulnerabilities**.

## [0.4.0] — 2026-06-18

### Added

- **Concurrent embedding pool**: indexing embeds batches through a small
  bounded-concurrency pool instead of strictly serially, so the first index of
  a large repo is no longer bottlenecked on provider round-trip latency.
  Vectors are still written back in queue order.

### Changed

- **Binary index format (v2)**: chunk vectors moved out of `index.json` into a
  packed `vectors.bin` sidecar (contiguous `Float32Array`). This shrinks the
  JSON that must be parsed on every query (~9× smaller on a sample repo) and
  speeds up loading. Older v1 indexes are read transparently and upgraded to v2
  on the next `ailore index` — no re-embedding required.
- **Documentation design system**: every guide now shares a consistent
  navigation frame — home / docs hub / language switch in the header and a
  guided prev → next tour in the footer — plus GitHub alert callouts
  (`[!TIP]` / `[!NOTE]` / `[!IMPORTANT]`) and a per-language documentation hub
  (`docs/en/README.md`, `docs/pt-BR/README.md`) with a grouped, card-style index.
  A beginner note clarifies that using ailore needs only the npm package, not a
  git clone.

## [0.3.0] — 2026-06-18

### Added

- **`ailore mcp`**: a Model Context Protocol server over stdio that exposes
  `ailore_search` and `ailore_ask` tools, so MCP clients (Cursor and other
  MCP-capable assistants) can query the local index with `path:line` citations. The
  `@modelcontextprotocol/sdk` package is an **optional** peer dependency loaded
  lazily, so the base install stays lean and non-MCP usage pays no cost; a
  missing package yields an actionable install hint. Library API gains
  `startMcpServer`, `runSearchTool`, `runAskTool`.

### Changed

- **Documentation overhaul**: the single long README was split into a slim,
  visual landing page (with an SVG banner) plus focused topic guides under
  `docs/en` and `docs/pt-BR` — getting started, commands, configuration,
  retrieval modes, providers, MCP integration, architecture, library API and
  FAQ. Every guide is bilingual (English + Portuguese) with step-by-step
  examples, so readers jump straight to what they need.

## [0.2.0] — 2026-06-18

### Added

- **Hybrid retrieval**: a lexical BM25 ranking fused with the semantic (cosine)
  ranking via Reciprocal Rank Fusion, so exact symbols/strings and conceptual
  matches both rank well. New `retrieval.mode` (`vector` | `keyword` | `hybrid`,
  default `hybrid`), configurable via the config file, `AILORE_RETRIEVAL_MODE`,
  or the `--mode` flag on `ask`/`search`. No re-index required — BM25 is built
  in-memory from the existing stored chunks, with a code-aware tokenizer that
  splits camelCase/snake_case while keeping the compound token.
- Public API exports for the new building blocks: `Bm25Index`,
  `reciprocalRankFusion`, `tokenize`, plus `RETRIEVAL_MODES` / `RetrievalMode`.

### Changed

- Default retrieval is now `hybrid` instead of pure vector search. Set
  `retrieval.mode` to `"vector"` to restore the previous behavior exactly.

## [0.1.1]

### Added

- Beginner-friendly step-by-step tutorial and an FAQ in the README (EN + PT-BR).
- npm version and downloads badges.
- Automated npm publish workflow (with provenance) triggered by version tags.

### Changed

- Normalized the `bin` path in `package.json`.

## [0.1.0]

Initial release.

### Added

- `ailore index` — local-first, incremental indexing of a directory (respects
  `.gitignore`, skips binaries, only re-embeds changed files).
- `ailore ask` — retrieval-augmented answers grounded in your files, with
  inline `path:line` citations and token streaming.
- `ailore search` — pure semantic search with ranked snippets (text or `--json`).
- `ailore init` — generate a starter `ailore.config.json`.
- Provider-agnostic backends: Ollama (local), OpenAI, Gemini and OpenRouter,
  with embeddings and chat configured independently.
- Configurable generation (`temperature`, `maxTokens`, `topP`, `seed`) and
  retrieval (`topK`, `minScore`) via config file, env vars or CLI flags.
- Exported library API for embedding the engine in other tools.

[Unreleased]: https://github.com/gregdalzotto/ailore/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/gregdalzotto/ailore/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/gregdalzotto/ailore/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/gregdalzotto/ailore/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/gregdalzotto/ailore/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/gregdalzotto/ailore/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/gregdalzotto/ailore/releases/tag/v0.1.0
