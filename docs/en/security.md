# Security

[🏠 Home](../../README.md) · [📚 Docs](./README.md) · [Português 🇧🇷](../pt-BR/security.md)

How ailore handles your data, secrets and untrusted input — and how to report a vulnerability.

## Reporting a vulnerability

> [!IMPORTANT]
> Please **do not** open a public issue for security problems. Report privately through [GitHub Security Advisories](https://github.com/gregdalzotto/ailore/security/advisories/new), or by email to **gregori.d@gmail.com**.

You can expect an initial response within a few days. Once a fix is ready, a new patched version is released and the reporter credited (unless anonymity is requested).

## Your data and where it goes

ailore is a local CLI that reads your files, stores an index on disk, and (for `ask`) sends retrieved snippets to a model provider.

| Setup                                              | What leaves your machine                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Ollama** (default)                               | Nothing — indexing and answering run entirely locally.                                                                               |
| **Hosted provider** (OpenAI / Gemini / OpenRouter) | For a question, the retrieved chunk text **plus your question** are sent to that provider — the same exposure as any API call to it. |

## API keys

> [!NOTE]
> Keys are read **only** from environment variables (`OPENAI_API_KEY`, `GEMINI_API_KEY` / `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`). They are never read from, or written to, the config file or the index, so they can't be committed by accident.

ailore does not log request URLs or keys. (The Gemini API takes its key as a URL query parameter by design; ailore keeps it out of error messages.)

## Untrusted repositories / config

> [!WARNING]
> `ailore.config.json` is a **project file**. If you run ailore inside a repository you don't trust, review its config first — like any other executable project config (build scripts, editor tasks). In particular it can set the **provider / model / base URL** (e.g. `ollamaBaseUrl`), which controls _where_ your snippets and questions are sent.

As a hardening measure, the file scanner is **bounded to the project root**: `include` globs that use `..` or absolute paths are rejected, so a committed config cannot widen indexing to read files outside the directory you point ailore at.

## Prompt injection

Because retrieved file content is placed in the model's prompt, content in an indexed file can attempt to influence the answer — a property inherent to all RAG. Treat generated answers as assistance, not authority, and use the `path:line` [citations](./architecture.md) to verify against the real source.

## Dependencies

The published package ships a small, dependency-light runtime; the heavier MCP SDK is an **optional** dependency installed only by users who run [`ailore mcp`](./mcp.md). Development and build tooling is not part of the published package.

## Supported versions

As a pre-1.0 project, only the latest released version receives security fixes.

<!-- nav-footer -->

---

<div align="center"><sub>[← Prev: How it works](./architecture.md) · [📚 All guides](./README.md) · [Next: Use as a library →](./library-api.md)</sub></div>
