// Comics module routes: read views over the derived library, direct decision writes, canonical media.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parsePrompt, renderPrompt } from '../../server/core/prompts';
import { HttpError } from '../../server/router';
import type { ServerModule, Services } from '../types';
import { comicsSummary } from './server/summary';
import { meta } from './meta';
import { serveMedia } from './server/media';
import { artStatus } from './server/artwatch';
import { CHARACTER_FIX_TEMPLATE, FIX_TEMPLATE, parseFixPresets } from './server/fixes';
import { BoxError, boxFromStory, boxSummary } from './server/box';
import { applyWordApprovals } from './server/wordApprovals';
import type { WordReview, WordRow } from './server/wordApprovals';
import { READER_SCRIPT, extractSfx } from './server/sfxSource';
import { Library, mediaUrl } from './server/library';
import { StoryArt } from './server/stories';
import type { SceneArt } from './server/stories';
import { castResolver, speechResolver, voiceResolver } from './server/resolvers';
import { EFFECT_EDITABLE } from './server/casting';
import { ComicsStore, ConflictError, InvalidError, PROFILE_FIELDS } from './server/store';
import type { ProfileField } from './server/store';
import { registerEditor } from './editor/server';
import { canonicalImage, castDetail, castSummary, effectDirections, countReviews, issueDetail, issueSummary, pagesView, soundsView, speechRows } from './server/views';
import { referenceSlot } from './server/modelVersions';
import { launchOptsFromBody } from '../../server/core/prompts';
import { readStoryline } from './server/storyline';

async function guard<T>(job: () => Promise<T>): Promise<T> {
  try {
    return await job();
  } catch (error) {
    if (error instanceof ConflictError || error instanceof InvalidError) throw new HttpError(error.status, error.message);
    throw error;
  }
}

const str = (body: unknown, name: string): string => {
  const v = (body as Record<string, unknown> | undefined)?.[name];
  if (typeof v !== 'string' || !v) throw new HttpError(400, `${name} is required`);
  return v;
};

// The library per Services, so summary() reads the same cached snapshot the module's routes use.
const libraryFor = new WeakMap<Services, Library>();

export const server: ServerModule = {
  meta,
  async summary(services) {
    const library = libraryFor.get(services);
    if (!library) return { items: [] };
    return comicsSummary(await library.snapshot(), services.repoRoot);
  },
  register(router, services) {
    const stateDir = (services as unknown as { stateDir?: string }).stateDir;
    const library = new Library(services.repoRoot, (p) => services.wiki.readJson(p), stateDir ? { stateDir } : {});
    libraryFor.set(services, library);
    const store = new ComicsStore(services.wiki, services.decisions, library);
    const stories = new StoryArt(services.repoRoot);
    const artFor = async (snap: Awaited<ReturnType<Library['snapshot']>>, ids?: string[]): Promise<Map<string, SceneArt[]>> => {
      const out = new Map<string, SceneArt[]>();
      for (const c of snap.derived.comics) {
        const src = c.textReview[0]?.storySource.path;
        if (src && (!ids || ids.includes(c.id))) out.set(c.id, await stories.scenes(src));
      }
      return out;
    };
    /** Speech rows with Matt's voiceless word approvals shown as approved (server/wordApprovals.ts). */
    const reviewRows = (snap: Awaited<ReturnType<Library['snapshot']>>, extras: Parameters<typeof speechRows>[1]) => {
      const derived = new Map<string, WordRow>(snap.derived.comics.flatMap((c) => c.textReview).map((r) => [r.id, r as unknown as WordRow]));
      return applyWordApprovals(speechRows(snap, extras), snap.approvals.textReviews as unknown as WordReview[], derived, snap.sourceNow);
    };
    services.assets.register(castResolver(library));
    services.assets.register(voiceResolver(library));
    services.assets.register(speechResolver(library));
    registerEditor(router, services);

    router.get('/issues', async () => {
      const snap = await library.snapshot();
      const references = (snap.derived.references ?? []).map((r) => ({
        recordId: r.recordId,
        kind: r.kind,
        label: r.label,
        title: r.asset?.title ?? r.label,
        status: r.asset?.status ?? null,
        present: Boolean(r.asset?.present),
        src: r.asset?.present ? (mediaUrl(canonicalImage(r.asset.path)) ?? null) : null,
      }));
      return { builtAt: snap.builtAt, warnings: snap.derived.warnings, references, issues: snap.derived.comics.map((c) => issueSummary(snap, c)) };
    });
    router.get('/issues/:id', async ({ params }) => {
      const snap = await library.snapshot();
      const c = snap.derived.comics.find((x) => x.id === params.id);
      if (!c) throw new HttpError(404, 'unknown issue');
      return issueDetail(snap, c);
    });

    router.get('/issues/:id/pages', async ({ params }) => {
      const snap = await library.snapshot();
      const c = snap.derived.comics.find((x) => x.id === params.id);
      if (!c) throw new HttpError(404, 'unknown issue');
      const art = (await artFor(snap, [c.id])).get(c.id) ?? [];
      return { id: c.id, scenes: pagesView(snap, c, art) };
    });

    // Art fix: presets from the template, the exact prompt a launch would send, and the art files to watch.
    router.get('/fix-presets', async () => ({ presets: parseFixPresets(await services.wiki.readText(FIX_TEMPLATE).catch(() => '')) }));
    router.post('/fix-preview', async ({ body }) => {
      const params = (body as { params?: Record<string, unknown> } | undefined)?.params ?? {};
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
      const parsed = parsePrompt(await services.wiki.readText('wiki/operations/prompts/comics-fix-box-art.md'), 'comics-fix-box-art');
      return { text: renderPrompt(parsed, clean, services.repoRoot) };
    });
    router.get('/issues/:id/art-status', async ({ params }) => {
      const snap = await library.snapshot();
      const c = snap.derived.comics.find((x) => x.id === params.id);
      if (!c) throw new HttpError(404, 'unknown issue');
      const src = c.textReview[0]?.storySource.path ?? null;
      return artStatus(services.repoRoot, src, src ? await stories.scenes(src) : []);
    });

    router.get('/cast', async () => {
      const snap = await library.snapshot();
      const total = countReviews(snap, snap.derived.comics.flatMap((c) => c.textReview));
      const characters = await Promise.all(
        snap.derived.characters.map(async (c) => {
          const row = castSummary(snap, snap.derived.characters, c);
          // The list shows the newest sheet in the character's reference slot, flagged when it is not registered yet.
          const newest = (await referenceSlot(services.repoRoot, c.id, c.model)).versions[0];
          return newest ? { ...row, portrait: newest.preview, slotVersion: newest.version, awaitingRegistration: !newest.registered } : row;
        }),
      );
      return { total, characters };
    });
    router.get('/cast/:id', async ({ params }) => {
      const snap = await library.snapshot();
      const c = snap.derived.characters.find((x) => x.id === params.id);
      if (!c) throw new HttpError(404, 'unknown character');
      return { ...castDetail(snap, c), slot: await referenceSlot(services.repoRoot, c.id, c.model) };
    });
    router.post('/cast/:id/shortlist', ({ params, body }) => {
      const on = (body as { on?: unknown } | undefined)?.on !== false;
      return guard(() => store.shortlist(params.id as string, str(body, 'voiceId'), on).then(() => ({ ok: true })));
    });
    router.post('/cast/:id/select', ({ params, body }) => guard(() => store.selectVoice(params.id as string, str(body, 'voiceId')).then(() => ({ ok: true }))));
    router.post('/cast/:id/change', ({ params }) => guard(() => store.changeVoice(params.id as string).then(() => ({ ok: true }))));
    router.post('/cast/:id/profile', ({ params, body }) => {
      const raw = (body as { fields?: Record<string, unknown> } | undefined)?.fields;
      if (!raw || typeof raw !== 'object') throw new HttpError(400, 'fields is required');
      const fields: Partial<Record<ProfileField, string>> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (!(PROFILE_FIELDS as readonly string[]).includes(k) || typeof v !== 'string') throw new HttpError(400, `bad field: ${k}`);
        fields[k as ProfileField] = v;
      }
      return guard(() => store.editProfile(params.id as string, fields).then(() => ({ ok: true })));
    });

    // Character chat (wiki/operations/prompts/comics-character-feedback.md): presets, and a launch that describes the character.
    const CHARACTER_FEEDBACK = 'comics-character-feedback';
    router.get('/character-fix-presets', async () => ({ presets: parseFixPresets(await services.wiki.readText(CHARACTER_FIX_TEMPLATE).catch(() => '')) }));
    router.post('/cast/:id/feedback', async ({ params, body }) => {
      const id = params.id ?? '';
      const snap = await library.snapshot();
      const c = snap.derived.characters.find((x) => x.id === id);
      if (!c) throw new HttpError(404, 'unknown character');
      const b = (body ?? {}) as { fixes?: unknown; note?: unknown; runner?: unknown };
      const lo = launchOptsFromBody(body);
      const known = new Set(parseFixPresets(await services.wiki.readText(CHARACTER_FIX_TEMPLATE).catch(() => '')).map((p) => p.id));
      const fixes = Array.isArray(b.fixes) ? [...new Set(b.fixes.filter((f): f is string => typeof f === 'string' && known.has(f)))] : [];
      const note = typeof b.note === 'string' ? b.note.replace(/\s+/g, ' ').trim().slice(0, 4000) : '';
      const runner = typeof b.runner === 'string' && FEEDBACK_RUNNERS.includes(b.runner) ? b.runner : 'claude';
      if (!fixes.length && !note) throw new HttpError(400, 'choose a common issue or write what to change');
      const subject = `cast:${id}`;
      const live = services.terminals.list().find((t) => t.operation === CHARACTER_FEEDBACK && t.subject === subject && t.status === 'running');
      if (live) throw new HttpError(409, `this character already has a running conversation (${live.id}); type into it`);
      const d = castDetail(snap, c);
      const one = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();
      const appearance = d.model ? `${d.model.recordId} (${d.model.style}, ${d.model.status ?? 'no status'})` : 'no model reference';
      const p = d.profile;
      const voice = [d.choice?.voice ? `${d.choice.voice.provider} ${d.choice.voice.name} ${d.choice.voice.voiceId}${d.choice.held ? ' (held)' : ''}` : 'no voice chosen', ...(p ? (['delivery', 'pace', 'pitch', 'accent'] as const).map((k) => `${k}: ${one(p[k]) || '-'}`) : [])].join('; ');
      const term = await services.operations.launch(CHARACTER_FEEDBACK, { subject, character: id, name: d.name, appearance, voice, fixes: fixes.join(', '), note }, runner, lo.permission, undefined, lo.choice);
      await services.decisions.append('comics-library', { actor: 'matt', module: 'comics', subject, action: 'character-feedback', value: { fixes, note, runner, terminal: term.id } });
      return term;
    });

    // Story tab (wiki/operations/prompts/comics-story-feedback.md): the raw storyline, and a chat that revises it through the
    // comic build workflow's story stage (scripts/comics/README.md). Words freeze only when Matt approves them.
    const STORY_FEEDBACK = 'comics-story-feedback';
    router.get('/story/:id', async ({ params }) => {
      const id = params.id ?? '';
      const snap = await library.snapshot();
      if (!snap.derived.comics.some((x) => x.id === id)) throw new HttpError(404, 'unknown issue');
      return readStoryline(services.repoRoot, id).catch((e: Error) => { throw new HttpError(500, e.message); });
    });
    router.post('/story/:id/feedback', async ({ params, body }) => {
      const id = params.id ?? '';
      const snap = await library.snapshot();
      const c = snap.derived.comics.find((x) => x.id === id);
      if (!c) throw new HttpError(404, 'unknown issue');
      const b = (body ?? {}) as { note?: unknown; runner?: unknown; build?: unknown };
      const lo = launchOptsFromBody(body);
      const note = typeof b.note === 'string' ? b.note.replace(/\s+/g, ' ').trim().slice(0, 8000) : '';
      if (!note) throw new HttpError(400, 'write what to change in the story');
      const runner = typeof b.runner === 'string' && FEEDBACK_RUNNERS.includes(b.runner) ? b.runner : 'claude';
      const subject = `story:${id}`;
      const live = services.terminals.list().find((t) => t.operation === STORY_FEEDBACK && t.subject === subject && t.status === 'running');
      if (live) throw new HttpError(409, `this story already has a running conversation (${live.id}); type into it`);
      const line = await readStoryline(services.repoRoot, id).catch(() => null);
      const storyline = line ? `${line.counts.scenes} scenes, ${line.counts.boxes} boxes, ${line.counts.lines} lines (${line.file} ${line.sha256.slice(0, 8)})` : 'unreadable';
      const slug = /\/comics\/([a-z0-9-]+)\//.exec(c.path ?? '')?.[1] ?? id;
      const build = typeof b.build === 'string' && /^[a-z0-9-]{4,40}$/.test(b.build) ? b.build : new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const term = await services.operations.launch(STORY_FEEDBACK, { subject, issue: id, slug, build, storyline, note }, runner, lo.permission, undefined, lo.choice);
      await services.decisions.append('comics-library', { actor: 'matt', module: 'comics', subject, action: 'story-feedback', value: { note, runner, build, terminal: term.id } });
      return term;
    });

    router.get('/effects', async () => ({ directions: effectDirections(await library.snapshot()) }));
    router.post('/effects/:id', ({ params, body }) => {
      const raw = (body as { fields?: Record<string, unknown> } | undefined)?.fields;
      if (!raw || typeof raw !== 'object') throw new HttpError(400, 'fields is required');
      const fields: Partial<Record<(typeof EFFECT_EDITABLE)[number], string>> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (!(EFFECT_EDITABLE as readonly string[]).includes(k) || typeof v !== 'string') throw new HttpError(400, `bad field: ${k}`);
        fields[k as (typeof EFFECT_EDITABLE)[number]] = v;
      }
      return guard(() => store.editEffectDirection(params.id as string, fields).then(() => ({ ok: true })));
    });

    router.get('/speech', async ({ query }) => {
      const snap = await library.snapshot();
      const issue = query.get('issue');
      const state = query.get('state');
      const character = query.get('character');
      const [art, decided] = await Promise.all([artFor(snap, issue ? [issue] : undefined), store.decidedTexts()]);
      const rows = reviewRows(snap, { art, decided }).filter((r) => (!issue || r.storyId === issue) && (!state || r.state === state) && (!character || r.characterId === character));
      return { builtAt: snap.builtAt, counts: countReviews(snap, snap.derived.comics.filter((c) => !issue || c.id === issue).flatMap((c) => c.textReview)), rows };
    });
    router.post('/speech/:id/review', ({ params, body }) => {
      const action = str(body, 'action');
      if (action !== 'approve' && action !== 'reject' && action !== 'revoke') throw new HttpError(400, 'action must be approve, reject or revoke');
      return guard(() => store.reviewSpeech(params.id as string, action));
    });

    // One box as the reader plays it, with the feedback conversation beside it (wiki/operations/prompts/comics-box-feedback.md).
    const FEEDBACK = 'comics-box-feedback';
    const FEEDBACK_RUNNERS = ['claude', 'codex'];
    const boxSubject = (story: string, scene: string, img: string): string => `box:${story}/${scene}/${img}`;
    const loadBox = async (story: string, scene: string, img: string) => {
      if (!/^[a-z0-9-]+$/.test(story)) throw new HttpError(400, 'bad story id');
      let text: string;
      try {
        text = await fs.readFile(path.join(services.repoRoot, 'site', 'src', 'data', 'comic-stories', `${story}.ts`), 'utf8');
      } catch {
        throw new HttpError(404, 'unknown issue');
      }
      try {
        return boxFromStory(text, story, scene, img);
      } catch (error) {
        if (error instanceof BoxError) throw new HttpError(error.status, error.message);
        throw error;
      }
    };
    const boxContext = async (story: string, scene: string, img: string) => {
      const box = await loadBox(story, scene, img);
      const snap = await library.snapshot();
      const [art, decided] = await Promise.all([artFor(snap, [story]), store.decidedTexts()]);
      const sceneArt = art.get(story)?.find((x) => x.id === scene);
      const panelArt = sceneArt?.panels.find((p) => p.img === img);
      const rows = reviewRows(snap, { art, decided }).filter((r) => r.storyId === story && r.sceneId === scene && r.panelId === img);
      return { box, sceneArt, panelArt, rows };
    };
    router.get('/box/:story/:scene/:img', async ({ params }) => {
      const { story = '', scene = '', img = '' } = params as Record<string, string | undefined>;
      const { box, sceneArt, panelArt, rows } = await boxContext(story, scene, img);
      const subject = boxSubject(story, scene, img);
      const ids = new Set([subject, ...box.balloons.map((b) => b.id)]);
      const history = (await services.decisions.list('comics-library')).filter((d) => ids.has(d.subject)).slice(-40).reverse();
      const run = services.terminals.list().find((t) => t.operation === FEEDBACK && t.subject === subject) ?? null;
      return {
        box,
        subject,
        art: { src: sceneArt?.full ?? null, rect: panelArt?.crop ?? null, art: sceneArt?.art ?? null },
        speech: Object.fromEntries(rows.map((r) => [r.id, { state: r.state, voice: r.voice, audio: r.audio?.preview ?? null, durationSeconds: r.audio?.durationSeconds ?? null }])),
        history,
        run,
      };
    });
    router.post('/box/:story/:scene/:img/feedback', async ({ params, body }) => {
      const { story = '', scene = '', img = '' } = params as Record<string, string | undefined>;
      const b = (body ?? {}) as { fixes?: unknown; note?: unknown; runner?: unknown };
      const lo = launchOptsFromBody(body);
      const known = new Set(parseFixPresets(await services.wiki.readText(FIX_TEMPLATE).catch(() => '')).map((p) => p.id));
      const fixes = Array.isArray(b.fixes) ? [...new Set(b.fixes.filter((f): f is string => typeof f === 'string' && known.has(f)))] : [];
      const note = typeof b.note === 'string' ? b.note.replace(/\s+/g, ' ').trim().slice(0, 4000) : '';
      const runner = typeof b.runner === 'string' && FEEDBACK_RUNNERS.includes(b.runner) ? b.runner : 'claude';
      if (!fixes.length && !note) throw new HttpError(400, 'choose a common issue or write what to change');
      const subject = boxSubject(story, scene, img);
      const live = services.terminals.list().find((t) => t.operation === FEEDBACK && t.subject === subject && t.status === 'running');
      if (live) throw new HttpError(409, `this box already has a running conversation (${live.id}); type into it`);
      const { box, sceneArt, panelArt } = await boxContext(story, scene, img);
      const summary = boxSummary(box);
      const region = panelArt?.crop ? `[${panelArt.crop.map((n) => Math.round(n * 10000) / 10000).join(', ')}]` : 'none';
      const term = await services.operations.launch(
        FEEDBACK,
        { subject, issue: story, scene, panel: img, art: `${sceneArt?.art ?? 'none'} | ${img} ar=${region}`, balloons: summary.balloons, sound: summary.sound, fixes: fixes.join(', '), note },
        runner,
        lo.permission,
        undefined,
        lo.choice,
      );
      await services.decisions.append('comics-library', { actor: 'matt', module: 'comics', subject, action: 'box-feedback', value: { fixes, note, runner, terminal: term.id } });
      return term;
    });

    router.get('/sfx-synth', async () => {
      const found = extractSfx(await fs.readFile(path.join(services.repoRoot, ...READER_SCRIPT.split('/')), 'utf8').catch(() => ''));
      if (!found) throw new HttpError(503, `the effect synthesis in ${READER_SCRIPT} could not be located`);
      return found;
    });

    router.get('/sounds', async () => soundsView(await library.snapshot()));

    // Previews and page art: the core's range-aware media service, limited to the allowed folders.
    router.get('/media', ({ query, headers }) => serveMedia(services.media, services.repoRoot, query.get('path') ?? '', headers));
  },
};
