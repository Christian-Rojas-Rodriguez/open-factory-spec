# opftr

> Scaffold an `open-factory-spec` (POA + SDD spec-as-source) agent factory for **Claude Code**.

## Quick start

**Requires Node ≥ 20.** In your project:

```bash
npx opftr init
```

That writes exactly three things into the current directory:

```
.claude/              the factory (agents, skills, commands, hooks, specs)
CLAUDE.md             project memory loaded by Claude Code each session
opftr.config.json     { "version": "…" }  — lets `opftr update` upgrade you later
```

Then open Claude Code in the same directory and run `/factory-init "your project description"`.

## Commands

```
init [dir]                Scaffold .claude/ + CLAUDE.md + opftr.config.json (default dir: cwd)
  --force                 overwrite existing files without prompting
  --dry-run               print the plan without writing
  --skip-claude-md        don't write CLAUDE.md
  --yes, -y               non-interactive

update [dir]              Update factory-owned files from the latest package
  --force                 apply without prompting
  --dry-run               preview changes

spec-lint <file>          Validate a Task spec (frontmatter + sections + SemVer); exit 2 if blocking
audit --check             Enforce scope + coverage on staged changes; exit 2 on violation
audit --bump --since <r>  Propose/apply SemVer bumps for Task specs changed since git ref <r>
```

The `spec-lint` and `audit` commands back the factory's git/Claude-Code hooks
(`pre-spec-validate`, `pre-commit-contract`, `post-merge-bump`) so the spec↔code
contract is enforced for real, not advisory.

## Updating

```bash
npx opftr@latest update
```

Reads your `opftr.config.json`, refreshes factory-owned files (agents, skills, hooks),
and **never** overwrites your data:

- `CLAUDE.md` — project memory is never touched.
- `.claude/specs/tasks/`, `.claude/specs/drafts/`, `.claude/specs/diagrams/` — your specs are yours.
- `.claude/specs/constitution.md`, `workflow.md`, `SPEC.md` — never overwritten once you've edited them.
- `opftr.config.json` — only the `version` field is bumped (legacy fields are preserved).

Use `--dry-run` to preview.

## Documentation

Full project docs: [`.claude/specs/SPEC.md`](https://github.com/Christian-Rojas-Rodriguez/open-factory-spec/blob/main/.claude/specs/SPEC.md).

## License

MIT
