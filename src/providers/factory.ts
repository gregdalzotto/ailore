import type { Provider, ResolvedConfig } from '../config/schema.js';
import { GeminiProvider } from './gemini.js';
import { OllamaProvider } from './ollama.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';
import { ProviderError, type ChatProvider, type EmbeddingProvider } from './types.js';

function requireKey(config: ResolvedConfig, provider: Provider): string {
  const key =
    provider === 'openai'
      ? config.apiKeys.openai
      : provider === 'gemini'
        ? config.apiKeys.gemini
        : provider === 'openrouter'
          ? config.apiKeys.openrouter
          : undefined;
  if (!key) {
    const envName = provider === 'gemini' ? 'GEMINI_API_KEY' : `${provider.toUpperCase()}_API_KEY`;
    throw new ProviderError(provider, `missing API key. Set the ${envName} environment variable.`);
  }
  return key;
}

/** Builds the embedding backend selected in the resolved config. */
export function createEmbeddingProvider(config: ResolvedConfig): EmbeddingProvider {
  const provider = config.embeddingProvider;
  switch (provider) {
    case 'ollama':
      return new OllamaProvider({
        baseUrl: config.ollamaBaseUrl,
        chatModel: config.chatModel,
        embeddingModel: config.embeddingModel,
      });
    case 'gemini':
      return new GeminiProvider({
        apiKey: requireKey(config, 'gemini'),
        chatModel: config.chatModel,
        embeddingModel: config.embeddingModel,
      });
    case 'openai':
      return new OpenAICompatibleProvider({
        id: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: requireKey(config, 'openai'),
        chatModel: config.chatModel,
        embeddingModel: config.embeddingModel,
      });
    case 'openrouter':
      // OpenRouter has no reliable embedding endpoint; guide users to a real one.
      throw new ProviderError(
        'openrouter',
        'OpenRouter does not provide embeddings. Set "embeddingProvider" to "ollama" or "openai".',
      );
  }
}

/** Builds the chat backend selected in the resolved config. */
export function createChatProvider(config: ResolvedConfig): ChatProvider {
  const provider = config.provider;
  switch (provider) {
    case 'ollama':
      return new OllamaProvider({
        baseUrl: config.ollamaBaseUrl,
        chatModel: config.chatModel,
        embeddingModel: config.embeddingModel,
      });
    case 'gemini':
      return new GeminiProvider({
        apiKey: requireKey(config, 'gemini'),
        chatModel: config.chatModel,
        embeddingModel: config.embeddingModel,
      });
    case 'openai':
      return new OpenAICompatibleProvider({
        id: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: requireKey(config, 'openai'),
        chatModel: config.chatModel,
        embeddingModel: config.embeddingModel,
      });
    case 'openrouter':
      return new OpenAICompatibleProvider({
        id: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: requireKey(config, 'openrouter'),
        chatModel: config.chatModel,
        embeddingModel: config.embeddingModel,
        headers: {
          'HTTP-Referer': 'https://github.com/gregdalzotto/ailore',
          'X-Title': 'ailore',
        },
      });
  }
}
