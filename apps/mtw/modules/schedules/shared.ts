// Pure helpers shared by the Schedules server and client (no node imports, so the web bundle can use it).
import type { ChainStep, Schedule } from './lib/store';

/** The ordered steps a run executes: the chain when present, else the single operation. */
export function stepsOf(s: Pick<Schedule, 'operation' | 'chain'>): ChainStep[] {
  return s.chain && s.chain.length ? (s.chain as ChainStep[]) : [{ operation: s.operation }];
}
