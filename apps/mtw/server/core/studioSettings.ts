// Studio settings (config/studio.json, edited at Operations > Defaults): the provider Studio's pickers start on, and the
// model and effort each provider's terminals launch with. Read on every spawn, so a change applies to the next terminal.
import { existsSync, readFileSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const runnerDefaults = z.object({
  /** Passed through the runner's modelArgs; empty leaves the CLI's own default. */
  model: z.string().trim().max(120).regex(/^[\w.:\-[\]/]*$/, 'model ids use letters, digits and . : - [ ] /').default(''),
  /** One of the runner's efforts; empty leaves the CLI's own default. */
  effort: z.string().trim().max(40).regex(/^[\w-]*$/).default(''),
});
export const studioSettingsSchema = z.object({
  about: z.string().optional(),
  defaultRunner: z.string().min(1).default('claude'),
  runners: z.record(runnerDefaults).default({}),
});
export type StudioSettings = z.infer<typeof studioSettingsSchema>;
export type RunnerDefaults = z.infer<typeof runnerDefaults>;

export const settingsFile = (repoRoot: string): string => path.join(repoRoot, 'config', 'studio.json');

export function loadStudioSettings(repoRoot: string): StudioSettings {
  const file = settingsFile(repoRoot);
  if (!existsSync(file)) return studioSettingsSchema.parse({});
  return studioSettingsSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
}

export async function saveStudioSettings(repoRoot: string, next: unknown): Promise<StudioSettings> {
  const parsed = studioSettingsSchema.parse(next);
  const file = settingsFile(repoRoot);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const text = `${JSON.stringify(parsed, null, 2)}\n`;
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, text, 'utf8');
  await fs.rename(tmp, file);
  return parsed;
}
