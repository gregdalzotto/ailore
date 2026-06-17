import {
  ProviderError,
  type ChatMessage,
  type ChatOptions,
  type ChatProvider,
  type EmbeddingProvider,
} from './types.js';

export interface OpenAICompatibleConfig {
  id: string;
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  embeddingModel: string;
  /** Extra headers (e.g. OpenRouter attribution headers). */
  headers?: Record<string, string>;
}

/**
 * Implements both embeddings and chat against any OpenAI-compatible REST API.
 * Both OpenAI and OpenRouter expose the exact same `/embeddings` and
 * `/chat/completions` contracts, so they share this single implementation.
 */
export class OpenAICompatibleProvider implements EmbeddingProvider, ChatProvider {
  readonly id: string;
  readonly model: string;

  constructor(private readonly config: OpenAICompatibleConfig) {
    this.id = config.id;
    this.model = config.chatModel;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
      ...this.config.headers,
    };
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await fetch(`${this.config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ model: this.config.embeddingModel, input: texts }),
    });
    if (!res.ok) {
      throw new ProviderError(this.id, `embeddings failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { data: { embedding: number[] }[] };
    return json.data.map((d) => d.embedding);
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      signal: opts.signal,
      body: JSON.stringify({
        model: this.config.chatModel,
        messages,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        top_p: opts.topP,
        seed: opts.seed,
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new ProviderError(this.id, `chat failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { choices: { message: { content: string } }[] };
    return json.choices[0]?.message.content ?? '';
  }

  async *chatStream(messages: ChatMessage[], opts: ChatOptions = {}): AsyncIterable<string> {
    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      signal: opts.signal,
      body: JSON.stringify({
        model: this.config.chatModel,
        messages,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        top_p: opts.topP,
        seed: opts.seed,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      throw new ProviderError(this.id, `chat stream failed: ${res.status} ${await res.text()}`);
    }

    // Parse the Server-Sent Events stream, accumulating `delta.content`.
    for await (const data of parseSSE(res.body)) {
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data) as { choices: { delta?: { content?: string } }[] };
        const token = parsed.choices[0]?.delta?.content;
        if (token) yield token;
      } catch {
        // Ignore keep-alive comments and malformed partial frames.
      }
    }
  }
}

/** Reads an SSE body and yields the payload of each `data:` line. */
async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
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
        if (trimmed.startsWith('data:')) {
          yield trimmed.slice('data:'.length).trim();
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
