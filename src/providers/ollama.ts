import {
  ProviderError,
  type ChatMessage,
  type ChatOptions,
  type ChatProvider,
  type EmbeddingProvider,
} from './types.js';

export interface OllamaConfig {
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
}

/**
 * Talks to a local Ollama server (https://ollama.com). This is the fully
 * offline, zero-cost path: no API key, no data leaving the machine.
 */
export class OllamaProvider implements EmbeddingProvider, ChatProvider {
  readonly id = 'ollama';
  readonly model: string;

  constructor(private readonly config: OllamaConfig) {
    this.model = config.chatModel;
  }

  /** POSTs JSON to Ollama, turning connection failures into a helpful error. */
  private async post(path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
    try {
      return await fetch(`${this.config.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
    } catch (err) {
      throw new ProviderError(
        this.id,
        `could not reach Ollama at ${this.config.baseUrl}. Is it running? Start it with "ollama serve" and pull the model with "ollama pull ${this.config.embeddingModel}".`,
        { cause: err },
      );
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await this.post('/api/embed', {
      model: this.config.embeddingModel,
      input: texts,
    });
    if (!res.ok) {
      throw new ProviderError(this.id, `embeddings failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { embeddings: number[][] };
    return json.embeddings;
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const res = await this.post(
      '/api/chat',
      {
        model: this.config.chatModel,
        messages,
        stream: false,
        options: toOllamaOptions(opts),
      },
      opts.signal,
    );
    if (!res.ok) {
      throw new ProviderError(this.id, `chat failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { message?: { content: string } };
    return json.message?.content ?? '';
  }

  async *chatStream(messages: ChatMessage[], opts: ChatOptions = {}): AsyncIterable<string> {
    const res = await this.post(
      '/api/chat',
      {
        model: this.config.chatModel,
        messages,
        stream: true,
        options: toOllamaOptions(opts),
      },
      opts.signal,
    );
    if (!res.ok || !res.body) {
      throw new ProviderError(this.id, `chat stream failed: ${res.status} ${await res.text()}`);
    }

    // Ollama streams newline-delimited JSON objects (NDJSON), not SSE.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const parsed = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean };
          const token = parsed.message?.content;
          if (token) yield token;
          if (parsed.done) return;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/** Maps neutral chat options to Ollama's `options` object (snake_case). */
function toOllamaOptions(opts: ChatOptions): Record<string, number> {
  const options: Record<string, number> = {};
  if (opts.temperature !== undefined) options.temperature = opts.temperature;
  if (opts.maxTokens !== undefined) options.num_predict = opts.maxTokens;
  if (opts.topP !== undefined) options.top_p = opts.topP;
  if (opts.seed !== undefined) options.seed = opts.seed;
  return options;
}
