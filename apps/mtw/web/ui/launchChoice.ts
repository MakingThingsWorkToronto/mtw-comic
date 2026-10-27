import type { OperationDef } from '../../modules/types';
import type { RunnerOption } from '../api';

/** Pure helpers for the launch confirm control (no DOM or router imports, so tests can load them). */
/**
 * The choice the confirm control holds: provider, model, effort (reasoning) and permission.
 * An empty model/effort means "no entry": the launcher then falls back to Operations > Defaults.
 */
export interface LaunchChoice {
  runner: string;
  model: string;
  effort: string;
  permission: string;
}

export const noBypass = (id: string): boolean => !/bypass|dangerous/i.test(id);

/** The model/effort a provider starts from: the procedure's entry, else nothing (the studio default applies). */
export function defaultsFor(def: OperationDef | undefined, runner: string): { model: string; effort: string } {
  const m = def?.models?.find((x) => x.runner === runner);
  return { model: m?.model ?? '', effort: m?.effort ?? '' };
}

function modelLabel(r: RunnerOption | undefined, id: string): string {
  return r?.models?.find((m) => m.id === id)?.label ?? id;
}

/** Plain-English one-liner for the dialog, e.g. "Runs in a new terminal with Claude Sonnet 5.5 at medium effort." */
export function launchSummary(choice: LaunchChoice, runners: RunnerOption[]): string {
  const r = runners.find((x) => x.id === choice.runner);
  const who = r?.label ?? choice.runner;
  const model = choice.model ? `${who} ${modelLabel(r, choice.model)}` : `${who} (its saved default model)`;
  const effort = choice.effort ? ` at ${choice.effort} effort` : '';
  const perm = r?.permissions.find((p) => p.id === choice.permission)?.label;
  return `Runs in a new terminal with ${model}${effort}${perm ? `; ${perm.toLowerCase()}` : ''}.`;
}

