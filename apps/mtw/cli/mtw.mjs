#!/usr/bin/env node
// Launcher so `node apps/mtw/cli/mtw.mjs <command>` works without a build or a global tsx. With the package "bin"
// entry installed it is simply `mtw <command>`.
import { register } from 'tsx/esm/api';

register();
await import('./mtw.ts');
