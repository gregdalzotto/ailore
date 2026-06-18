import pkg from '../../package.json' with { type: 'json' };
import { loadConfig, type ConfigOverrides } from '../config/config.js';
import { startMcpServer } from '../mcp/server.js';
import { colors, logger } from '../utils/logger.js';

export interface McpCommandOptions extends ConfigOverrides {
  path?: string;
}

/**
 * Implements `ailore mcp` — run a Model Context Protocol server over stdio so
 * MCP clients (Claude clients, Cursor, …) can search and ask against the index.
 * All logging goes to stderr; stdout is reserved for the MCP protocol.
 */
export async function runMcp(options: McpCommandOptions): Promise<void> {
  const cwd = options.path ?? process.cwd();
  const config = await loadConfig(cwd, options);

  logger.info(
    `ailore MCP server (stdio) — index ${colors.bold(cwd)} via ` +
      `${colors.bold(`${config.provider}:${config.chatModel}`)}`,
  );
  logger.dim('  Tools: ailore_search, ailore_ask. Waiting for an MCP client…');

  await startMcpServer(cwd, config, pkg.version);
}
