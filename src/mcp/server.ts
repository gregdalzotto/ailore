/**
 * Thin Model Context Protocol (stdio) server.
 *
 * The `@modelcontextprotocol/sdk` package is an *optional* peer dependency, so
 * the core `ailore` install stays lean — only users who run `ailore mcp` need
 * it. It is therefore loaded with a dynamic import, and a missing package turns
 * into an actionable install hint instead of a stack trace.
 *
 * IMPORTANT: stdio MCP uses stdout for the JSON-RPC protocol, so this path must
 * never write to stdout itself — all human-facing logging goes to stderr.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import type { ResolvedConfig } from '../config/schema.js';
import { RETRIEVAL_MODES } from '../config/schema.js';
import { runAskTool, runSearchTool, type McpToolContext } from './tools.js';

/** Loads the optional SDK, or throws an actionable error if it is absent. */
async function loadSdk(): Promise<{
  McpServer: typeof McpServer;
  StdioServerTransport: typeof StdioServerTransport;
}> {
  try {
    const [mcp, stdio] = await Promise.all([
      import('@modelcontextprotocol/sdk/server/mcp.js'),
      import('@modelcontextprotocol/sdk/server/stdio.js'),
    ]);
    return { McpServer: mcp.McpServer, StdioServerTransport: stdio.StdioServerTransport };
  } catch (err) {
    throw new Error(
      'The MCP server needs the optional "@modelcontextprotocol/sdk" package.\n' +
        'Install it alongside ailore, e.g.:\n\n' +
        '  npm install -g @modelcontextprotocol/sdk\n\n' +
        `(original error: ${(err as Error).message})`,
    );
  }
}

/** Wraps a tool function so thrown errors become MCP error results. */
function toolResult(run: () => Promise<string>) {
  return async () => {
    try {
      return { content: [{ type: 'text' as const, text: await run() }] };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  };
}

const modeSchema = z
  .enum(RETRIEVAL_MODES)
  .optional()
  .describe('Retrieval strategy: vector, keyword or hybrid (defaults to the configured mode).');
const topKSchema = z
  .number()
  .int()
  .positive()
  .optional()
  .describe('Maximum number of snippets to use.');

/**
 * Starts the MCP server on stdio and blocks until the transport closes. Exposes
 * two tools to any MCP client (Claude clients, Cursor, etc.): `ailore_search`
 * and `ailore_ask`, both grounded in the local index with `path:line` sources.
 */
export async function startMcpServer(
  cwd: string,
  config: ResolvedConfig,
  version: string,
): Promise<void> {
  const { McpServer, StdioServerTransport } = await loadSdk();
  const ctx: McpToolContext = { cwd, config };

  const server = new McpServer({ name: 'ailore', version });

  server.registerTool(
    'ailore_search',
    {
      title: 'Search the codebase/docs',
      description:
        'Semantic + keyword (hybrid) search over the locally indexed files. ' +
        'Returns ranked snippets, each with a path:startLine-endLine citation. No LLM call.',
      inputSchema: {
        query: z.string().describe('What to search for.'),
        topK: topKSchema,
        mode: modeSchema,
      },
    },
    (args) => toolResult(() => runSearchTool(ctx, args))(),
  );

  server.registerTool(
    'ailore_ask',
    {
      title: 'Ask a grounded question',
      description:
        'Answer a question using ONLY the locally indexed files, with inline ' +
        '[path:line] citations and a list of sources. Use for questions about this project.',
      inputSchema: {
        question: z.string().describe('The question to answer.'),
        topK: topKSchema,
        mode: modeSchema,
      },
    },
    (args) => toolResult(() => runAskTool(ctx, args))(),
  );

  await server.connect(new StdioServerTransport());
}
