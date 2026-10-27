// Which asset prefix a comic-audio record belongs to. Shared by the server resolvers and the comic-audio view.
export type ComicPrefix = 'sfx' | 'amb' | 'speech';

const SFX = new Set(['effect-recipe', 'sound-effect-recording']);
const AMB = new Set(['ambience-recording', 'ambient-recipe']);

/** Every comic-audio record belongs to exactly one prefix; speech takes the rest (speech-*, auditions, provider previews, evidence). */
export function comicPrefix(type: string): ComicPrefix {
  return SFX.has(type) ? 'sfx' : AMB.has(type) ? 'amb' : 'speech';
}
