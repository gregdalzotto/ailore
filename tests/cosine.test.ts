import { describe, expect, it } from 'vitest';
import { cosineSimilarity, topKIndices } from '../src/core/cosine.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1);
  });

  it('returns 0 when a vector is all zeros', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it('throws on length mismatch', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(/length mismatch/i);
  });
});

describe('topKIndices', () => {
  it('returns indices of the highest scores, descending', () => {
    expect(topKIndices([0.1, 0.9, 0.5, 0.3], 2)).toEqual([1, 2]);
  });

  it('handles k larger than the array', () => {
    expect(topKIndices([0.2, 0.8], 5)).toEqual([1, 0]);
  });
});
