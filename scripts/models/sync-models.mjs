#!/usr/bin/env node
// config/models.json: every provider's models and effort levels, rebuilt from the model lists each CLI keeps on this
// machine, so a model a CLI starts offering appears in Studio (Operations > Defaults) without an edit.
//   Codex: ~/.codex/models_cache.json (refreshed by Codex itself)
//   Grok:  ~/.grok/models_cache.json (refreshed by the Grok CLI)
//   Claude: model ids Claude Code has offered, as recorded in ~/.claude.json (it keeps no full list)
// Reads model names and effort levels only; sign-in fields in those files are never read out or written.
// Usage: node scripts/models/sync-models.mjs [--check]   (--check: exit 1 if the file is out of date, write nothing)
import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MODELS_FILE = path.join(ROOT, 'config', 'models.json');

const readJson = (file) => {
  try {
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  } catch {
    return null;
  }
};

/** Codex: slug, display name, listed or hidden, effort levels with the default. */
export function codexModels(cache) {
  if (!cache || !Array.isArray(cache.models)) return null;
  const models = cache.models
    .filter((m) => typeof m.slug === 'string')
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
    .map((m) => ({
      id: m.slug,
      label: String(m.display_name || m.slug),
      efforts: (m.supported_reasoning_levels || []).map((l) => String(l.effort)).filter(Boolean),
      ...(m.default_reasoning_level ? { defaultEffort: String(m.default_reasoning_level) } : {}),
      ...(m.visibility && m.visibility !== 'list' ? { hidden: true } : {}),
    }));
  return { source: '~/.codex/models_cache.json', fetchedAt: cache.fetched_at ?? null, models };
}

/** Grok: models keyed by id; only `info` (name, hidden, efforts) is read, never the per-model key fields. */
export function grokModels(cache) {
  if (!cache || !cache.models || typeof cache.models !== 'object') return null;
  const models = Object.entries(cache.models).map(([id, v]) => {
    const info = (v && v.info) || {};
    const efforts = (info.reasoning_efforts || []).map((e) => String(e.value || e.id)).filter(Boolean);
    const def = (info.reasoning_efforts || []).find((e) => e.default);
    return {
      id: String(info.model || info.id || id),
      label: String(info.name || id),
      efforts,
      ...(def ? { defaultEffort: String(def.value || def.id) } : {}),
      ...(info.hidden ? { hidden: true } : {}),
    };
  });
  return { source: '~/.grok/models_cache.json', fetchedAt: cache.fetched_at ?? null, models };
}

const CLAUDE_FAMILIES = ['opus', 'sonnet', 'haiku', 'fable'];
const CLAUDE_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max']; // `claude --help`, --effort

/** Claude: ids Claude Code recorded (no dated snapshots, no [1m] variants); newest version per family listed first. */
export function claudeModels(text) {
  if (typeof text !== 'string') return null;
  const ids = new Set();
  for (const m of text.matchAll(/claude-(opus|sonnet|haiku|fable)-(\d+)(?:-(\d+))?(?![\d-]*\d{8})(?=[^\w-]|\[)/g)) ids.add(`claude-${m[1]}-${m[2]}${m[3] ? `-${m[3]}` : ''}`);
  const version = (id) => id.split('-').slice(2).map(Number);
  const newer = (a, b) => {
    const [x, y] = [version(a), version(b)];
    return (y[0] - x[0]) || ((y[1] ?? 0) - (x[1] ?? 0));
  };
  const models = [];
  for (const fam of CLAUDE_FAMILIES) {
    const list = [...ids].filter((id) => id.startsWith(`claude-${fam}-`)).sort(newer);
    list.forEach((id, i) => {
      const v = version(id);
      models.push({ id, label: `${fam[0].toUpperCase()}${fam.slice(1)} ${v[0]}${v[1] !== undefined ? `.${v[1]}` : ''}`, efforts: CLAUDE_EFFORTS, ...(i > 0 ? { hidden: true } : {}) });
    });
  }
  return { source: '~/.claude.json (ids Claude Code has offered)', fetchedAt: null, models };
}

export function buildCatalog(home = os.homedir()) {
  const providers = {};
  const claudeText = (() => {
    try {
      return readFileSync(path.join(home, '.claude.json'), 'utf8');
    } catch {
      return null;
    }
  })();
  const claude = claudeModels(claudeText);
  if (claude?.models.length) providers.claude = { runner: 'claude', label: 'Claude', ...claude };
  const codex = codexModels(readJson(path.join(home, '.codex', 'models_cache.json')));
  if (codex?.models.length) providers.codex = { runner: 'codex', label: 'Codex', ...codex };
  const grok = grokModels(readJson(path.join(home, '.grok', 'models_cache.json')));
  if (grok?.models.length) providers.grok = { runner: null, label: 'Grok', ...grok };
  return providers;
}

/** Rewrites config/models.json when a provider's list changed; returns true when it wrote. */
export function syncModels({ home = os.homedir(), file = MODELS_FILE, check = false } = {}) {
  const providers = buildCatalog(home);
  const prev = readJson(file);
  // An empty read (a CLI missing on this machine) keeps that provider's last known list rather than dropping it.
  for (const [id, p] of Object.entries(prev?.providers || {})) if (!providers[id]) providers[id] = p;
  if (prev && JSON.stringify(prev.providers) === JSON.stringify(providers)) return false;
  if (check) return true;
  const next = { about: 'Generated by scripts/models/sync-models.mjs from each CLI\'s own model list; Studio refreshes it. Do not edit by hand.', updatedAt: new Date().toISOString(), providers };
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  renameSync(tmp, file);
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const changed = syncModels({ check });
  console.log(check ? (changed ? 'config/models.json is out of date' : 'config/models.json is current') : changed ? 'config/models.json updated' : 'config/models.json unchanged');
  process.exitCode = check && changed ? 1 : 0;
}
