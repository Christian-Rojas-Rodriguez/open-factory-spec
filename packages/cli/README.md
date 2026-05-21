# @open-factory/cli

> Scaffold an `open-factory-spec` (POA + SDD spec-as-source) into your project.

## Quick start

```bash
npx @open-factory/cli init
```

The CLI asks which AI provider you want to use, then drops the right files into the current directory:

```
? Select your AI provider:
  › 1. Anthropic — Claude Code
    2. OpenAI — Codex CLI
    3. OpenCode
    4. Gemini — Gemini CLI

Enter number (1–4) [1]:
```

Then open your chosen tool in the same directory and start with `/factory-init` once the executable components (agents, skills, hooks, commands) are materialized.

## Supported providers

| Provider | Memory file | Command |
|---|---|---|
| Anthropic — Claude Code | `CLAUDE.md` | `claude` |
| OpenAI — Codex CLI | `AGENTS.md` | `codex` |
| OpenCode | `AGENTS.md` | `opencode` |
| Gemini — Gemini CLI | `GEMINI.md` | `gemini` |

Pass `--provider <id>` to skip the interactive prompt:

```bash
npx @open-factory/cli init --provider gemini
npx @open-factory/cli init --provider opencode ./my-project
```

## What `init` ships

- Agent-memory file (`CLAUDE.md`, `AGENTS.md`, or `GEMINI.md` depending on provider) — project memory loaded each session.
- `.claude/specs/constitution.md` — non-negotiable principles.
- `.claude/specs/workflow.md` — Tasks that build the factory itself.
- `.claude/specs/SPEC.md` — master spec (12 sections).
- `.claude/specs/diagrams/{poa-class,sequences,invocation-fixtures}.md` — POA model + use cases + smoke-tests.
- *(progressively)* `.claude/agents/`, `.claude/skills/`, `.claude/hooks/`, `.claude/commands/`, `.claude/settings.json` — executable components as they ship in each release.

## Flags

```
init [dir]              scaffold into [dir] (default: cwd)
  --provider <id>       anthropic | openai | opencode | gemini
                        prompted interactively when omitted
  --force               overwrite existing files without prompting
  --dry-run             print plan without writing
  --skip-claude-md      don't write the agent-memory file
  --yes, -y             non-interactive mode (defaults to anthropic)
```

## Versioning

`@open-factory/cli` ships the entire factory as a tagged snapshot. Each new agent, skill, hook or command added upstream becomes a minor/patch release. Projects bootstrapped with an older version can upgrade by re-running `init --force` after backing up local changes (proper merge tooling is on the Phase D roadmap).

## Documentation

Full project docs: see [`.claude/specs/SPEC.md`](https://github.com/your-org/open-factory-spec/blob/main/.claude/specs/SPEC.md) in the repository.

## License

MIT
