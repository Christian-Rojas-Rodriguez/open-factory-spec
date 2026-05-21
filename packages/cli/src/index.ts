#!/usr/bin/env node
import { parseArgs } from "node:util";
import { runInit } from "./commands/init.js";
import { c, errLine } from "./utils/term.js";
import { providerIds } from "./utils/providers.js";

const VERSION = "0.1.0";

const HELP = `${c.bold("open-factory")} ${c.dim("v" + VERSION)}

Scaffold an open-factory-spec (POA + SDD spec-as-source) into your project.

${c.bold("Usage:")}
  open-factory <command> [options]

${c.bold("Commands:")}
  init [dir]           Drop a ready-to-use .claude/ and agent-memory file into [dir] (default: cwd)

${c.bold("Options for init:")}
  --provider <id>      AI provider to scaffold for (${providerIds()})
                       Prompted interactively when omitted
  --force              Overwrite existing files without prompting
  --dry-run            Print what would be created without writing anything
  --skip-claude-md     Don't write the agent-memory file (keep an existing one untouched)
  --yes, -y            Assume "yes" to all prompts; defaults to anthropic provider

${c.bold("Global options:")}
  --help, -h           Show this help
  --version, -v        Show version

${c.bold("Examples:")}
  npx @open-factory/cli init
  npx @open-factory/cli init --provider gemini
  npx @open-factory/cli init ./my-new-project --provider openai
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
          provider: { type: "string" },
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
        provider: parsed.values.provider as import("./utils/providers.js").ProviderId | undefined,
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
