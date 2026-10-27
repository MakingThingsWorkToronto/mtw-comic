import path from 'node:path';
import type { Services } from '../../modules/types';
import { Assets } from './assets';
import { FileDecisionLog } from './decisions';
import type { IntakeService } from './intake';
import { Events } from './events';
import { FileLeases } from './leases';
import { media } from './media';
import { PromptOperations } from './prompts';
import { loadRunners } from './runners';
import { loadStudioSettings } from './studioSettings';
import { TerminalService } from './terminals';
import { FileWikiStore } from './wiki-store';

export interface Core extends Services {
  wiki: FileWikiStore;
  decisions: FileDecisionLog;
  events: Events;
  terminals: TerminalService;
  operations: PromptOperations;
  assets: Assets;
  leases: FileLeases;
  /** Auto-intake (server/core/intake.ts); set by startApp once the modules are registered. */
  intake?: IntakeService;
  /** Where runs, receipts and intake state live (apps/mtw/.state, or MTW_STATE_DIR in tests). */
  stateDir?: string;
}

export function createCore(repoRoot: string, appRoot: string): Core {
  const events = new Events();
  const leases = new FileLeases(repoRoot);
  const wiki = new FileWikiStore(repoRoot, leases);
  // Tests set MTW_STATE_DIR (vitest.config.ts) so they never write runs or usage lines into the real .state.
  const stateDir = process.env.MTW_STATE_DIR || path.join(appRoot, '.state');
  const terminals = new TerminalService({
    repoRoot,
    stateDir,
    // Re-read per spawn so an edited runners.json applies to the next terminal.
    runners: () => loadRunners(repoRoot),
    settings: () => loadStudioSettings(repoRoot),
    events,
    otelForwardUrl: process.env.MTW_OTEL_FORWARD || undefined,
  });
  return {
    repoRoot,
    wiki,
    decisions: new FileDecisionLog(wiki),
    events,
    terminals,
    operations: new PromptOperations(repoRoot, terminals),
    assets: new Assets(),
    leases,
    media,
    stateDir,
  };
}
