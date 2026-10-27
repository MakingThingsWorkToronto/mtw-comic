// Load the comic runtime (site/public/scripts/comic-story.js) into a vm context for offline checks, without running its
// startup code. Every top-level function declaration of the runtime's IIFE (two-space indent) is taken whole and
// compiled together, so a check never slices the runtime by text markers and a newly called helper cannot break it.
// Used by the comic regressions and comic-story-phone-check.mjs (skill: mtw-comic-story, references/checks.md).
import fs from 'node:fs';
import vm from 'node:vm';

export const defaultRuntime = new URL('../../public/scripts/comic-story.js', import.meta.url);

/** Every top-level runtime function as name -> source. Each runs to its closing `  }` or to the next top-level line;
 * compiling all of them together proves none was cut short (a misread throws here, loudly). */
export function runtimeFunctions(source, filename = 'comic-story.js') {
  const lines = source.replaceAll('\r\n', '\n').split('\n'), out = new Map();
  for (let i = 0; i < lines.length; i++) {
    const name = /^  function ([\w$]+)\(/.exec(lines[i])?.[1];
    if (!name) continue;
    let j = i + 1;
    while (j < lines.length && !/^ {0,2}\S/.test(lines[j])) j++;
    out.set(name, lines.slice(i, /^  \}/.test(lines[j] || '') ? j + 1 : j).join('\n'));
  }
  if (!out.size) throw new Error(`${filename}: no top-level runtime functions found`);
  new vm.Script([...out.values()].join('\n'), {filename});
  return out;
}

/** Read the runtime file. */
export function readRuntime(file = defaultRuntime) {
  return fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
}

/**
 * Define every runtime function in `context` (a plain object or an existing vm context). Values the fixture already
 * put on the context win over runtime functions of the same name, so a fixture stubs exactly what it means to
 * (a player clock, a DOM factory) and takes everything else from the real runtime. Returns the context.
 */
export function loadRuntimeFunctions(context, source, {filename} = {}) {
  const ctx = vm.isContext(context) ? context : vm.createContext(context);
  const stubs = Object.fromEntries(Object.keys(ctx).map(key => [key, ctx[key]]));
  vm.runInContext([...runtimeFunctions(source, filename).values()].join('\n'), ctx, {filename});
  Object.assign(ctx, stubs);
  return ctx;
}

/** The runtime's own top-level one-line statements (state `var`s, listener registrations) that mention a name matched
 * by `pattern`, in source order, so a fixture runs the real initialisation of one subsystem instead of a copy.
 * Throws when none match or when a match is the start of a multi-line statement. */
export function topLevelStatements(source, pattern, filename = 'comic-story.js') {
  const lines = source.replaceAll('\r\n', '\n').split('\n').filter(line => /^  \S/.test(line) && !/^  (function |\}|\/\/|\/\*)/.test(line) && pattern.test(line));
  if (!lines.length) throw new Error(`${filename}: no top-level statements match ${pattern}`);
  for (const line of lines) new vm.Script(line, {filename});
  return lines.join('\n');
}

/** A block of runtime statements between two exact marker comments (for top-level listeners and state that a
 * function load does not run). Throws when either marker is missing. */
export function markedBlock(source, start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  if (a < 0 || b <= a) throw new Error(`runtime block ${start} ... ${end} is missing`);
  return source.slice(a, b);
}
