/**
 * Normalize write-hook payloads without giving either runtime its own policy copy.
 *
 * Claude Code sends Write/Edit fields (`file_path`, `content`, `new_string`). Codex exposes its
 * `apply_patch` input as `tool_input.command`. Consumers receive the path and only the text the
 * tool proposes to add; policy stays in check-layering.mjs, which imports this file.
 */

const PATCH_BEGIN = '*** Begin Patch';
const PATCH_END = '*** End Patch';
const FILE_HEADER = /^\*\*\* (Add|Update|Delete) File: (.+)$/;
const MOVE_TO = /^\*\*\* Move to: (.+)$/;

function legacySurface(toolInput) {
  const text = [toolInput.content, toolInput.new_string]
    .filter((value) => typeof value === 'string' && value.length > 0)
    .join('\n');
  if (!text) return null;
  return { path: String(toolInput.file_path ?? ''), text };
}

/** Parse the documented apply_patch envelope into its per-file added text. */
export function parseApplyPatch(command) {
  const lines = String(command ?? '').replace(/\r\n/g, '\n').split('\n');
  if (lines[0] !== PATCH_BEGIN || lines.at(-1) !== PATCH_END) {
    return { surfaces: [], error: 'the apply_patch envelope is incomplete' };
  }

  const surfaces = [];
  let current = null;
  let sawFile = false;

  const finish = () => {
    if (!current) return;
    if (current.operation !== 'Delete') {
      surfaces.push({ path: current.path, text: current.added.join('\n') });
    }
    current = null;
  };

  for (const line of lines.slice(1, -1)) {
    const header = line.match(FILE_HEADER);
    if (header) {
      finish();
      sawFile = true;
      current = { operation: header[1], path: header[2], added: [] };
      continue;
    }
    const move = line.match(MOVE_TO);
    if (move && current?.operation === 'Update') {
      current.path = move[1];
      continue;
    }
    if (line === '*** End of File') continue;
    if (line.startsWith('*** ')) {
      return { surfaces: [], error: `unsupported apply_patch directive: ${line}` };
    }
    if (current && current.operation !== 'Delete' && line.startsWith('+')) {
      current.added.push(line.slice(1));
    }
  }
  finish();

  if (!sawFile) return { surfaces: [], error: 'the apply_patch payload names no files' };
  return { surfaces, error: null };
}

/**
 * Return `{ surfaces, error }`. An `error` means the payload claimed to be apply_patch but could
 * not be measured; an unrelated/non-writing payload is a deliberate empty surface set.
 */
export function writeSurfaces(payload) {
  const toolInput = payload?.tool_input ?? {};
  const legacy = legacySurface(toolInput);
  if (legacy) return { surfaces: [legacy], error: null };

  const toolName = String(payload?.tool_name ?? '');
  const command = typeof toolInput.command === 'string' ? toolInput.command : '';
  const looksLikePatch = command.startsWith(PATCH_BEGIN);
  if (toolName === 'apply_patch' || looksLikePatch) return parseApplyPatch(command);
  return { surfaces: [], error: null };
}
