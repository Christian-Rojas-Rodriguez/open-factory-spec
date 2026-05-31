# CLAUDE.md — [Your Project Name]

> This file is loaded into every Claude Code session for this project. Keep it concise — detailed documentation lives in `.claude/specs/`.

## What this project does

[One paragraph describing your project and its domain. Replace this with your own description after running `/factory-init`.]

## Non-negotiable rules

1. **Humans edit specs and approve PRs.** Agents write the code. Every code diff requires a Spec diff.
2. **Minimum permissions.** Each Agent/Skill/Command/Hook declares only what it needs for its `objective`.
3. **One Task = one Spec.** If it needs more, it is mis-granulated.
4. **Workflow is sovereign.** No POA component exists without being declared in `.claude/specs/workflow.md`.
5. **QA writes tests before Coder implements.** TDD by default. 3 levels: unit / integration / acceptance.
6. **Auditor is the gate.** Validates Spec↔Code equivalence at PR and bumps `Spec.version` at merge.

Full rules: [`.claude/specs/constitution.md`](.claude/specs/constitution.md).

## Where things live

| Type | Location |
|---|---|
| Agents | `.claude/agents/<n>.md` |
| Skills | `.claude/skills/<n>/SKILL.md` (+ scripts) |
| Commands | `.claude/commands/<n>.md` |
| Hooks (scripts) | `.claude/hooks/<n>.{sh,py}` |
| Hooks (registry) | `.claude/settings.json` |
| Constitution | `.claude/specs/constitution.md` |
| Workflow | `.claude/specs/workflow.md` |
| Tasks + Specs | `.claude/specs/tasks/<id>-<slug>.md` |
| Master Spec | `.claude/specs/SPEC.md` |
| Diagrams | `.claude/specs/diagrams/` |
| Tests | `tests/<level>/<task-id>__<slug>.test.*` |

## Project status

[Describe your current milestone and what is next. Replace after running `/factory-init`.]

## When to delegate to which agent

Use agents proactively based on the natural match of the prompt:

- "Research / analyze the domain" → `researcher`
- "Define the workflow / design the tasks" → `planner`
- "Polish the idea / clarify what/why/how" → `curator`
- "Write / materialize the spec" → `specter`
- "Validate the spec / write the tests" → `qa`
- "Implement the task / write the code" → `coder`
- "Review the diff / code review" → `reviewer`
- "Run the tests" → `tester`
- "Open the PR" → `pr`
- "Audit / verify the contract" → `auditor`
- "Orchestrate the full cycle" → `tl`

Full matching fixtures: [`.claude/specs/diagrams/invocation-fixtures.md`](.claude/specs/diagrams/invocation-fixtures.md).

## Coding conventions

- **Markdown + YAML frontmatter** for all POA definitions.
- **Bash + jq** for simple hooks; **Python 3** for complex hooks and skill scripts with side effects.
- **kebab-case** for Agent/Skill/Command/Hook names (constitution §5).
- **Specs with SemVer**: `version: x.y.z` in frontmatter. Bumped only by Auditor.

## Before modifying `.claude/`

1. Read [`.claude/specs/constitution.md`](.claude/specs/constitution.md) and [`.claude/specs/workflow.md`](.claude/specs/workflow.md).
2. Confirm the change is declared in `workflow.md` (if not, run `/agent-new` or `/spec-new` first).
3. To change the constitution: justify each modified clause and bump major on affected Specs.
