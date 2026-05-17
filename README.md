# open-factory-spec

> A POA (Programación Orientada a Agentes) + SDD (Spec-Driven Development, spec-as-source) **agent factory for Claude Code**, distributed as a pnpm CLI.

## What this is

A blueprint and a CLI to scaffold a self-consistent `.claude/` directory into any project, with:

- 11 base agents organized in layers (Bootstrap / Specify / Plan / Implement / Validate + transversal).
- 8 skills, 4 normative hooks, 6 commands.
- A 5-level contract (Bootstrap → Constitution → Workflow → Task → Spec).
- Three-level testing (unit / integration / acceptance) authored by the QA agent.
- Hard invariants enforced by hooks and the Auditor agent.

Read the full blueprint in [`.claude/specs/SPEC.md`](.claude/specs/SPEC.md).

## Quick start (consumer)

```bash
# in your target project
npx @open-factory/cli init
```

That drops a ready-to-use `.claude/` and `CLAUDE.md` in the current directory.

Then open Claude Code in the same directory and start working.

## Repo layout

```
open-factory-spec/
├── .claude/                    # the factory itself (dogfooded; source of truth for templates)
├── CLAUDE.md                   # project memory loaded by Claude Code
├── package.json                # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── packages/
    └── cli/                    # @open-factory/cli
        ├── package.json
        ├── src/
        ├── scripts/
        │   └── sync-templates.mjs   # copies .claude/ + CLAUDE.md → packages/cli/templates/
        ├── templates/          # generated snapshot shipped with the package
        └── tests/
```

The `.claude/` directory at the repo root IS the template. The CLI ships a synced snapshot in `packages/cli/templates/`. No editable duplication.

## Development

Requires Node ≥ 20 and pnpm. If you don't have pnpm:

```bash
corepack enable    # bundled with Node 16+, activates pnpm/yarn shims
```

Then:

```bash
pnpm install
pnpm -r build              # syncs templates + compiles CLI
pnpm -r test               # runs CLI tests against the synced templates
node packages/cli/dist/index.js init ./tmp-test    # smoke-test init
```

### Templates dogfooding

When you edit anything in `.claude/` or `CLAUDE.md`, re-sync the templates before testing the CLI:

```bash
pnpm sync                  # alias for: node packages/cli/scripts/sync-templates.mjs
```

`pnpm -r build` and `pnpm -r test` run sync automatically. The `prepack` hook also syncs before `npm publish`.

## Distribution roadmap

- **Phase B (current)**: single npm package `@open-factory/cli` that scaffolds `.claude/` into target projects. Preserves POA semantics fully (per-agent `hooks`, `mcpServers`, `permissionMode` all live in the target project's files).
- **Phase D (future)**: monorepo evolves with `@open-factory/core` (POA types + validators), `@open-factory/cli` (scaffolding + headless ops), and `@open-factory/plugin` (Claude Code plugin for the parts that tolerate plugin-level restrictions).

See [`.claude/specs/constitution.md`](.claude/specs/constitution.md) §4 for rationale.

## License

MIT
