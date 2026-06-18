# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/gregdalzotto/ailore/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/gregdalzotto/ailore/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/gregdalzotto/ailore/releases/tag/v0.1.0
