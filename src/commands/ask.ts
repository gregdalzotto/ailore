import { loadConfig, type ConfigOverrides } from '../config/config.js';
import { buildRagMessages, uniqueSources } from '../core/rag.js';
import { retrieve } from '../core/retriever.js';
import { createChatProvider, createEmbeddingProvider } from '../providers/factory.js';
import { colors, logger } from '../utils/logger.js';

export interface AskCommandOptions extends ConfigOverrides {
  path?: string;
  /** Disable token streaming and print the full answer at once. */
  noStream?: boolean;
}

/** Implements `ailore ask <question>` — retrieval-augmented answer. */
export async function runAsk(question: string, options: AskCommandOptions): Promise<void> {
  const cwd = options.path ?? process.cwd();
  const config = await loadConfig(cwd, options);
  const embedder = createEmbeddingProvider(config);

  const results = await retrieve(cwd, config, embedder, question, options.topK);
  if (results.length === 0) {
    logger.warn('Nothing relevant found in the index for that question.');
    return;
  }

  const chat = createChatProvider(config);
  const messages = buildRagMessages(question, results);
  const chatOptions = {
    temperature: config.generation.temperature,
    maxTokens: config.generation.maxTokens,
    topP: config.generation.topP,
    seed: config.generation.seed,
  };

  logger.dim(
    `Answering with ${config.provider}:${config.chatModel} (temp ${config.generation.temperature})\n`,
  );

  if (options.noStream) {
    const answer = await chat.chat(messages, chatOptions);
    process.stdout.write(`${answer}\n`);
  } else {
    for await (const token of chat.chatStream(messages, chatOptions)) {
      process.stdout.write(token);
    }
    process.stdout.write('\n');
  }

  // Always show the grounding sources so answers stay auditable.
  process.stdout.write(`\n${colors.bold('Sources:')}\n`);
  for (const source of uniqueSources(results)) {
    process.stdout.write(`  ${colors.green(source)}\n`);
  }
}
