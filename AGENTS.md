# AGENTS.md — open-factory-spec

This is an **agent factory** built on Spec-Driven Development (SDD) and POA (Agent-Oriented Programming). Humans only edit specs and approve PRs. Agents write all code.

## Project structure

```
.claude/agents/      # Claude Code agent definitions
.claude/specs/       # Specs (constitution, workflow, per-task specs)
.claude/skills/      # Reusable skills loaded by agents
.claude/commands/    # Slash commands
.claude/hooks/       # Lifecycle hooks (pre-commit-contract, post-merge-bump)
.opencode/agents/    # OpenCode agent definitions (same agents, OpenAI models)
tests/               # unit / integration / acceptance tests
  unit/              # tests/<level>/<task-id>__<slug>.test.*
  integration/
  acceptance/
packages/            # CLI package (opftr)
```

## Non-negotiable rules

1. **Spec-as-source**: every code diff must trace to a Spec diff. The `pre-commit-contract` hook enforces this — do not bypass it.
2. **Minimum permissions**: each agent/skill/hook declares only what it needs. Never expand scope silently.
3. **One Task = one Spec**. If something needs more, it is mis-granulated.
4. **QA writes tests before Coder implements** (TDD). Tests must be red when handed to Coder.
5. **Auditor is the only entity allowed to bump `Spec.version`**.

## Agent pipeline

```
researcher → planner (PRD draft → Gate 1 → RFC draft → Gate 2) → specter → qa → coder → reviewer → tester → pr → auditor
```

- `architect` orchestrates the full cycle end-to-end.
- Bootstrap (UC-1) has **two review gates**: PRD draft (`drafts/prd.md`) then RFC draft (`drafts/rfc.md`). The user opens each file, edits it, and approves before the next stage. Nothing is written to `workflow.md` or task specs until both gates pass.
- Approval checkpoints require explicit user reply (`approve prd` / `approve rfc` / `APPROVED`).

## Agents and their roles

| Agent | Layer | When to invoke |
|---|---|---|
| `researcher` | Transversal | Research domain, codebase, or library before planning |
| `planner` | Bootstrap | Design workflow, decide task granularity, bootstrap project |
| `curator` | Specify | Polish raw task idea into What/Why/How triple |
| `specter` | Specify | Write approved content to disk as Spec file |
| `qa` | Plan | Lint spec for testability, author failing test suite |
| `coder` | Implement | Implement task until all QA tests pass |
| `reviewer` | Implement | Code review diff against spec (read-only) |
| `tester` | Validate | Run test suite and report results |
| `pr` | Validate | Open pull request with canonical template |
| `auditor` | Validate | Audit Spec↔Code equivalence, bump Spec.version at merge |
| `architect` | Cross-cutting | Orchestrate full UC-1/UC-2/UC-4 cycle |

## How to invoke agents

With Codex, pass the agent role as context in your prompt:

```bash
# Research before planning
codex "Acting as researcher: survey the openai/agents-sdk library and return findings"

# Full task cycle
codex "Acting as tl: run task 0018 through the full pipeline"

# Named variant (requires --agents flag when available)
codex --agents coder "implement the failing tests for task 0018"
```

## Spec format

Every spec lives at `.claude/specs/tasks/<id>-<slug>.md` with this structure:

```markdown
---
id: "NNNN"
slug: "short-slug"
version: "0.1.0"
scope:
  - path/to/file.ts
acceptanceCriteria:
  - criterion description
---

## What
## Why
## How
```

## Coding conventions

- **Markdown + YAML frontmatter** for all POA definitions.
- **kebab-case** for agent/skill/command/hook names.
- **Bash + jq** for simple hooks; **Python 3** for complex hooks with side effects.
- **SemVer** on every spec (`version: x.y.z`). Only Auditor bumps it.
- Tests path: `tests/<level>/<task-id>__<slug>.test.*`
- Never modify tests written by QA. If a test seems wrong, escalate to QA.

## Running tests

```bash
pnpm test              # full suite
pnpm test:unit         # unit only
pnpm test:integration  # integration only
pnpm test:acceptance   # acceptance only
```

## Key files to read before making changes

- `.claude/specs/constitution.md` — non-negotiable rules
- `.claude/specs/workflow.md` — declared agents, skills, tasks
- `.claude/specs/SPEC.md` — master spec of the factory itself
