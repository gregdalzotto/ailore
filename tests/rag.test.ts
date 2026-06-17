import { describe, expect, it } from 'vitest';
import { buildRagMessages, formatContext, uniqueSources } from '../src/core/rag.js';
import type { SearchResult } from '../src/core/store.js';

const results: SearchResult[] = [
  {
    score: 0.9,
    chunk: {
      id: 'auth.ts:10-20',
      file: 'auth.ts',
      startLine: 10,
      endLine: 20,
      text: 'token logic',
      vector: [],
    },
  },
  {
    score: 0.7,
    chunk: {
      id: 'auth.ts:10-20',
      file: 'auth.ts',
      startLine: 10,
      endLine: 20,
      text: 'token logic',
      vector: [],
    },
  },
  {
    score: 0.5,
    chunk: {
      id: 'db.ts:1-5',
      file: 'db.ts',
      startLine: 1,
      endLine: 5,
      text: 'connect',
      vector: [],
    },
  },
];

describe('formatContext', () => {
  it('numbers each snippet and includes a path:lines header', () => {
    const ctx = formatContext(results);
    expect(ctx).toContain('[1] auth.ts:10-20');
    expect(ctx).toContain('[3] db.ts:1-5');
    expect(ctx).toContain('token logic');
  });
});

describe('uniqueSources', () => {
  it('dedupes repeated source references, preserving order', () => {
    expect(uniqueSources(results)).toEqual(['auth.ts:10-20', 'db.ts:1-5']);
  });
});

describe('buildRagMessages', () => {
  it('produces a system + user message pair with the question embedded', () => {
    const messages = buildRagMessages('how does auth work?', results);
    expect(messages).toHaveLength(2);
    expect(messages[0]?.role).toBe('system');
    expect(messages[1]?.role).toBe('user');
    expect(messages[1]?.content).toContain('how does auth work?');
    expect(messages[1]?.content).toContain('auth.ts:10-20');
  });
});
