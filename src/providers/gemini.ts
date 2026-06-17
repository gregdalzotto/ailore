import {
  ProviderError,
  type ChatMessage,
  type ChatOptions,
  type ChatProvider,
  type EmbeddingProvider,
} from './types.js';

export interface GeminiConfig {
  apiKey: string;
  chatModel: string;
  embeddingModel: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/** Talks to Google's Gemini (Generative Language) REST API. */
export class GeminiProvider implements EmbeddingProvider, ChatProvider {
  readonly id = 'gemini';
  readonly model: string;
  private readonly baseUrl: string;

  constructor(private readonly config: GeminiConfig) {
    this.model = config.chatModel;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const model = `models/${this.config.embeddingModel}`;
    const res = await fetch(
      `${this.baseUrl}/${model}:batchEmbedContents?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: texts.map((text) => ({ model, content: { parts: [{ text }] } })),
        }),
      },
    );
    if (!res.ok) {
      throw new ProviderError(this.id, `embeddings failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { embeddings: { values: number[] }[] };
    return json.embeddings.map((e) => e.values);
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const { contents, systemInstruction } = toGeminiContents(messages);
    const res = await fetch(
      `${this.baseUrl}/models/${this.config.chatModel}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: opts.signal,
        body: JSON.stringify({
          contents,
          systemInstruction,
          generationConfig: {
            temperature: opts.temperature,
            maxOutputTokens: opts.maxTokens,
            topP: opts.topP,
            seed: opts.seed,
          },
        }),
      },
    );
    if (!res.ok) {
      throw new ProviderError(this.id, `chat failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  }

  async *chatStream(messages: ChatMessage[], opts: ChatOptions = {}): AsyncIterable<string> {
    const { contents, systemInstruction } = toGeminiContents(messages);
    const res = await fetch(
      `${this.baseUrl}/models/${this.config.chatModel}:streamGenerateContent?alt=sse&key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: opts.signal,
        body: JSON.stringify({
          contents,
          systemInstruction,
          generationConfig: {
            temperature: opts.temperature,
            maxOutputTokens: opts.maxTokens,
            topP: opts.topP,
            seed: opts.seed,
          },
        }),
      },
    );
    if (!res.ok || !res.body) {
      throw new ProviderError(this.id, `chat stream failed: ${res.status} ${await res.text()}`);
    }

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
          if (!trimmed.startsWith('data:')) continue;
          try {
            const parsed = JSON.parse(trimmed.slice('data:'.length).trim()) as {
              candidates?: { content?: { parts?: { text?: string }[] } }[];
            };
            const token = parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
            if (token) yield token;
          } catch {
            // Ignore malformed partial frames.
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Maps the neutral chat format to Gemini's shape: `system` messages become a
 * single `systemInstruction`, and `assistant` maps to the `model` role.
 */
function toGeminiContents(messages: ChatMessage[]): {
  contents: { role: 'user' | 'model'; parts: { text: string }[] }[];
  systemInstruction?: { parts: { text: string }[] };
} {
  const systemParts = messages.filter((m) => m.role === 'system').map((m) => ({ text: m.content }));
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));
  return {
    contents,
    systemInstruction: systemParts.length > 0 ? { parts: systemParts } : undefined,
  };
}
