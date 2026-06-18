import { z } from 'zod';

export const PROVIDERS = ['openai', 'gemini', 'ollama', 'openrouter'] as const;
export const providerSchema = z.enum(PROVIDERS);
export type Provider = z.infer<typeof providerSchema>;

/**
 * How retrieval ranks chunks:
 * - `vector`  — pure semantic (cosine) search.
 * - `keyword` — pure lexical BM25 search; best for exact symbols/strings.
 * - `hybrid`  — fuses both via Reciprocal Rank Fusion (default, most robust).
 */
export const RETRIEVAL_MODES = ['vector', 'keyword', 'hybrid'] as const;
export const retrievalModeSchema = z.enum(RETRIEVAL_MODES);
export type RetrievalMode = z.infer<typeof retrievalModeSchema>;

/**
 * Schema for the optional config file (`ailore.config.json`). Every field is
 * optional; missing values fall back to env vars, then to built-in defaults.
 * API keys are intentionally NOT part of the file schema — they must come from
 * the environment so secrets never end up committed to a repo.
 */
export const fileConfigSchema = z
  .object({
    /** Optional JSON Schema reference for editor autocompletion. */
    $schema: z.string().optional(),
    provider: providerSchema.optional(),
    embeddingProvider: providerSchema.optional(),
    chatModel: z.string().optional(),
    embeddingModel: z.string().optional(),
    ollamaBaseUrl: z.string().url().optional(),
    indexDir: z.string().optional(),
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    chunk: z
      .object({
        maxChars: z.number().int().positive().optional(),
        overlapLines: z.number().int().nonnegative().optional(),
      })
      .optional(),
    retrieval: z
      .object({
        topK: z.number().int().positive().optional(),
        /** Drop chunks scoring below this cosine similarity (0–1). */
        minScore: z.number().min(-1).max(1).optional(),
        /** Ranking strategy: vector, keyword (BM25) or hybrid. */
        mode: retrievalModeSchema.optional(),
      })
      .optional(),
    generation: z
      .object({
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().int().positive().optional(),
        topP: z.number().min(0).max(1).optional(),
        seed: z.number().int().optional(),
      })
      .optional(),
    maxFileSizeBytes: z.number().int().positive().optional(),
  })
  .strict();

export type FileConfig = z.infer<typeof fileConfigSchema>;

/** Fully resolved configuration used throughout the app. */
export interface ResolvedConfig {
  provider: Provider;
  embeddingProvider: Provider;
  chatModel: string;
  embeddingModel: string;
  ollamaBaseUrl: string;
  indexDir: string;
  include: string[] | undefined;
  exclude: string[];
  chunk: { maxChars: number; overlapLines: number };
  retrieval: { topK: number; minScore: number; mode: RetrievalMode };
  generation: { temperature: number; maxTokens?: number; topP?: number; seed?: number };
  maxFileSizeBytes: number;
  apiKeys: {
    openai?: string;
    gemini?: string;
    openrouter?: string;
  };
}

/** Sensible per-provider default models. */
export const DEFAULT_MODELS: Record<Provider, { chat: string; embedding: string }> = {
  openai: { chat: 'gpt-4o-mini', embedding: 'text-embedding-3-small' },
  gemini: { chat: 'gemini-1.5-flash', embedding: 'text-embedding-004' },
  ollama: { chat: 'llama3.1', embedding: 'nomic-embed-text' },
  // OpenRouter is great for chat but does not offer first-class embeddings,
  // so embeddings default to local Ollama when OpenRouter is the chat provider.
  openrouter: { chat: 'openai/gpt-4o-mini', embedding: 'nomic-embed-text' },
};

export const DEFAULTS = {
  provider: 'ollama' as Provider,
  ollamaBaseUrl: 'http://localhost:11434',
  indexDir: '.ailore',
  chunk: { maxChars: 1200, overlapLines: 2 },
  retrieval: { topK: 6, minScore: 0, mode: 'hybrid' as RetrievalMode },
  // A low temperature keeps RAG answers grounded and repeatable by default.
  generation: { temperature: 0.2 },
  maxFileSizeBytes: 1_000_000,
};
