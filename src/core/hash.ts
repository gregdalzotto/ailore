import { createHash } from 'node:crypto';

/** Short content hash used to detect whether a file changed since last index. */
export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}
