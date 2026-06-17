import { loadConfig, type ConfigOverrides } from '../config/config.js';
import { retrieve } from '../core/retriever.js';
import { createEmbeddingProvider } from '../providers/factory.js';
import { colors, logger } from '../utils/logger.js';

export interface SearchCommandOptions extends ConfigOverrides {
  path?: string;
  json?: boolean;
}

/** Implements `ailore search <query>` — semantic search with no LLM step. */
export async function runSearch(query: string, options: SearchCommandOptions): Promise<void> {
  const cwd = options.path ?? process.cwd();
  const config = await loadConfig(cwd, options);
  const embedder = createEmbeddingProvider(config);

  const results = await retrieve(cwd, config, embedder, query, options.topK);

  if (options.json) {
    const payload = results.map((r) => ({
      file: r.chunk.file,
      startLine: r.chunk.startLine,
      endLine: r.chunk.endLine,
      score: Number(r.score.toFixed(4)),
      text: r.chunk.text,
    }));
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (results.length === 0) {
    logger.warn('No matches found.');
    return;
  }

  for (const { chunk, score } of results) {
    const ref = `${chunk.file}:${chunk.startLine}-${chunk.endLine}`;
    const preview = chunk.text.split('\n').slice(0, 3).join('\n');
    process.stdout.write(`${colors.green(ref)} ${colors.dim(`(${score.toFixed(3)})`)}\n`);
    process.stdout.write(`${colors.dim(preview)}\n\n`);
  }
}
