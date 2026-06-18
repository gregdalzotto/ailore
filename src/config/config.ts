import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  DEFAULT_MODELS,
  DEFAULTS,
  fileConfigSchema,
  RETRIEVAL_MODES,
  type FileConfig,
  type Provider,
  type ResolvedConfig,
  type RetrievalMode,
} from './schema.js';

/** CLI flags that can override file/env config. All optional. */
export interface ConfigOverrides {
  provider?: Provider;
  embeddingProvider?: Provider;
  chatModel?: string;
  embeddingModel?: string;
  indexDir?: string;
  topK?: number;
  minScore?: number;
  mode?: RetrievalMode;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  seed?: number;
}

/** Validates a free-form retrieval-mode string (e.g. from env), else undefined. */
function modeEnv(value: string | undefined): RetrievalMode | undefined {
  return RETRIEVAL_MODES.includes(value as RetrievalMode) ? (value as RetrievalMode) : undefined;
}

/** Parses a numeric env var, returning undefined when unset or invalid. */
function numEnv(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

const CONFIG_FILENAMES = ['ailore.config.json', '.ailore.json'];

/** Reads and validates the config file, if one exists in `cwd`. */
async function loadFileConfig(cwd: string): Promise<FileConfig> {
  for (const name of CONFIG_FILENAMES) {
    try {
      const raw = await readFile(resolve(cwd, name), 'utf-8');
      return fileConfigSchema.parse(JSON.parse(raw));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw new Error(`Failed to load ${name}: ${(err as Error).message}`);
    }
  }
  return {};
}

/**
 * Resolves the effective configuration by merging, in increasing priority:
 * built-in defaults < config file < environment variables < CLI flags.
 */
export async function loadConfig(
  cwd: string,
  overrides: ConfigOverrides = {},
): Promise<ResolvedConfig> {
  const file = await loadFileConfig(cwd);
  const env = process.env;

  const provider: Provider =
    overrides.provider ?? (env.AILORE_PROVIDER as Provider) ?? file.provider ?? DEFAULTS.provider;

  // OpenRouter has no embedding endpoint, so when it is the chat provider and
  // no embedding provider was chosen, transparently fall back to local Ollama.
  const embeddingProvider: Provider =
    overrides.embeddingProvider ??
    (env.AILORE_EMBEDDING_PROVIDER as Provider) ??
    file.embeddingProvider ??
    (provider === 'openrouter' ? 'ollama' : provider);

  const chatModel =
    overrides.chatModel ?? env.AILORE_CHAT_MODEL ?? file.chatModel ?? DEFAULT_MODELS[provider].chat;

  const embeddingModel =
    overrides.embeddingModel ??
    env.AILORE_EMBEDDING_MODEL ??
    file.embeddingModel ??
    DEFAULT_MODELS[embeddingProvider].embedding;

  return {
    provider,
    embeddingProvider,
    chatModel,
    embeddingModel,
    ollamaBaseUrl: env.OLLAMA_BASE_URL ?? file.ollamaBaseUrl ?? DEFAULTS.ollamaBaseUrl,
    indexDir: overrides.indexDir ?? file.indexDir ?? DEFAULTS.indexDir,
    include: file.include,
    exclude: file.exclude ?? [],
    chunk: {
      maxChars: file.chunk?.maxChars ?? DEFAULTS.chunk.maxChars,
      overlapLines: file.chunk?.overlapLines ?? DEFAULTS.chunk.overlapLines,
    },
    retrieval: {
      topK: overrides.topK ?? file.retrieval?.topK ?? DEFAULTS.retrieval.topK,
      minScore:
        overrides.minScore ??
        numEnv(env.AILORE_MIN_SCORE) ??
        file.retrieval?.minScore ??
        DEFAULTS.retrieval.minScore,
      mode:
        overrides.mode ??
        modeEnv(env.AILORE_RETRIEVAL_MODE) ??
        file.retrieval?.mode ??
        DEFAULTS.retrieval.mode,
    },
    generation: {
      temperature:
        overrides.temperature ??
        numEnv(env.AILORE_TEMPERATURE) ??
        file.generation?.temperature ??
        DEFAULTS.generation.temperature,
      maxTokens: overrides.maxTokens ?? numEnv(env.AILORE_MAX_TOKENS) ?? file.generation?.maxTokens,
      topP: overrides.topP ?? numEnv(env.AILORE_TOP_P) ?? file.generation?.topP,
      seed: overrides.seed ?? numEnv(env.AILORE_SEED) ?? file.generation?.seed,
    },
    maxFileSizeBytes: file.maxFileSizeBytes ?? DEFAULTS.maxFileSizeBytes,
    apiKeys: {
      openai: env.OPENAI_API_KEY,
      gemini: env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY,
      openrouter: env.OPENROUTER_API_KEY,
    },
  };
}
