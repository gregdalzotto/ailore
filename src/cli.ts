import { Command, Option } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import { runAsk } from './commands/ask.js';
import { runIndex } from './commands/index-cmd.js';
import { runInit } from './commands/init.js';
import { runSearch } from './commands/search.js';
import { PROVIDERS, RETRIEVAL_MODES, type Provider, type RetrievalMode } from './config/schema.js';
import { logger } from './utils/logger.js';

interface GlobalFlags {
  provider?: Provider;
  embeddingProvider?: Provider;
  model?: string;
  embeddingModel?: string;
  indexDir?: string;
  topK?: string;
  minScore?: string;
  mode?: RetrievalMode;
  temperature?: string;
  maxTokens?: string;
  topP?: string;
  seed?: string;
  path?: string;
}

const num = (value: string | undefined): number | undefined =>
  value === undefined ? undefined : Number(value);

/** Collapses global CLI flags into the override shape the commands expect. */
function toOverrides(flags: GlobalFlags) {
  return {
    provider: flags.provider,
    embeddingProvider: flags.embeddingProvider,
    chatModel: flags.model,
    embeddingModel: flags.embeddingModel,
    indexDir: flags.indexDir,
    topK: num(flags.topK),
    minScore: num(flags.minScore),
    mode: flags.mode,
    temperature: num(flags.temperature),
    maxTokens: num(flags.maxTokens),
    topP: num(flags.topP),
    seed: num(flags.seed),
    path: flags.path,
  };
}

function withGlobals(cmd: Command): Command {
  return cmd
    .addOption(new Option('-p, --provider <name>', 'chat provider').choices([...PROVIDERS]))
    .addOption(
      new Option('--embedding-provider <name>', 'embedding provider').choices([...PROVIDERS]),
    )
    .option('-m, --model <name>', 'chat model override')
    .option('--embedding-model <name>', 'embedding model override')
    .option('--index-dir <dir>', 'index directory (default: .ailore)')
    .option('-C, --path <dir>', 'project directory to operate on (default: cwd)');
}

const program = new Command();

program
  .name('ailore')
  .description(pkg.description)
  .version(pkg.version, '-v, --version', 'print the version');

withGlobals(
  program
    .command('index')
    .description('Index a directory of code/docs into a local vector store')
    .argument('[path]', 'directory to index (default: cwd)'),
).action(async (path: string | undefined, flags: GlobalFlags) => {
  const o = toOverrides(flags);
  await runIndex({ ...o, path: path ?? o.path });
});

withGlobals(
  program
    .command('search')
    .description('Search the index (hybrid by default, no LLM — just ranked snippets)')
    .argument('<query...>', 'the search query')
    .option('--json', 'output results as JSON')
    .option('-k, --top-k <n>', 'number of results to return')
    .option('--min-score <n>', 'drop results below this cosine score (0-1)')
    .addOption(new Option('--mode <mode>', 'retrieval strategy').choices([...RETRIEVAL_MODES])),
).action(async (query: string[], flags: GlobalFlags & { json?: boolean }) => {
  await runSearch(query.join(' '), { ...toOverrides(flags), json: flags.json });
});

withGlobals(
  program
    .command('ask')
    .description('Ask a question and get an answer grounded in your files, with citations')
    .argument('<question...>', 'the question to answer')
    .option('--no-stream', 'print the full answer at once instead of streaming')
    .option('-k, --top-k <n>', 'number of context snippets to retrieve')
    .option('--min-score <n>', 'drop context below this cosine score (0-1)')
    .addOption(new Option('--mode <mode>', 'retrieval strategy').choices([...RETRIEVAL_MODES]))
    .option('-t, --temperature <n>', 'sampling temperature (0-2)')
    .option('--max-tokens <n>', 'maximum tokens in the answer')
    .option('--top-p <n>', 'nucleus sampling cutoff (0-1)')
    .option('--seed <n>', 'fixed seed for reproducible answers'),
).action(async (question: string[], flags: GlobalFlags & { stream?: boolean }) => {
  // commander exposes `--no-stream` as `stream: false`.
  await runAsk(question.join(' '), { ...toOverrides(flags), noStream: flags.stream === false });
});

program
  .command('init')
  .description('Create a starter ailore.config.json in the current directory')
  .action(async () => {
    await runInit(process.cwd());
  });

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    logger.error((err as Error).message);
    process.exitCode = 1;
  }
}

void main();
