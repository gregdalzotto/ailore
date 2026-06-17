# Contributing to ailore

Thanks for your interest in improving **ailore**! This guide gets you set up.

## Development setup

```bash
git clone https://github.com/gregdalzotto/ailore.git
cd ailore
npm install
```

## Useful scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run build`     | Bundle the CLI and library with tsup |
| `npm run dev`       | Rebuild on change                    |
| `npm run typecheck` | Type-check with `tsc --noEmit`       |
| `npm run lint`      | Lint with ESLint                     |
| `npm run format`    | Format with Prettier                 |
| `npm test`          | Run the Vitest suite                 |

## Running the CLI locally

```bash
npm run build
node dist/cli.js --help
```

For a fully local end-to-end test, run an embedding model with [Ollama](https://ollama.com):

```bash
ollama pull nomic-embed-text
node dist/cli.js index ./src
node dist/cli.js search "how is chunking done?"
```

## Project layout

```
src/
├── cli.ts              # CLI entry (commander)
├── index.ts            # public library API
├── commands/           # one file per CLI command
├── core/               # engine: scanner, chunker, store, indexer, retriever, rag
├── providers/          # OpenAI / Gemini / Ollama / OpenRouter clients + factory
├── config/             # config schema + resolution
└── utils/              # logger and helpers
tests/                  # Vitest unit tests
```

## Guidelines

- **Keep it dependency-light.** A core goal is a tool that installs cleanly with no native modules.
- **Stay provider-agnostic.** New backends should implement the `EmbeddingProvider` / `ChatProvider` interfaces in `src/providers/types.ts`.
- **Add tests** for new logic, especially in `core/`.
- **All quality gates must pass** before a PR is merged: `typecheck`, `lint`, `test`, `build`.

## Commit messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.

## Adding a new provider

1. Create `src/providers/<name>.ts` implementing `EmbeddingProvider` and/or `ChatProvider`.
2. Wire it into `src/providers/factory.ts` and the `PROVIDERS` enum in `src/config/schema.ts`.
3. Add default models to `DEFAULT_MODELS`.
4. Document it in both READMEs.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
