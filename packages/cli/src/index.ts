#!/usr/bin/env node
import { parseArgs } from "node:util";
import { runInit } from "./commands/init.js";
import { runUpdate } from "./commands/update.js";
import { c, errLine } from "./utils/term.js";

const VERSION = "0.2.0";

const HELP = `${c.bold("opftr")} ${c.dim("v" + VERSION)}

Scaffold an open-factory-spec (POA + SDD spec-as-source) factory for Claude Code.

${c.bold("Usage:")}
  opftr <command> [options]

${c.bold("Commands:")}
  init [dir]               Drop a ready-to-use .claude/ and CLAUDE.md into [dir] (default: cwd)
  update [dir]             Update agents, skills and hooks from the latest package; preserves your specs

${c.bold("Options for init:")}
  --force                  Overwrite existing files without prompting
  --dry-run                Print what would be created without writing anything
  --skip-claude-md         Don't write CLAUDE.md (keep an existing one untouched)
  --yes, -y                Assume "yes" to all prompts

${c.bold("Options for update:")}
  --force                  Apply updates without prompting for confirmation
  --dry-run                Print what would change without writing anything

${c.bold("Global options:")}
  --help, -h               Show this help
  --version, -v            Show version

${c.bold("Examples:")}
  npx opftr init
  npx opftr init ./my-new-project
  npx opftr init --dry-run
  npx opftr update
  npx opftr update ./my-project --force
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
    case "update": {
      const parsed = parseArgs({
        args: rest,
        allowPositionals: true,
        options: {
          force: { type: "boolean", default: false },
          "dry-run": { type: "boolean", default: false },
          help: { type: "boolean", short: "h", default: false },
        },
      });
      if (parsed.values.help) {
        printHelp();
        return 0;
      }
      const targetDir = parsed.positionals[0] ?? ".";
      return await runUpdate({
        targetDir,
        force: !!parsed.values.force,
        dryRun: !!parsed.values["dry-run"],
      });
    }
    default:
      errLine(`${c.red("Unknown command:")} ${command}`);
      errLine(`Run ${c.bold("opftr --help")} for usage.`);
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
