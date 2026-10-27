// Launch MTW Studio (apps/mtw) from the repo root.
//   node scripts/studio/start-studio.mjs            dev server (hot reload) on port 8788; a busy port is an error, never a move to another port
//   node scripts/studio/start-studio.mjs --build    install if needed, then build the web bundle and type-check
//   node scripts/studio/start-studio.mjs --built    serve the built bundle (builds it first when missing)
//   --port N   port (default 8788; `npm run all` passes 8788 too). MTW uses only 8787 (website) and 8788 (Studio).
// Also started by `npm run all` as a child; it then stops on the parent's 'stop' message or disconnect.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const app = path.join(root, 'apps', 'mtw');
const args = process.argv.slice(2);
const mode = args.includes('--build') ? 'build' : args.includes('--built') ? 'built' : 'dev';
const portArg = args.indexOf('--port');
const preferred = portArg >= 0 ? Number(args[portArg + 1]) : 8788;

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { cwd: root, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`Studio: "${command} ${commandArgs.join(' ')}" failed (exit ${result.status}).`);
    process.exit(result.status || 1);
  }
}

function canListen(port) {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once('error', () => resolve(false));
    probe.listen(port, '127.0.0.1', () => probe.close(() => resolve(true)));
  });
}

// First run from a clean checkout: install once. Later runs skip this.
if (!existsSync(path.join(app, 'node_modules'))) {
  console.log('Studio: first run, installing apps/mtw dependencies (npm install --prefix apps/mtw). This takes a minute.');
  run('npm', ['install', '--prefix', 'apps/mtw']);
}

if (mode === 'build') {
  console.log('Studio: building web bundle and type-checking (npm run build --prefix apps/mtw).');
  run('npm', ['run', 'build', '--prefix', 'apps/mtw']);
  console.log('Studio: built. Start it with: npm run studio:start');
  process.exit(0);
}
if (mode === 'built' && !existsSync(path.join(app, 'dist', 'web', 'index.html'))) {
  console.log('Studio: no built bundle yet, building it first.');
  run('npm', ['run', 'build', '--prefix', 'apps/mtw']);
}

const port = preferred;
if (!(await canListen(port))) {
  console.error(`Studio: port ${port} is already in use. MTW uses only 8787 (website) and 8788 (Studio). If Studio is already running, use http://127.0.0.1:${port}/; otherwise stop the process holding it (netstat -ano | findstr :${port}) and start again.`);
  process.exit(1);
}
const serverArgs = ['--import', 'tsx', 'server/main.ts', '--port', String(port), ...(mode === 'dev' ? ['--dev'] : [])];
const child = spawn(process.execPath, serverArgs, { cwd: app, stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true });
console.log(`Studio (${mode === 'dev' ? 'dev, hot reload' : 'built'}): http://127.0.0.1:${port}/  Ctrl+C stops it.`);

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  child.kill('SIGINT');
  setTimeout(() => { child.kill(); process.exit(0); }, 5000).unref();
}
child.once('exit', (code) => {
  if (!stopping) console.error(`Studio exited (code ${code}).`);
  process.exit(stopping ? 0 : code || 1);
});
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('message', (message) => { if (message === 'stop') stop(); });
process.on('disconnect', stop);
