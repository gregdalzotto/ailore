import { describe, expect, it } from 'vitest';
import { Bm25Index, reciprocalRankFusion, tokenize } from '../src/core/bm25.js';

describe('tokenize', () => {
  it('lowercases and splits on non-alphanumeric runs', () => {
    expect(tokenize('Hello, world!')).toEqual(['hello', 'world']);
  });

  it('keeps the compound token and its camelCase parts', () => {
    expect(tokenize('parseConfigFile')).toEqual(['parseconfigfile', 'parse', 'config', 'file']);
  });

  it('splits snake_case and letter/digit boundaries', () => {
    expect(tokenize('top_k v2')).toEqual(['top', 'k', 'v2', 'v', '2']);
  });

  it('returns nothing for empty or symbol-only input', () => {
    expect(tokenize('   ---  ')).toEqual([]);
  });
});

describe('Bm25Index', () => {
  const docs = [
    { id: 'a', text: 'the indexer skips unchanged files using a content hash' },
    { id: 'b', text: 'cosine similarity ranks vectors for semantic search' },
    { id: 'c', text: 'incremental indexing re-embeds only changed files' },
  ];

  it('ranks the document containing the query terms first', () => {
    const hits = Bm25Index.build(docs).search('content hash');
    expect(hits[0]?.id).toBe('a');
  });

  it('matches camelCase identifiers via their sub-words', () => {
    const index = Bm25Index.build([
      { id: 'x', text: 'function buildIndex(root) {}' },
      { id: 'y', text: 'function search(query) {}' },
    ]);
    expect(index.search('build index')[0]?.id).toBe('x');
  });

  it('returns no hits when nothing matches', () => {
    expect(Bm25Index.build(docs).search('nonexistent term')).toEqual([]);
  });

  it('handles an empty corpus', () => {
    expect(Bm25Index.build([]).search('anything')).toEqual([]);
  });
});

describe('reciprocalRankFusion', () => {
  it('rewards ids ranked highly by multiple rankers', () => {
    const vector = ['x', 'a', 'b'];
    const lexical = ['x', 'c', 'd'];
    // 'x' is first in both lists, so it must win the fused ranking outright.
    expect(reciprocalRankFusion([vector, lexical])[0]).toBe('x');
  });

  it('merges ids that appear in only one ranking', () => {
    const fused = reciprocalRankFusion([['a'], ['b']]);
    expect(fused.sort()).toEqual(['a', 'b']);
  });

  it('returns an empty list when given no rankings', () => {
    expect(reciprocalRankFusion([])).toEqual([]);
  });
});
