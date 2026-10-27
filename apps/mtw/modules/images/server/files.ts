// Replaces direct relative <img src> / "Open original" links of retired git 51eb6e03:wiki/image-library/browser.js (L99-105, L136-139):
// originals are streamed by the server after the canonical destination check, never by directory listing.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

type Checker = (kind: string, destination: string, root?: string) => string;
let checker: Promise<Checker> | undefined;
const requireNative = createRequire(import.meta.url);

/**
 * scripts/assets/check-asset-destination.mjs (the canonical-home rule). It is untyped, dependency-free ESM without top-level
 * await, so Node's require(esm) loads it in the app, under tsx and under vitest alike.
 */
export function loadChecker(): Promise<Checker> {
  checker ??= Promise.resolve(
    (requireNative(fileURLToPath(new URL('../../../../../scripts/assets/check-asset-destination.mjs', import.meta.url))) as { checkAssetDestination: Checker }).checkAssetDestination,
  );
  return checker;
}

export class PathError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

/** Library-relative form of a path the caller supplied (repo-relative, library-relative or absolute). */
export function toLibraryRelative(repoRoot: string, input: string): string {
  const norm = input.replace(/\\/g, '/');
  const lib = 'wiki/image-library/';
  const abs = path.isAbsolute(input) || /^[A-Za-z]:/.test(norm);
  if (abs) {
    const rel = path.relative(path.join(repoRoot, 'wiki', 'image-library'), path.resolve(input)).replace(/\\/g, '/');
    if (rel.startsWith('..') || path.isAbsolute(rel)) throw new PathError(`Not inside wiki/image-library: ${input}`);
    return rel;
  }
  return norm.startsWith(lib) ? norm.slice(lib.length) : norm.replace(/^\.\//, '');
}

/**
 * Confine a library path for reading or registering: no traversal, drive, stream or encoded tricks, the
 * canonical-home check from scripts/assets/check-asset-destination.mjs, and a real path inside assets/ or records/.
 * Returns the absolute path and the library-relative POSIX path.
 */
export async function confineLibraryPath(repoRoot: string, input: string, areas: ('assets' | 'records')[] = ['assets', 'records']): Promise<{ abs: string; rel: string }> {
  if (typeof input !== 'string' || !input.trim() || input.includes('\0')) throw new PathError('A path is required');
  const rel = toLibraryRelative(repoRoot, input);
  const parts = rel.split('/');
  if (!rel || rel.includes(':') || rel.includes('%') || parts.some((p) => !p || p === '.' || p === '..') || !areas.includes(parts[0] as 'assets')) {
    throw new PathError(`Path must be a file under ${areas.map((a) => `wiki/image-library/${a}/`).join(' or ')}: ${input}`);
  }
  const check = await loadChecker();
  let abs: string;
  try {
    abs = check('image', `wiki/image-library/${rel}`, repoRoot);
  } catch (error) {
    throw new PathError((error as Error).message);
  }
  let real: string;
  try {
    real = await fs.realpath(abs);
  } catch {
    return { abs, rel }; // not on disk yet (a registration target); the destination check already passed
  }
  const home = await fs.realpath(path.join(repoRoot, 'wiki', 'image-library'));
  const inside = path.relative(path.join(home, parts[0] as string), real);
  if (inside.startsWith('..') || path.isAbsolute(inside)) throw new PathError(`Path escapes the library through a link: ${input}`);
  return { abs: real, rel };
}

/** Confine and require an existing regular file. */
export async function readableFile(repoRoot: string, input: string): Promise<{ abs: string; rel: string; size: number }> {
  const { abs, rel } = await confineLibraryPath(repoRoot, input);
  let st;
  try {
    st = await fs.stat(abs);
  } catch {
    throw new PathError(`Not found: ${rel}`, 404);
  }
  if (!st.isFile()) throw new PathError(`Not a file: ${rel}`, 404);
  return { abs, rel, size: st.size };
}
