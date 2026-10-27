// `mtw` CLI dispatcher: what skills and procedures call. Each module adds its commands as a function that returns an
// exit code, or null when the arguments are not its own. Images commands live in cli/images.ts, Journal in cli/journal.ts.
import { IMAGES_USAGE, imagesCommand } from './images';
import { JOURNAL_USAGE, journalCommand } from './journal';

const USAGE = `${IMAGES_USAGE}

${JOURNAL_USAGE}`;
const handlers: ((argv: string[]) => Promise<number | null>)[] = [(argv) => imagesCommand(argv), (argv) => journalCommand(argv)];

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  if (!argv.length || argv[0] === 'help' || argv[0] === '--help') {
    process.stdout.write(`${USAGE}\n`);
    return argv.length ? 0 : 2;
  }
  for (const handle of handlers) {
    const code = await handle(argv);
    if (code !== null) return code;
  }
  process.stderr.write(`Unknown command: ${argv.slice(0, 2).join(' ')}\n${USAGE}\n`);
  return 2;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.stderr.write(`${(error as Error).message}\n`);
    process.exitCode = 1;
  },
);
