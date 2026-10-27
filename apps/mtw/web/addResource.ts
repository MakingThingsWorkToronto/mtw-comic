// Add forms (Matt, 2026-10-11: "we need to improve adding resources accross the board"). Every library's Add button
// opens the same structured form and launches one procedure in an Operations terminal. New resources go through the
// shared `operations-add-resource` procedure, whose body is identical for every kind (the cached prefix); per-kind
// detail lives in wiki/operations/templates/add-resource-kinds.md. Where an existing procedure already fits (images
// already saved: images-register; downloaded music: soundtrack-intake) the form launches that one instead.
// Pure logic only: the form is web/ui/ResourceForm.tsx.

/** The one shared procedure (wiki/operations/prompts/operations-add-resource.md). */
export const ADD_OPERATION = 'operations-add-resource';

export type AddKind = 'image' | 'track' | 'journal-candidate' | 'character';
export const ADD_KINDS: readonly AddKind[] = ['image', 'track', 'journal-candidate', 'character'];

/**
 * Where a field's value goes. For the shared procedure: `name`, `brief`, `sources`, or `detail` (rendered as
 * `Label: value` in the one `details` parameter). For another procedure: `param`, the procedure's own parameter.
 */
export type AddTarget = 'name' | 'brief' | 'sources' | 'detail' | 'param';

export interface AddField {
  name: string;
  label: string;
  control: 'text' | 'textarea' | 'select';
  target: AddTarget;
  /** Parameter name when `target` is `param` (defaults to the field name). */
  param?: string;
  options?: readonly string[];
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** Pre-filled value. */
  initial?: string;
  maxLength?: number;
  /** Each line (or "; " item) must satisfy this; the message names the rule. */
  item?: { test: (item: string) => boolean; message: string };
}

export interface AddMode {
  id: string;
  label: string;
  /** One sentence under the mode choice: what this run will do. */
  summary: string;
  operation: string;
  /** True when the run may spend money (generation). The form says so; the procedure still asks before any spend. */
  paid?: boolean;
  fields: readonly AddField[];
}

export interface AddSpec {
  kind: AddKind;
  /** Button label, e.g. "Add image". */
  button: string;
  title: string;
  /** Studio module the result appears in. */
  module: string;
  modes: readonly AddMode[];
}

export const NAME_MAX = 120;
export const BRIEF_MAX = 800;
export const LINE_MAX = 300;

export const IMAGE_COLLECTIONS = ['diagrams', 'icons', 'originals', 'scenes', 'comics', 'earlier'] as const;
export const IMAGE_STYLES = ['holographic', 'photorealistic', 'svg-glass', 'svg-flat', 'svg-outline', 'comic-ink'] as const;
export const JOURNAL_CATEGORIES = ['Agentic Systems', 'Data & Migrations', 'Traditional Systems'] as const;
export const CHARACTER_ROLES = ['hero', 'mentor', 'operator', 'antagonist', 'villain', 'background'] as const;

const imageAsset = {
  test: (p: string) => /^wiki\/image-library\/assets\/[^\0]+\.[a-z0-9]+$/i.test(p.replace(/\\/g, '/')) && !p.replace(/\\/g, '/').split('/').includes('..'),
  message: 'Each file must be a repo path under wiki/image-library/assets/ with an extension.',
};
const sourceItem = {
  test: (s: string) => s.length <= LINE_MAX,
  message: `Each source must be ${LINE_MAX} characters or fewer.`,
};

const nameField = (label: string, placeholder: string, required = true): AddField => ({ name: 'name', label, control: 'text', target: 'name', required, maxLength: NAME_MAX, placeholder });
const briefField = (label: string, hint: string): AddField => ({ name: 'brief', label, control: 'textarea', target: 'brief', required: true, maxLength: BRIEF_MAX, hint });
const sourcesField = (label: string, hint: string): AddField => ({ name: 'sources', label, control: 'textarea', target: 'sources', hint, item: sourceItem });
const detail = (name: string, label: string, extra: Partial<AddField> = {}): AddField => ({ name, label, control: 'text', target: 'detail', maxLength: LINE_MAX, ...extra });

export const ADD_SPECS: Record<AddKind, AddSpec> = {
  image: {
    kind: 'image',
    button: 'Add image',
    title: 'Add an image',
    module: 'images',
    modes: [
      {
        id: 'generate',
        label: 'Make a new image',
        summary: 'Codex generates the options through the Codex CLI; each lands as an unreviewed version for you to judge.',
        operation: ADD_OPERATION,
        paid: true,
        fields: [
          nameField('Working title', 'e.g. Operator desk at night'),
          briefField('What it shows and what it is for', 'The scene or diagram, the page or section it serves, and anything it must avoid.'),
          detail('collection', 'Collection', { control: 'select', options: IMAGE_COLLECTIONS, required: true }),
          detail('style', 'Style', { control: 'select', options: IMAGE_STYLES, required: true }),
          detail('options', 'Options', { control: 'select', options: ['1', '2', '3', '4'], initial: '2', required: true, hint: 'How many alternatives to generate.' }),
          detail('use', 'Use', { placeholder: 'e.g. /services hero, Home scene 4' }),
          sourcesField('References', 'img: refs, repo paths or links to start from or match, one per line.'),
        ],
      },
      {
        id: 'register',
        label: 'Register files already saved',
        summary: 'Registers files already under wiki/image-library/assets/ through the library producer (images-register). Nothing is generated.',
        operation: 'images-register',
        fields: [
          { name: 'paths', label: 'Files', control: 'textarea', target: 'param', required: true, item: imageAsset, hint: 'Repo paths under wiki/image-library/assets/, one per line.' },
          { name: 'record', label: 'Existing record id', control: 'text', target: 'param', maxLength: NAME_MAX, hint: 'Needed for a diagram or icon version.' },
          { name: 'style', label: 'Style', control: 'text', target: 'param', maxLength: NAME_MAX },
          { name: 'collection', label: 'Collection', control: 'select', target: 'param', options: IMAGE_COLLECTIONS },
          { name: 'note', label: 'Note', control: 'text', target: 'param', maxLength: LINE_MAX },
        ],
      },
    ],
  },
  track: {
    kind: 'track',
    button: 'Add track',
    title: 'Add music',
    module: 'soundtrack',
    modes: [
      {
        id: 'find',
        label: 'Find on Pixabay',
        summary: 'Finds candidates on Pixabay Music in a real browser tab with their exact credit, profiles them and lists them for your review.',
        operation: ADD_OPERATION,
        fields: [
          nameField('What to look for', 'e.g. Slow synth build for the Home hero'),
          briefField('Where it will be used and why', 'The page, hero, Beat Comic or comic issue, and what the music has to do there.'),
          detail('mood', 'Mood', { placeholder: 'e.g. calm, building, warm' }),
          detail('length', 'Length', { placeholder: 'e.g. about 2:30' }),
          detail('options', 'Options', { control: 'select', options: ['1', '2', '3', '4', '5'], initial: '3', required: true, hint: 'How many candidates to bring back.' }),
          sourcesField('Starting points', 'A Pixabay track link, an snd: ref to find music like, or an artist, one per line.'),
        ],
      },
      {
        id: 'downloads',
        label: 'Take in downloaded files',
        summary: 'Takes files you downloaded into the library with their exact credit (soundtrack-intake).',
        operation: 'soundtrack-intake',
        fields: [{ name: 'files', label: 'Files', control: 'textarea', target: 'param', required: true, initial: 'all new in Downloads', item: sourceItem, hint: 'File names in Downloads, one per line, or "all new in Downloads".' }],
      },
    ],
  },
  'journal-candidate': {
    kind: 'journal-candidate',
    button: 'Add candidate',
    title: 'Add a Journal candidate',
    module: 'journal',
    modes: [
      {
        id: 'candidate',
        label: 'New candidate',
        summary: 'Writes your idea as a new concept in a dated proposals file, scored against the nine candidate checks. Nothing is queued or approved.',
        operation: ADD_OPERATION,
        fields: [
          nameField('Working headline', 'e.g. Measuring agents can slow their work'),
          briefField('What happened and what it argues', 'The event, your decision or mistake, and the point a business leader should take from it.'),
          detail('category', 'Category', { control: 'select', options: JOURNAL_CATEGORIES, required: true }),
          detail('event', 'Dated event', { placeholder: 'e.g. 2026-10-09 the tour timing check failed' }),
          detail('counter', 'Counter-position', { placeholder: 'The outside view it argues with, if known' }),
          sourcesField('Evidence', 'Commits, session notes, records or links, one per line.'),
        ],
      },
    ],
  },
  character: {
    kind: 'character',
    button: 'Add character',
    title: 'Add a comic character',
    module: 'comics',
    modes: [
      {
        id: 'character',
        label: 'New character',
        summary: 'Proposes the character and its model sheet; Codex generates the sheet only after your yes, and the voice is cast separately.',
        operation: ADD_OPERATION,
        paid: true,
        fields: [
          nameField('Name', 'Leave empty for three hockey-name proposals', false),
          briefField('Who they are and what they do in the story', 'Their job in the issue, what they want, and how they meet the cast.'),
          detail('role', 'Role', { control: 'select', options: CHARACTER_ROLES, required: true }),
          detail('issue', 'Issue', { placeholder: 'e.g. home, agentic-systems' }),
          detail('look', 'Look', { placeholder: 'Signature appearance' }),
          detail('voice', 'Voice', { placeholder: 'Delivery direction' }),
          sourcesField('References', 'img: refs or notes for the look, one per line.'),
        ],
      },
    ],
  },
};

/** Collapse any whitespace, including new lines, into single spaces. */
export const oneLine = (value: string): string => value.replace(/\s+/g, ' ').trim();

/** Split a multi-line or "; "-separated list into trimmed one-line items. */
export const listItems = (value: string): string[] =>
  value
    .split(/\r?\n|;\s*/)
    .map(oneLine)
    .filter(Boolean);

export function modeOf(kind: AddKind, modeId?: string): AddMode {
  const spec = ADD_SPECS[kind];
  return spec.modes.find((m) => m.id === modeId) ?? (spec.modes[0] as AddMode);
}

/** Initial values for a mode's fields. */
export function initialValues(mode: AddMode): Record<string, string> {
  return Object.fromEntries(mode.fields.map((f) => [f.name, f.initial ?? '']));
}

/** Field errors, keyed by field name; empty when the form can launch. `options` overrides a select's choices. */
export function validateAdd(mode: AddMode, values: Record<string, string>, options: Partial<Record<string, readonly string[]>> = {}): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of mode.fields) {
    const raw = values[f.name] ?? '';
    const multi = f.control === 'textarea' && (f.target === 'sources' || f.target === 'param');
    const value = multi ? raw.trim() : oneLine(raw);
    if (!value) {
      if (f.required) errors[f.name] = `${f.label} is required.`;
      continue;
    }
    const choices = options[f.name] ?? f.options;
    if (f.control === 'select' && choices && !choices.includes(value)) {
      errors[f.name] = `${f.label} must be one of ${choices.join(', ')}.`;
      continue;
    }
    if (f.maxLength && oneLine(raw).length > f.maxLength) {
      errors[f.name] = `${f.label} must be ${f.maxLength} characters or fewer.`;
      continue;
    }
    if (f.item) {
      const bad = listItems(raw).find((i) => !f.item?.test(i));
      if (bad !== undefined) errors[f.name] = `${f.item.message} Not valid: ${bad.length > 60 ? `${bad.slice(0, 57)}...` : bad}`;
    }
  }
  return errors;
}

/** Lower-case slug for a subject: letters and digits joined by single hyphens, at most 48 characters. */
export function slug(value: string): string {
  return oneLine(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '');
}

/** How an add run is found again in the terminals list: `add:<kind>:<slug of the name, else the brief>`. */
export function addSubject(kind: AddKind, name: string, brief: string): string {
  return `add:${kind}:${slug(name) || slug(brief) || 'untitled'}`;
}

export interface AddLaunch {
  operation: string;
  params: Record<string, string>;
}

/**
 * The procedure and its parameters. Every value is one compact line, so the rendered "## This run" section stays short
 * and the procedure body before it stays byte-identical. Call validateAdd first; this throws on invalid input.
 */
export function buildAddLaunch(kind: AddKind, modeId: string | undefined, values: Record<string, string>, options: Partial<Record<string, readonly string[]>> = {}): AddLaunch {
  const mode = modeOf(kind, modeId);
  const errors = validateAdd(mode, values, options);
  const first = Object.values(errors)[0];
  if (first) throw new Error(first);
  const params: Record<string, string> = {};
  const get = (f: AddField): string => {
    const raw = values[f.name] ?? '';
    return f.control === 'textarea' && (f.target === 'sources' || f.target === 'param') ? listItems(raw).join('; ') : oneLine(raw);
  };
  if (mode.operation !== ADD_OPERATION) {
    for (const f of mode.fields) {
      const v = get(f);
      if (v) params[f.param ?? f.name] = v;
    }
    return { operation: mode.operation, params };
  }
  const details: string[] = [];
  for (const f of mode.fields) {
    const v = get(f);
    if (!v) continue;
    if (f.target === 'detail') details.push(`${f.label}: ${v}`);
    else if (f.target === 'name' || f.target === 'brief' || f.target === 'sources') params[f.target] = v;
  }
  params.kind = kind;
  if (details.length) params.details = details.join('; ');
  params.subject = addSubject(kind, params.name ?? '', params.brief ?? '');
  return { operation: ADD_OPERATION, params };
}
