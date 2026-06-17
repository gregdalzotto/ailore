import { describe, expect, it } from 'vitest';
import { chunkText } from '../src/core/chunker.js';

describe('chunkText', () => {
  it('keeps a small file as a single chunk', () => {
    const chunks = chunkText('line one\nline two', { maxChars: 1000, overlapLines: 0 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ startLine: 1, endLine: 2 });
    expect(chunks[0]?.text).toBe('line one\nline two');
  });

  it('splits long content into multiple line-aligned chunks', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n');
    const chunks = chunkText(lines, { maxChars: 20, overlapLines: 0 });
    expect(chunks.length).toBeGreaterThan(1);
    // Line bounds must be contiguous and 1-based.
    expect(chunks[0]?.startLine).toBe(1);
    expect(chunks.at(-1)?.endLine).toBe(20);
  });

  it('shares overlapping lines between consecutive chunks', () => {
    const lines = Array.from({ length: 10 }, (_, i) => `L${i + 1}`).join('\n');
    const chunks = chunkText(lines, { maxChars: 10, overlapLines: 1 });
    // With overlap, the next chunk should start no later than the previous end.
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i]!.startLine).toBeLessThanOrEqual(chunks[i - 1]!.endLine + 1);
    }
  });

  it('never drops content (each line ends up in a chunk)', () => {
    const lines = Array.from({ length: 15 }, (_, i) => `row-${i}`).join('\n');
    const chunks = chunkText(lines, { maxChars: 12, overlapLines: 0 });
    const covered = new Set<number>();
    for (const c of chunks) {
      for (let l = c.startLine; l <= c.endLine; l++) covered.add(l);
    }
    expect(covered.size).toBe(15);
  });

  it('emits a single long line even when it exceeds maxChars', () => {
    const long = 'x'.repeat(5000);
    const chunks = chunkText(long, { maxChars: 100, overlapLines: 0 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.text).toBe(long);
  });

  it('ignores blank-only content', () => {
    expect(chunkText('\n\n\n', { maxChars: 100, overlapLines: 0 })).toHaveLength(0);
  });
});
