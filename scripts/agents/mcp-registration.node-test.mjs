// mcp-registration.node-test.mjs — the two MCP registrations agree with each other and with the launcher.
//
//   .mcp.json           canonical server definitions (Claude Code reads it; relative args resolve from the project root)
//   .codex/config.toml  one [mcp_servers."<name>"] table per .mcp.json server, each a bootstrap that resolves
//                       the Git root and hands the name to scripts/agents/codex-mcp-launcher.mjs
//
// Run: node --test scripts/agents/mcp-registration.node-test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { McpLaunchRefusal, serverDefinition } from './codex-mcp-launcher.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const MCP_JSON = join(ROOT, '.mcp.json');
const CODEX_TOML = join(ROOT, '.codex', 'config.toml');

function mcpServers() {
  return JSON.parse(readFileSync(MCP_JSON, 'utf8')).mcpServers ?? {};
}

/** The [mcp_servers."name"] tables of the TOML, each with its `command` and parsed `args` array. */
function codexServers() {
  const text = readFileSync(CODEX_TOML, 'utf8');
  const tables = new Map();
  const re = /^\[mcp_servers\."([^"]+)"\]\s*$/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const body = text.slice(m.index + m[0].length, text.indexOf('\n[', m.index + m[0].length) === -1 ? undefined : text.indexOf('\n[', m.index + m[0].length));
    const command = /^command\s*=\s*"([^"]*)"/m.exec(body)?.[1] ?? null;
    const argsSrc = /^args\s*=\s*(\[[\s\S]*?\])\s*$/m.exec(body)?.[1] ?? null;
    // TOML basic-string arrays of plain strings are JSON-compatible for the escapes this file uses.
    const args = argsSrc ? JSON.parse(argsSrc) : null;
    tables.set(m[1], { command, args });
  }
  return tables;
}

test('.mcp.json server names equal the .codex/config.toml [mcp_servers] tables', () => {
  const claude = Object.keys(mcpServers()).sort();
  const codex = [...codexServers().keys()].sort();
  assert.ok(claude.length > 0, '.mcp.json registers at least one server');
  assert.deepEqual(codex, claude);
});

test('each .mcp.json server runs an entry file that exists, with node, from the project root', () => {
  for (const [name, cfg] of Object.entries(mcpServers())) {
    assert.equal(cfg.command, 'node', `${name}: command`);
    assert.ok(Array.isArray(cfg.args) && cfg.args.length > 0, `${name}: args`);
    assert.ok(existsSync(join(ROOT, cfg.args[0])), `${name}: args[0] "${cfg.args[0]}" does not exist under the repo root`);
  }
  const wiki = mcpServers()['wiki-mcp'];
  assert.deepEqual(wiki.args, ['apps/wiki-mcp/wiki-mcp.mjs', '--root', '.']);
});

test('the Codex bootstrap for each server resolves the Git root, imports the launcher, and passes its own name', () => {
  for (const [name, table] of codexServers()) {
    assert.equal(table.command, 'node', `${name}: command`);
    assert.ok(Array.isArray(table.args) && table.args.length === 3, `${name}: args is [-e, <bootstrap>, <name>]`);
    assert.equal(table.args[0], '-e');
    assert.match(table.args[1], /rev-parse','--show-toplevel'/);
    assert.match(table.args[1], /scripts\/agents\/codex-mcp-launcher\.mjs/);
    assert.match(table.args[1], /launchMcp\(process\.argv\[1\],\{root\}\)/);
    assert.equal(table.args[2], name, `${name}: the bootstrap's last argument is the server name`);
  }
});

test('serverDefinition(root, name) returns the canonical .mcp.json definition and refuses an unknown name', () => {
  for (const [name, cfg] of Object.entries(mcpServers())) assert.deepEqual(serverDefinition(ROOT, name), cfg);
  assert.throws(() => serverDefinition(ROOT, 'no-such-server'), McpLaunchRefusal);
  assert.throws(() => serverDefinition(join(ROOT, 'apps'), 'wiki-mcp'), /cannot read/);
});

test('the launcher imports only node built-ins (no npm dependency, no repo import)', () => {
  const src = readFileSync(join(ROOT, 'scripts', 'agents', 'codex-mcp-launcher.mjs'), 'utf8');
  const imports = [...src.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
  assert.ok(imports.length > 0);
  assert.ok(imports.every((spec) => spec.startsWith('node:')), `non-builtin import: ${imports.join(', ')}`);
});
