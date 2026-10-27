// New. `integrationSrc`: where the website consumes a canonical image, computed and existence-checked (migration spec
// section 5). Never recorded in the manifest. Read-only: it reports copies, it does not create them.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const COMIC_PAGE = /^assets\/scenes\/comic-b\/pages\/(.+?)(?:-v\d+)?\.[a-z0-9]+$/i;
const JOURNAL = /^assets\/scenes\/journal\/(.+?)(?:-v\d+)?\.[a-z0-9]+$/i;
const COMIC_WIDTHS = [1600]; // copies stop at the master's width (Matt, 2026-10-11): no 2400/3200 upscales

export class Integration {
  private stories: { name: string; text: string }[] | null = null;
  private storiesSig = '';

  constructor(private repoRoot: string) {}

  private site(...parts: string[]): string {
    return path.join(this.repoRoot, 'site', ...parts);
  }

  private loadStories(): { name: string; text: string }[] {
    const dir = this.site('src', 'data', 'comic-stories');
    if (!existsSync(dir)) return [];
    const sig = String(statSync(dir).mtimeMs);
    if (this.stories && sig === this.storiesSig) return this.stories;
    this.storiesSig = sig;
    this.stories = readdirSync(dir)
      .filter((n) => n.endsWith('.ts'))
      .map((n) => ({ name: n.slice(0, -3), text: readFileSync(path.join(dir, n), 'utf8') }));
    return this.stories;
  }

  /** Story whose data mentions the stem; stems can carry extra suffixes, so shorten until a story matches. */
  storyFor(stem: string): { story: string; stem: string } | null {
    const stories = this.loadStories();
    let candidate = stem;
    while (candidate) {
      const hit = stories.find((s) => s.text.includes(candidate));
      if (hit) return { story: hit.name, stem };
      const cut = candidate.lastIndexOf('-');
      if (cut <= 0) return null;
      candidate = candidate.slice(0, cut);
    }
    return null;
  }

  /**
   * First existing website copy for a canonical file, as a site URL (public assets) or a repo-relative path (build inputs).
   * Diagrams: site/public/images/<style>/<id>.svg, else site/src/assets/image-sources/<style>/<id>.<ext>.
   */
  integrationSrc(record: { id: string; logicalId?: string | null; collection: string }, style: string, libraryPath: string): string | undefined {
    const comic = COMIC_PAGE.exec(libraryPath);
    if (comic) {
      const hit = this.storyFor(comic[1] as string);
      if (!hit) return undefined;
      for (const w of COMIC_WIDTHS) {
        const file = `${hit.stem}-${w}.avif`;
        if (existsSync(this.site('public', 'comic', hit.story, file))) return `/comic/${hit.story}/${file}`;
      }
      return undefined;
    }
    const journal = JOURNAL.exec(libraryPath);
    if (journal) {
      const id = journal[1] as string;
      const dir = this.site('public', 'images', '_optimized', 'journal');
      if (existsSync(dir)) {
        const found = readdirSync(dir).find((n) => n.startsWith(`${id}-`) && n.endsWith('.avif'));
        if (found) return `/images/_optimized/journal/${found}`;
      }
      const source = `site/src/assets/image-sources/journal/${id}.png`;
      return existsSync(path.join(this.repoRoot, source)) ? source : undefined;
    }
    if (record.collection === 'diagrams' && record.logicalId) {
      const ext = path.extname(libraryPath).toLowerCase();
      if (ext === '.svg' && existsSync(this.site('public', 'images', style, `${record.logicalId}.svg`))) return `/images/${style}/${record.logicalId}.svg`;
      const dir = this.site('src', 'assets', 'image-sources', style);
      for (const e of ['.svg', '.png', '.jpg']) {
        if (existsSync(path.join(dir, `${record.logicalId}${e}`))) return `site/src/assets/image-sources/${style}/${record.logicalId}${e}`;
      }
    }
    return undefined;
  }
}
