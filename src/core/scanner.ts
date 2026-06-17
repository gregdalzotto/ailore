import { readFile, stat } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { globby } from 'globby';

/** A text file that is eligible for indexing. */
export interface ScannedFile {
  /** Path relative to the scanned root (stable across machines). */
  relPath: string;
  absPath: string;
  content: string;
}

export interface ScanOptions {
  /** Glob patterns to include. When omitted, all non-ignored files are scanned. */
  include?: string[];
  /** Extra glob patterns to exclude (added to the built-in defaults). */
  exclude?: string[];
  /** Files larger than this (bytes) are skipped. */
  maxFileSizeBytes: number;
}

/** Directories and files that are never useful to index. */
const DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/.ailore/**',
  '**/*.min.js',
  '**/*.lock',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
];

/** Extensions that are almost certainly binary and not worth reading. */
const BINARY_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'ico',
  'bmp',
  'tiff',
  'pdf',
  'zip',
  'gz',
  'tar',
  'rar',
  '7z',
  'mp3',
  'mp4',
  'mov',
  'avi',
  'wav',
  'flac',
  'woff',
  'woff2',
  'ttf',
  'eot',
  'otf',
  'wasm',
  'exe',
  'dll',
  'so',
  'dylib',
  'bin',
  'class',
  'jar',
  'pyc',
  'o',
  'a',
]);

function hasBinaryExtension(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return BINARY_EXTENSIONS.has(ext);
}

/** Heuristic: a NUL char (code point 0) in the head of the file implies binary. */
function looksBinary(content: string): boolean {
  const sample = content.slice(0, 4096);
  for (let i = 0; i < sample.length; i++) {
    if (sample.charCodeAt(i) === 0) return true;
  }
  return false;
}

/**
 * Walks `root`, honouring `.gitignore`, the built-in excludes, and the
 * provided include/exclude globs. Returns only readable UTF-8 text files within
 * the size limit. Binary and oversized files are skipped silently.
 */
export async function scanFiles(root: string, options: ScanOptions): Promise<ScannedFile[]> {
  const absRoot = resolve(root);
  const patterns = options.include ?? ['**/*'];

  const paths = await globby(patterns, {
    cwd: absRoot,
    gitignore: true,
    dot: false,
    onlyFiles: true,
    absolute: true,
    ignore: [...DEFAULT_EXCLUDE, ...(options.exclude ?? [])],
  });

  const files: ScannedFile[] = [];
  for (const absPath of paths) {
    if (hasBinaryExtension(absPath)) continue;
    try {
      const info = await stat(absPath);
      if (info.size > options.maxFileSizeBytes) continue;
      const content = await readFile(absPath, 'utf-8');
      if (looksBinary(content)) continue;
      files.push({ relPath: relative(absRoot, absPath), absPath, content });
    } catch {
      // Unreadable file (permissions, race with deletion) — skip it.
    }
  }
  return files;
}
