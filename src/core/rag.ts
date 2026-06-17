import type { ChatMessage } from '../providers/types.js';
import type { SearchResult } from './store.js';

const SYSTEM_PROMPT = [
  'You are a precise assistant that answers questions about a codebase or set of',
  'documents using ONLY the provided context snippets.',
  '',
  'Rules:',
  '- Base every statement strictly on the context. Never invent files, APIs or facts.',
  '- Cite the source of each claim inline using the format [path:startLine-endLine],',
  '  copying the citation exactly as it appears in the context header.',
  '- If the context does not contain the answer, say so plainly instead of guessing.',
  '- Be concise and concrete. Prefer short paragraphs and code references.',
].join('\n');

/** Renders retrieved chunks into a numbered, citable context block. */
export function formatContext(results: SearchResult[]): string {
  return results
    .map((result, i) => {
      const { file, startLine, endLine, text } = result.chunk;
      const header = `[${i + 1}] ${file}:${startLine}-${endLine}`;
      return `${header}\n${text}`;
    })
    .join('\n\n---\n\n');
}

/** Builds the chat messages for a grounded answer. */
export function buildRagMessages(question: string, results: SearchResult[]): ChatMessage[] {
  const context = formatContext(results);
  const user = [
    'Context snippets:',
    '',
    context,
    '',
    '---',
    '',
    `Question: ${question}`,
    '',
    'Answer using only the context above, with inline [path:lines] citations.',
  ].join('\n');

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ];
}

/** The distinct source files referenced by a set of results, in rank order. */
export function uniqueSources(results: SearchResult[]): string[] {
  const seen = new Set<string>();
  const sources: string[] = [];
  for (const { chunk } of results) {
    const ref = `${chunk.file}:${chunk.startLine}-${chunk.endLine}`;
    if (!seen.has(ref)) {
      seen.add(ref);
      sources.push(ref);
    }
  }
  return sources;
}
