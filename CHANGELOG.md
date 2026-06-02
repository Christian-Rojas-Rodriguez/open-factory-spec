# Changelog

All notable changes to `opftr` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project adheres to
SemVer. Each release is tagged `v<version>` (matching `packages/cli/package.json`),
which triggers the npm publish workflow.

## [0.2.0] — unreleased

### Changed (breaking)
- **Claude Code only.** Dropped the hand-maintained Gemini / OpenCode / Codex
  mirrors (`.gemini/`, `.opencode/`, `GEMINI.md`, `opencode.json`, `AGENTS.*.md`)
  and the multi-provider machinery (`--provider`/`--spec-provider`/… flags,
  `providers.ts`, `phases.ts`). `opftr init` now writes exactly `.claude/`,
  `CLAUDE.md`, and a minimal `opftr.config.json` (`{ version }`). Legacy configs
  with a `phases` map are tolerated and preserved by `update`.

### Added
- **Real spec↔code enforcement.** New zero-dep subcommands back the (previously
  no-op) hooks:
  - `opftr spec-lint <file>` — frontmatter keys, required `##` sections, SemVer,
    non-empty acceptance criteria, ambiguity warnings, workflow cross-link.
  - `opftr audit --check` — scope (every `.claude/` POA component must be in a
    Spec's `scope`) + coverage (every active Spec needs a test).
  - `opftr audit --bump --since <ref>` — patch-bump `Spec.version` for changed specs.
- Hooks `pre-spec-validate`, `pre-commit-contract`, `post-merge-bump`,
  `permissions-guard` now perform real checks (delegating to the CLI).
- CI on GitHub Actions (Node 20 + 22: build + test) and a tag-triggered npm
  publish workflow with provenance.
- Tests for `spec-lint`, `audit`, `update`, and a parametrized agent-frontmatter
  contract test (incl. the per-layer color palette).

### Fixed
- Completed the `tl → architect` rename across specs, diagrams, commands and
  skills so `/task-run` and `/factory-init` reference an agent that exists.
- Restored the per-layer agent color palette (a prior change had flattened every
  agent to `red`).
- Honest README: clear "early / Milestone A" status; claims now match reality.

[0.2.0]: https://github.com/Christian-Rojas-Rodriguez/open-factory-spec/releases/tag/v0.2.0
