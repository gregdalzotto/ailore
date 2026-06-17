import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/config.js';

describe('loadConfig', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'ailore-cfg-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('falls back to defaults with no config file', async () => {
    const config = await loadConfig(dir);
    expect(config.provider).toBe('ollama');
    expect(config.chatModel).toBe('llama3.1');
    expect(config.embeddingModel).toBe('nomic-embed-text');
    expect(config.retrieval.topK).toBe(6);
  });

  it('reads provider and models from a config file', async () => {
    await writeFile(
      join(dir, 'ailore.config.json'),
      JSON.stringify({ provider: 'openai', chatModel: 'gpt-4o' }),
    );
    const config = await loadConfig(dir);
    expect(config.provider).toBe('openai');
    expect(config.chatModel).toBe('gpt-4o');
    // Embedding model defaults to the provider default when unset.
    expect(config.embeddingModel).toBe('text-embedding-3-small');
  });

  it('CLI overrides beat the config file', async () => {
    await writeFile(join(dir, 'ailore.config.json'), JSON.stringify({ provider: 'openai' }));
    const config = await loadConfig(dir, { provider: 'gemini', topK: 12 });
    expect(config.provider).toBe('gemini');
    expect(config.retrieval.topK).toBe(12);
  });

  it('uses the default generation temperature when unset', async () => {
    const config = await loadConfig(dir);
    expect(config.generation.temperature).toBe(0.2);
    expect(config.retrieval.minScore).toBe(0);
  });

  it('reads generation params from the config file', async () => {
    await writeFile(
      join(dir, 'ailore.config.json'),
      JSON.stringify({ generation: { temperature: 0.9, maxTokens: 512, seed: 42 } }),
    );
    const config = await loadConfig(dir);
    expect(config.generation.temperature).toBe(0.9);
    expect(config.generation.maxTokens).toBe(512);
    expect(config.generation.seed).toBe(42);
  });

  it('CLI generation overrides beat the config file', async () => {
    await writeFile(
      join(dir, 'ailore.config.json'),
      JSON.stringify({ generation: { temperature: 0.9 } }),
    );
    const config = await loadConfig(dir, { temperature: 0, minScore: 0.3 });
    expect(config.generation.temperature).toBe(0);
    expect(config.retrieval.minScore).toBe(0.3);
  });

  it('falls back to local Ollama embeddings when chat is openrouter', async () => {
    await writeFile(join(dir, 'ailore.config.json'), JSON.stringify({ provider: 'openrouter' }));
    const config = await loadConfig(dir);
    expect(config.provider).toBe('openrouter');
    // OpenRouter has no embeddings, so the embedding provider defaults to Ollama.
    expect(config.embeddingProvider).toBe('ollama');
    expect(config.embeddingModel).toBe('nomic-embed-text');
  });
});
