import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/config.js';
import { IndexNotFoundError } from '../src/core/retriever.js';
import { runAskTool, runSearchTool, type McpToolContext } from '../src/mcp/tools.js';

// The MCP tools are thin orchestration over retrieve()/rag(), which are covered
// elsewhere. These tests pin the wiring + error surfacing without touching the
// network: retrieve() raises IndexNotFoundError before any embedding call when
// no index exists, so an un-indexed directory exercises the whole path offline.
describe('mcp tools', () => {
  let dir: string;
  let ctx: McpToolContext;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'ailore-mcp-'));
    ctx = { cwd: dir, config: await loadConfig(dir) };
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('runSearchTool fails clearly when the directory has no index', async () => {
    await expect(runSearchTool(ctx, { query: 'anything' })).rejects.toBeInstanceOf(
      IndexNotFoundError,
    );
  });

  it('runAskTool fails clearly when the directory has no index', async () => {
    await expect(runAskTool(ctx, { question: 'anything?' })).rejects.toBeInstanceOf(
      IndexNotFoundError,
    );
  });
});
