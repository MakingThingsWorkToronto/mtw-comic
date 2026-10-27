import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Every test process writes terminal runs and usage lines into a temp state dir, never the real apps/mtw/.state.
const stateDir = mkdtempSync(path.join(tmpdir(), 'mtw-test-state-'));

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], pool: 'forks', testTimeout: 30000, hookTimeout: 30000, env: { MTW_STATE_DIR: stateDir } },
});
