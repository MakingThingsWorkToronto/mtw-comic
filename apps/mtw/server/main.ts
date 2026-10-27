import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startApp } from './app';

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const appRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = process.env.MTW_REPO_ROOT ?? path.resolve(appRoot, '..', '..');
const port = Number(argValue('--port') ?? process.env.MTW_PORT ?? 8788);
const dev = process.argv.includes('--dev');

const app = await startApp({ repoRoot, appRoot, port, dev });
console.log(`MTW Studio${dev ? ' (dev)' : ''}: ${app.url}`);

let closing = false;
const shutdown = async (): Promise<void> => {
  if (closing) return;
  closing = true;
  await app.close();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
