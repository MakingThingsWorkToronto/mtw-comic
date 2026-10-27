// Read the existing local ComicStory exactly as comic-story-check.mjs does.
// No browser, build, media generation or network. Imported repository modules
// are trusted authoring sources; this is a coverage check, not a sandbox.
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

registerHooks({ resolve(spec, ctx, next) {
  try { return next(spec, ctx); }
  catch (e) {
    if (/^\.\.?\//.test(spec) && !/\.[a-z]+$/i.test(spec)) return next(spec + '.ts', ctx);
    throw e;
  }
} });
const [source, sceneId] = process.argv.slice(2);
if (!source || !sceneId) throw new Error('Exact story source and sceneId required');
const mod = await import(pathToFileURL(resolve(source)).href);
const stories = Object.values(mod).filter(v => v && typeof v === 'object' && Array.isArray(v.scenes));
if (stories.length !== 1) throw new Error('Expected exactly one exported ComicStory');
const story = stories[0];
const scenes = story.scenes.filter(scene => scene.id === sceneId);
if (scenes.length !== 1 || !Array.isArray(scenes[0].panels) || !scenes[0].panels.length)
  throw new Error('Missing, duplicate or empty story scene');
// Retained demo boxes have no img/id. Their actual renderer identity is the
// scene plus zero-based data-box index; bind that exact source anchor instead
// of inventing a convenient subset or requiring a runtime/source rewrite.
const panels = scenes[0].panels.map((panel, index) => panel.img ?? panel.id ?? `${sceneId}:box-${index}`);
if (panels.some(id => typeof id !== 'string' || !id.trim()) || new Set(panels).size !== panels.length)
  throw new Error('Missing or duplicate actual story panel IDs');
console.log(JSON.stringify({storyId: story.id, sceneId, panels}));
