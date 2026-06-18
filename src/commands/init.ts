import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { logger } from '../utils/logger.js';

const SAMPLE_CONFIG = {
  $schema: 'https://github.com/gregdalzotto/ailore',
  provider: 'ollama',
  embeddingProvider: 'ollama',
  chatModel: 'llama3.1',
  embeddingModel: 'nomic-embed-text',
  retrieval: { topK: 6, minScore: 0, mode: 'hybrid' },
  generation: { temperature: 0.2 },
  chunk: { maxChars: 1200, overlapLines: 2 },
  exclude: [],
};

/** Writes a starter `ailore.config.json` into the current directory. */
export async function runInit(cwd: string): Promise<void> {
  const path = resolve(cwd, 'ailore.config.json');
  await writeFile(path, `${JSON.stringify(SAMPLE_CONFIG, null, 2)}\n`, { flag: 'wx' }).catch(
    (err: NodeJS.ErrnoException) => {
      if (err.code === 'EEXIST') {
        throw new Error('ailore.config.json already exists — not overwriting it.');
      }
      throw err;
    },
  );

  logger.success('Created ailore.config.json');
  logger.dim('Next steps:');
  logger.dim('  1. Adjust the provider/models to taste.');
  logger.dim('  2. For hosted providers, export the matching API key, e.g.');
  logger.dim('     export OPENAI_API_KEY=...   (or GEMINI_API_KEY / OPENROUTER_API_KEY)');
  logger.dim('  3. Run "ailore index" to build the index.');
}
