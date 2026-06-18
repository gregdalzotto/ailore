# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Instead, report vulnerabilities privately through GitHub's
[Security Advisories](https://github.com/gregdalzotto/ailore/security/advisories/new),
or by email to **gregori.d@gmail.com**.

You can expect an initial response within a few days. Once a fix is ready, a new
patched version will be released and the reporter credited (unless anonymity is
requested).

## Supported versions

As a pre-1.0 project, only the latest released version receives security fixes.

## Security model

ailore is a local CLI that reads your files, stores an index on disk, and (for
`ask`) sends retrieved snippets to a model provider. A few things worth knowing:

### Your data and where it goes

- **With Ollama (the default):** indexing and answering run entirely on your
  machine. Nothing is sent over the network.
- **With a hosted provider (OpenAI / Gemini / OpenRouter):** for a question, the
  retrieved chunk text **plus your question** are sent to that provider to
  generate the answer — the same exposure as any API call to that service.

### API keys

- Keys are read **only** from environment variables (`OPENAI_API_KEY`,
  `GEMINI_API_KEY` / `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`). They are never read
  from, or written to, the config file or the index, so they can't be committed
  by accident.
- ailore does not log request URLs or keys. (Note: the Gemini API takes its key
  as a URL query parameter by design; ailore keeps it out of error messages.)

### Untrusted repositories / config

`ailore.config.json` is a **project file**: if you run ailore inside a repository
you don't trust, treat its config like any other executable project config
(build scripts, editor tasks, etc.) and review it first. In particular a config
can set the **provider / model / base URL** (e.g. `ollamaBaseUrl`), which
controls _where_ your snippets and questions are sent.

As a hardening measure, the file scanner is **bounded to the project root**:
`include` globs that use `..` or absolute paths are rejected, so a committed
config cannot widen indexing to read files outside the directory you point
ailore at.

### Prompt injection

Because retrieved file content is placed in the model's prompt, content in an
indexed file can attempt to influence the answer (a property inherent to all
RAG). Treat generated answers as assistance, not authority, and rely on the
`path:line` citations to verify against the real source.

## Dependencies

The published package ships a small, dependency-light runtime; the heavier
Model Context Protocol SDK is an **optional** dependency installed only by users
who run `ailore mcp`. Development/build tooling is not part of the published
package.
