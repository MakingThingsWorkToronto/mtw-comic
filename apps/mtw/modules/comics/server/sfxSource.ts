// The reader's own effect synthesis, lifted from site/public/scripts/comic-story.js at request time so Studio plays exactly
// what the comic plays (no second copy to drift). Pure text slicing; nothing from the site is executed on the server.
export const READER_SCRIPT = 'site/public/scripts/comic-story.js';

export interface SfxSource {
  /** Function body taking `ctx` (an AudioContext) and returning the FX map `{ kind: (t, gainNode) => void }`. */
  source: string;
  kinds: string[];
}

/** Pure: the noise/filter/oscillator/envelope helpers and the `var FX = {...};` block, wrapped to return FX. Null when the markers moved. */
export function extractSfx(reader: string): SfxSource | null {
  const h0 = reader.indexOf('function noiseBuf(kind)');
  const envAt = reader.indexOf('function env(g, t, a, peak, dcy)', h0);
  const h1 = envAt < 0 ? -1 : reader.indexOf('\n', envAt);
  const f0 = reader.indexOf('var FX = {', h1);
  const f1 = f0 < 0 ? -1 : reader.indexOf('\n    };', f0);
  if (h0 < 0 || h1 < 0 || f0 < 0 || f1 < 0) return null;
  const helpers = reader.slice(h0, h1);
  const fx = reader.slice(f0, f1 + '\n    };'.length);
  if (!/function src\(/.test(helpers) || !/function gainNode\(/.test(helpers)) return null;
  const kinds = [...fx.matchAll(/^\s{6}([a-z]+): function \(t, g\)/gm)].map((m) => m[1] as string);
  return { source: `${helpers}\n${fx}\nreturn FX;`, kinds };
}
