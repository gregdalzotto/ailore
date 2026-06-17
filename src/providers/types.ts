/**
 * Provider abstractions.
 *
 * ailore is provider-agnostic: every backend (OpenAI, Gemini, Ollama,
 * OpenRouter) implements the same small interfaces below. Embeddings and chat
 * are decoupled on purpose — you can, for example, generate embeddings locally
 * with Ollama while answering with a hosted model, or vice-versa.
 */

/** A single message in a chat conversation. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Options that tune a chat completion. */
export interface ChatOptions {
  /** Sampling temperature; lower is more deterministic. */
  temperature?: number;
  /** Upper bound on tokens generated in the answer. */
  maxTokens?: number;
  /** Nucleus sampling cutoff (0–1). */
  topP?: number;
  /** Fixed seed for reproducible output, when the backend supports it. */
  seed?: number;
  /** Allows the caller to cancel an in-flight request. */
  signal?: AbortSignal;
}

/** Turns text into vectors for semantic search. */
export interface EmbeddingProvider {
  /** Stable identifier of the backend, e.g. `"openai"`. */
  readonly id: string;
  /** The embedding model in use, e.g. `"text-embedding-3-small"`. */
  readonly model: string;
  /**
   * Embeds a batch of texts. Implementations must return exactly one vector
   * per input, in the same order.
   */
  embed(texts: string[]): Promise<number[][]>;
}

/** Generates natural-language answers. */
export interface ChatProvider {
  readonly id: string;
  readonly model: string;
  /** Returns the full completion as a single string. */
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string>;
  /** Yields the completion incrementally as tokens arrive. */
  chatStream(messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<string>;
}

/** Raised when a provider call fails, with a human-friendly message. */
export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(`[${provider}] ${message}`, options);
    this.name = 'ProviderError';
  }
}
