#!/usr/bin/env node
import { parseArgs } from "node:util";
import { runInit } from "./commands/init.js";
import { c, errLine } from "./utils/term.js";

const VERSION = "0.1.0";

const HELP = `${c.bold("open-factory")} ${c.dim("v" + VERSION)}

Scaffold an open-factory-spec (POA + SDD spec-as-source) into your project.

${c.bold("Usage:")}
  open-factory <command> [options]

${c.bold("Commands:")}
  init [dir]           Drop a ready-to-use .claude/ and CLAUDE.md into [dir] (default: cwd)

${c.bold("Options for init:")}
  --force              Overwrite existing .claude/ and CLAUDE.md without prompting
  --dry-run            Print what would be created without writing anything
  --skip-claude-md     Don't write CLAUDE.md (keep an existing one untouched)
  --yes, -y            Assume "yes" to all prompts (non-interactive mode)

${c.bold("Global options:")}
  --help, -h           Show this help
  --version, -v        Show version

${c.bold("Examples:")}
  npx @open-factory/cli init
  npx @open-factory/cli init ./my-new-project
  npx @open-factory/cli init --dry-run
`;

function printHelp(): void {
  process.stdout.write(HELP);
}

function printVersion(): void {
  process.stdout.write(`${VERSION}\n`);
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    printHelp();
    return 0;
  }
  if (argv[0] === "--version" || argv[0] === "-v") {
    printVersion();
    return 0;
  }

  const command = argv[0];
  const rest = argv.slice(1);

  switch (command) {
    case "init": {
      const parsed = parseArgs({
        args: rest,
        allowPositionals: true,
        options: {
          force: { type: "boolean", default: false },
          "dry-run": { type: "boolean", default: false },
          "skip-claude-md": { type: "boolean", default: false },
          yes: { type: "boolean", short: "y", default: false },
          help: { type: "boolean", short: "h", default: false },
        },
      });
      if (parsed.values.help) {
        printHelp();
        return 0;
      }
      const targetDir = parsed.positionals[0] ?? ".";
      return await runInit({
        targetDir,
        force: !!parsed.values.force,
        dryRun: !!parsed.values["dry-run"],
        skipClaudeMd: !!parsed.values["skip-claude-md"],
        yes: !!parsed.values.yes,
      });
    }
    default:
      errLine(`${c.red("Unknown command:")} ${command}`);
      errLine(`Run ${c.bold("open-factory --help")} for usage.`);
      return 2;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    errLine(c.red("Fatal error:"));
    errLine(err instanceof Error ? (err.stack ?? err.message) : String(err));
    process.exit(1);
  });
