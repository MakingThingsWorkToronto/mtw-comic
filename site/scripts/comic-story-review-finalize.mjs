// One explicit finalization of exact hash-bound canonical capture manifests.
import { finalizeReviewBatch } from './comic-story-library.mjs';
const args = process.argv.slice(2);
if (args[0] !== '--batch' || !args[1] || args.length < 3) throw new Error('Usage: node scripts/comic-story-review-finalize.mjs --batch <name> <pending-manifest.json> [...]');
console.log(`Review batch registered: ${finalizeReviewBatch(args.slice(2), args[1])}`);
