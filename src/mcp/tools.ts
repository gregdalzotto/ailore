/**
 * MCP tool logic, kept free of any SDK dependency.
 *
 * Each function takes a plain context + validated args and returns the text an
 * MCP client should receive. Isolating it here means the behaviour is unit
 * testable without the `@modelcontextprotocol/sdk` package installed, and the
 * server layer ({@link ./server.ts}) stays a thin wiring shim.
 */
import type { ResolvedConfig, RetrievalMode } from '../config/schema.js';
import { buildRagMessages, uniqueSources } from '../core/rag.js';
import { retrieve } from '../core/retriever.js';
import type { SearchResult } from '../core/store.js';
import { createChatProvider, createEmbeddingProvider } from '../providers/factory.js';

/** Everything a tool needs to run, resolved once when the server starts. */
export interface McpToolContext {
  cwd: string;
  config: ResolvedConfig;
}

/** Shared shape for the optional retrieval overrides a tool call may carry. */
interface RetrievalArgs {
  topK?: number;
  mode?: RetrievalMode;
}

/** Applies per-call retrieval overrides without mutating the base config. */
function withOverrides(config: ResolvedConfig, args: RetrievalArgs): ResolvedConfig {
  if (args.mode === undefined) return config;
  return { ...config, retrieval: { ...config.retrieval, mode: args.mode } };
}

/** Renders one hit as `path:line-line (score)` followed by a short preview. */
function formatHit({ chunk, score }: SearchResult): string {
  const ref = `${chunk.file}:${chunk.startLine}-${chunk.endLine}`;
  const preview = chunk.text.split('\n').slice(0, 4).join('\n');
  return `${ref} (score ${score.toFixed(3)})\n${preview}`;
}

/** `ailore_search` — ranked snippets, no LLM step. */
export async function runSearchTool(
  ctx: McpToolContext,
  args: { query: string } & RetrievalArgs,
): Promise<string> {
  const config = withOverrides(ctx.config, args);
  const embedder = createEmbeddingProvider(config);
  const results = await retrieve(ctx.cwd, config, embedder, args.query, args.topK);

  if (results.length === 0) return 'No matches found in the index for that query.';
  return results.map(formatHit).join('\n\n---\n\n');
}

/** `ailore_ask` — a grounded answer with inline `[path:line]` citations. */
export async function runAskTool(
  ctx: McpToolContext,
  args: { question: string } & RetrievalArgs,
): Promise<string> {
  const config = withOverrides(ctx.config, args);
  const embedder = createEmbeddingProvider(config);
  const results = await retrieve(ctx.cwd, config, embedder, args.question, args.topK);

  if (results.length === 0) {
    return 'Nothing relevant was found in the index for that question.';
  }

  const chat = createChatProvider(config);
  const answer = await chat.chat(buildRagMessages(args.question, results), {
    temperature: config.generation.temperature,
    maxTokens: config.generation.maxTokens,
    topP: config.generation.topP,
    seed: config.generation.seed,
  });

  const sources = uniqueSources(results)
    .map((s) => `  ${s}`)
    .join('\n');
  return `${answer}\n\nSources:\n${sources}`;
}
