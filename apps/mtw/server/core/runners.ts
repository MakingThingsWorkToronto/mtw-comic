import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const permission = z.object({ id: z.string(), label: z.string(), args: z.array(z.string()) });
const runnerSchema = z.object({
  label: z.string(),
  /** A bare name resolved on PATH, or a per-platform map with a `default`. */
  executable: z.union([z.string(), z.record(z.string())]),
  args: z.array(z.string()).default([]),
  /** Whether the rendered prompt is passed as the final positional argument. */
  acceptsPrompt: z.boolean().default(true),
  permissions: z.array(permission).default([]),
  /** Where token numbers come from. 'otel' = the built-in OTLP receiver; the others parse the CLI's own transcript. */
  tokenSource: z.enum(['otel', 'claude-transcript', 'codex-rollout', 'none']).default('none'),
  /** Used when the primary source has produced nothing (e.g. otel never arrived). */
  tokenFallback: z.enum(['claude-transcript', 'codex-rollout', 'none']).default('none'),
  /** 'arg-file-line': prompt.md is written and one self-contained line naming it is the last argv. */
  promptHandover: z.enum(['arg-file-line', 'none']).optional(),
  /** Extra argv chosen by MTW, e.g. ["--session-id", "{sessionId}"]; placed before the prompt line. */
  sessionIdArgs: z.array(z.string()).default([]),
  /** Argv that reopens a saved conversation by its provider session id, e.g. ["--resume", "{sessionId}"]; empty = not resumable. */
  resumeArgs: z.array(z.string()).default([]),
  /** Argv that sets the model ({model}) and the effort ({effort}); applied from config/studio.json when set there. */
  modelArgs: z.array(z.string()).default([]),
  effortArgs: z.array(z.string()).default([]),
  /** The models and effort levels Operations > Defaults offers (a model id not listed can still be typed). */
  models: z.array(z.object({ id: z.string(), label: z.string() })).default([]),
  efforts: z.array(z.string()).default([]),
  /** Environment injected into the spawned terminal. Placeholders: {terminalId} {operation} {module} {sessionId} {port}. */
  env: z.record(z.string()).default({}),
  /** 'untested' rows are listed but cannot be launched until proven (document the proof in the wiki). */
  status: z.enum(['proven', 'untested']).default('proven'),
  /** Free-text comment (JSON has none): why a row is untested, what must be proven. */
  note: z.string().optional(),
});
export const runnersSchema = z.record(runnerSchema);
export type RunnerConfig = z.infer<typeof runnerSchema>;
export type RunnersConfig = z.infer<typeof runnersSchema>;

export function loadRunners(repoRoot: string): RunnersConfig {
  const file = path.join(repoRoot, 'wiki', 'operations', 'runners.json');
  return runnersSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
}

/**
 * Refuse a model that runners.json lists under a different provider (for example a Claude model sent to Codex).
 * A model id the file does not list at all stays allowed: typed ids are allowed.
 */
export function assertModelFitsRunner(runners: RunnersConfig, runner: string, model: string | undefined): void {
  const id = (model ?? '').trim();
  if (!id) return;
  const own = runners[runner];
  if (!own || own.models.some((m) => m.id === id)) return;
  const other = Object.entries(runners).find(([key, r]) => key !== runner && r.models.some((m) => m.id === id));
  if (other) throw new Error(`${id} is a ${other[1].label} model and cannot run in ${own.label}. Choose one of ${own.label}'s models, or change the provider.`);
}

export function promptHandoverOf(runner: RunnerConfig): 'arg-file-line' | 'none' {
  return runner.promptHandover ?? (runner.acceptsPrompt ? 'arg-file-line' : 'none');
}

/** Replace {placeholders}; unknown ones become empty. OTel resource attribute values may not hold , = or spaces. */
export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_m, key: string) => vars[key] ?? '');
}
export function attrSafe(value: string): string {
  return value.replace(/[^A-Za-z0-9_.:-]/g, '_');
}

export function executableFor(runner: RunnerConfig, platform: NodeJS.Platform = process.platform): string {
  if (typeof runner.executable === 'string') return runner.executable;
  const exe = runner.executable[platform] ?? runner.executable.default;
  if (!exe) throw new Error(`runner has no executable for ${platform}`);
  return exe;
}
