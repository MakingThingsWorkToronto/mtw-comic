import { useEffect, useState } from 'preact/hooks';
import { LaunchPicker, launchBody } from './LaunchConfirm';
import type { LaunchArgs } from './LaunchConfirm';

/** One LLM step a human is about to start: shown with its procedure's defaults preselected. */
export interface StepToConfirm {
  /** The key the choice is sent under (a workflow node id, or a schedule step index). */
  key: string;
  /** The procedure the step launches; its frontmatter `models:` supplies the preselected provider, model and effort. */
  operation: string;
  /** What the human sees, e.g. the workflow step's label. */
  label: string;
  /** Start on this provider instead of the procedure's own (a step that names its provider). */
  runner?: string;
  /** Start on this permission (a schedule's own setting); defaults to "default". */
  permission?: string;
}

/** The request body for the choices: `{ [key]: { runner, permission, model, effort } }`. */
export type StepChoicesBody = Record<string, ReturnType<typeof launchBody>>;

/**
 * The confirm for a launch that starts several procedures (a workflow run, a schedule's chain): one provider / model /
 * effort / permission picker per step, each preselected from that step's procedure. Reports null until every picker has
 * loaded, so the caller keeps its button disabled and nothing launches on a guess.
 */
export function StepChoices({ steps, onChange }: { steps: StepToConfirm[]; onChange: (choices: StepChoicesBody | null) => void }) {
  const [byKey, setByKey] = useState<Record<string, LaunchArgs | null>>({});
  const all = steps.every((s) => byKey[s.key]);
  const signature = JSON.stringify(steps.map((s) => [s.key, byKey[s.key] ?? null]));
  useEffect(() => {
    onChange(all ? Object.fromEntries(steps.map((s) => [s.key, launchBody(byKey[s.key])])) : null);
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!steps.length) return null;
  return (
    <div class="stack" data-testid="step-choices">
      {steps.map((s, i) => (
        <fieldset key={s.key} class="step-choice" style={{ border: '1px solid var(--border, #444)', borderRadius: 'var(--radius, 6px)', padding: 'var(--space-3, 12px)' }}>
          <legend>{`Step ${i + 1}: ${s.label}`}</legend>
          <LaunchPicker
            operation={s.operation}
            {...(s.runner ? { forceRunner: s.runner } : {})}
            {...(s.permission && s.permission !== 'default' ? { initial: { permission: s.permission } } : {})}
            idPrefix={`step-${i}`}
            onChoice={(args) => setByKey((prev) => (JSON.stringify(prev[s.key] ?? null) === JSON.stringify(args) ? prev : { ...prev, [s.key]: args }))}
          />
        </fieldset>
      ))}
    </div>
  );
}
