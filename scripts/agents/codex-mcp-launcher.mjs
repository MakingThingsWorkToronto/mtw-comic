#!/usr/bin/env node
/**
 * Start one MCP server from the repository's canonical `.mcp.json`.
 *
 * Codex may launch project MCP servers while its cwd is any repository subdirectory. The tiny
 * bootstrap emitted into `.codex/config.toml` resolves the Git root and imports this module, then
 * this module validates and spawns the named canonical definition with the repository root as cwd.
 * stdout is inherited exclusively for the MCP protocol; diagnostics go to stderr.
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export class McpLaunchRefusal extends Error {
  constructor(message) {
    super(message);
    this.name = 'McpLaunchRefusal';
  }
}

function manifestAt(root) {
  try {
    return JSON.parse(readFileSync(join(root, '.mcp.json'), 'utf8'));
  } catch (error) {
    throw new McpLaunchRefusal(`cannot read ${join(root, '.mcp.json')}: ${error.message}`);
  }
}

export function serverDefinition(root, name) {
  const cfg = manifestAt(root)?.mcpServers?.[name];
  if (!cfg || typeof cfg.command !== 'string' || !Array.isArray(cfg.args)) {
    throw new McpLaunchRefusal(`unknown or invalid .mcp.json server "${name}"`);
  }
  if (cfg.env && (typeof cfg.env !== 'object' || Array.isArray(cfg.env))) {
    throw new McpLaunchRefusal(`.mcp.json server "${name}" env must be an object`);
  }
  return cfg;
}

export function launchMcp(name, { root, spawnImpl = spawn } = {}) {
  if (!root) throw new McpLaunchRefusal('repository root was not provided by the Codex bootstrap');
  const cfg = serverDefinition(root, name);
  const child = spawnImpl(cfg.command, cfg.args, {
    cwd: root,
    env: { ...process.env, ...(cfg.env ?? {}) },
    stdio: 'inherit',
    windowsHide: true,
    shell: false,
  });
  child.once('error', (error) => {
    console.error(`codex MCP launcher: ${name} failed: ${error.message}`);
    process.exit(2);
  });
  child.once('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 1);
  });
  return child;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    launchMcp(process.argv[2], { root: process.cwd() });
  } catch (error) {
    console.error(`codex MCP launcher: ${error.message}`);
    process.exit(2);
  }
}
