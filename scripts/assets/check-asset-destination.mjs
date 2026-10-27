import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const canonicalHomes = Object.freeze({
  image: 'wiki/image-library',
  journal: 'wiki/journal',
  audio: 'wiki/soundtrack-library',
  comic: 'wiki/comics-library',
});
export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

// Resolve existing ancestors so a future file cannot escape through a junction.
function physicalPath(candidate) {
  let ancestor = candidate;
  const missing = [];
  for (;;) {
    try {
      fs.lstatSync(ancestor);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(ancestor);
      if (parent === ancestor) throw error;
      missing.unshift(path.basename(ancestor));
      ancestor = parent;
      continue;
    }
    // Existing broken symlinks fail here instead of being treated as missing.
    return path.resolve(fs.realpathSync.native(ancestor), ...missing);
  }
}

export function checkAssetDestination(kind, destination, root = repoRoot) {
  if (!Object.hasOwn(canonicalHomes, kind)) throw new Error(`Unknown asset kind: ${kind}`);
  if (typeof destination !== 'string' || !destination.trim()) throw new Error('An exact destination is required');
  const actualRoot = fs.realpathSync.native(root);
  const home = path.join(actualRoot, canonicalHomes[kind]);
  const actualHome = fs.realpathSync.native(home);
  if (path.relative(home, actualHome) !== '') {
    // A workstation may keep its full native libraries outside the small source
    // checkout. Only an explicitly configured exact home permits that redirect;
    // arbitrary directory links inside a home remain rejected below.
    const configPath = path.join(actualRoot, '.mtw-local-media.json');
    let declared;
    try { declared = JSON.parse(fs.readFileSync(configPath, 'utf8')).homes?.[kind]; }
    catch { /* no explicit local storage mapping */ }
    if (typeof declared !== 'string' || !path.isAbsolute(declared) || path.relative(fs.realpathSync.native(declared), actualHome) !== '') {
      throw new Error(`Canonical home is redirected without an exact local storage mapping: ${home}`);
    }
  }
  const output = path.resolve(actualRoot, destination);
  if (!inside(home, output)) throw new Error(`Destination must be a file inside ${canonicalHomes[kind]}/: ${destination}`);
  if (process.platform === 'win32' && path.relative(home, output).includes(':')) throw new Error('Alternate data streams are not asset destinations');
  if (!inside(actualHome, physicalPath(output))) throw new Error(`Destination escapes through a linked directory: ${destination}`);
  try { if (fs.statSync(output).isDirectory()) throw new Error('Choose an exact file, not a directory'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 4) throw new Error('Usage: node scripts/assets/check-asset-destination.mjs <image|journal|audio|comic> <path>');
    process.stdout.write(`PASS ${checkAssetDestination(process.argv[2], process.argv[3])}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${error.message}\n`);
    process.exitCode = 1;
  }
}
