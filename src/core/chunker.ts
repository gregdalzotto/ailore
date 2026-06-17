/** A contiguous slice of a file, with 1-based inclusive line bounds. */
export interface Chunk {
  startLine: number;
  endLine: number;
  text: string;
}

export interface ChunkOptions {
  /** Soft upper bound on chunk size, measured in characters. */
  maxChars: number;
  /** How many trailing lines to repeat at the start of the next chunk. */
  overlapLines: number;
}

/**
 * Splits text into line-aligned chunks. Chunking on line boundaries (rather
 * than arbitrary character offsets) is what lets every retrieved chunk carry an
 * accurate `path:startLine-endLine` citation back to the source.
 *
 * A small line overlap keeps context that straddles a chunk boundary
 * retrievable from either side.
 */
export function chunkText(content: string, options: ChunkOptions): Chunk[] {
  const { maxChars, overlapLines } = options;
  const lines = content.split('\n');
  const chunks: Chunk[] = [];

  let startIdx = 0;
  while (startIdx < lines.length) {
    let endIdx = startIdx;
    let size = 0;

    // Grow the chunk until adding another line would exceed maxChars.
    // Always include at least one line so a single long line still emits.
    while (endIdx < lines.length) {
      const lineLen = (lines[endIdx] as string).length + 1; // +1 for the newline
      if (size + lineLen > maxChars && endIdx > startIdx) break;
      size += lineLen;
      endIdx++;
    }

    const text = lines.slice(startIdx, endIdx).join('\n').trim();
    if (text.length > 0) {
      chunks.push({ startLine: startIdx + 1, endLine: endIdx, text });
    }

    if (endIdx >= lines.length) break;
    // Step forward, rewinding by the overlap so context is shared.
    startIdx = Math.max(endIdx - overlapLines, startIdx + 1);
  }

  return chunks;
}
