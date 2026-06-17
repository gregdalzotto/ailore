import { loadConfig, type ConfigOverrides } from '../config/config.js';
import { buildIndex } from '../core/indexer.js';
import { createEmbeddingProvider } from '../providers/factory.js';
import { colors, logger } from '../utils/logger.js';

export interface IndexCommandOptions extends ConfigOverrides {
  path?: string;
}

/** Implements `ailore index [path]`. */
export async function runIndex(options: IndexCommandOptions): Promise<void> {
  const cwd = options.path ?? process.cwd();
  const config = await loadConfig(cwd, options);
  const embedder = createEmbeddingProvider(config);

  logger.info(
    `Indexing ${colors.bold(cwd)} with ${colors.bold(
      `${config.embeddingProvider}:${config.embeddingModel}`,
    )}`,
  );

  const result = await buildIndex(cwd, config, embedder, (progress) => {
    if (progress.phase === 'scan') {
      process.stderr.write(colors.dim('  scanning files...\n'));
    } else if (progress.phase === 'embed' && progress.embeddedChunks > 0) {
      process.stderr.write(colors.dim(`\r  embedding chunks: ${progress.embeddedChunks}`));
    } else if (progress.phase === 'save') {
      process.stderr.write('\n');
    }
  });

  logger.success(
    `Indexed ${colors.bold(String(result.fileCount))} files / ` +
      `${colors.bold(String(result.chunkCount))} chunks`,
  );
  logger.dim(
    `  ${result.changed} changed · ${result.unchanged} unchanged · ${result.removed} removed`,
  );
}
