# @open-factory/cli

> Scaffold an `open-factory-spec` (POA + SDD spec-as-source) into your project.

## Quick start

```bash
npx @open-factory/cli init
```

Drops a ready-to-use `.claude/` directory and `CLAUDE.md` in the current directory. After that, open Claude Code in the same directory:

```bash
claude
```

and start with `/factory-init` once the executable components (agents, skills, hooks, commands) are materialized.

## What `init` ships

- `CLAUDE.md` — project memory loaded by Claude Code each session.
- `.claude/specs/constitution.md` — non-negotiable principles.
- `.claude/specs/workflow.md` — Tasks that build the factory itself.
- `.claude/specs/SPEC.md` — master spec (12 sections).
- `.claude/specs/diagrams/{poa-class,sequences,invocation-fixtures}.md` — POA model + use cases + smoke-tests.
- *(progressively)* `.claude/agents/`, `.claude/skills/`, `.claude/hooks/`, `.claude/commands/`, `.claude/settings.json` — executable components as they ship in each release.

## Flags

```
init [dir]            scaffold into [dir] (default: cwd)
  --force             overwrite existing .claude/ and CLAUDE.md
  --dry-run           print plan without writing
  --skip-claude-md    don't write CLAUDE.md
  --yes, -y           non-interactive mode
```

## Versioning

`@open-factory/cli` ships the entire factory as a tagged snapshot. Each new agent, skill, hook or command added upstream becomes a minor/patch release. Projects bootstrapped with an older version can upgrade by re-running `init --force` after backing up local changes (proper merge tooling is on the Phase D roadmap).

## Documentation

Full project docs: see [`.claude/specs/SPEC.md`](https://github.com/your-org/open-factory-spec/blob/main/.claude/specs/SPEC.md) in the repository.

## License

MIT
