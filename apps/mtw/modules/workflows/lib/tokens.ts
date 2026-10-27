// New module (no wiki origin): pure helper shared by server and client.
import type { NodeRun } from './engine';

export const sumTokens = (run: { nodes: Record<string, NodeRun> }): { total: number; estCostUsd: number; nodes: number } => {
  let total = 0;
  let cost = 0;
  let n = 0;
  for (const node of Object.values(run.nodes)) {
    if (!node.tokens) continue;
    n++;
    total += node.tokens.total;
    cost += node.tokens.estCostUsd ?? 0;
  }
  return { total, estCostUsd: cost, nodes: n };
};
