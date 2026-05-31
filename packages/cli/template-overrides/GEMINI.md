# GEMINI.md — [Your Project Name]

> This file is loaded into every Gemini CLI session for this project. Equivalent to `CLAUDE.md` for Claude Code.

## What this project does

[One paragraph describing your project and its domain. Replace this with your own description after running `/factory-init`.]

## Non-negotiable rules

1. **Spec-as-source**: every code diff requires a Spec diff. The `pre-commit-contract` hook enforces this — do not bypass it.
2. **Minimum permissions**: each agent declares only the tools it needs for its `objective`.
3. **One Task = one Spec.** If it needs more, it is mis-granulated.
4. **QA writes tests before Coder implements.** TDD. 3 levels: unit / integration / acceptance.
5. **Auditor is the only entity allowed to bump `Spec.version`**.

## Your role as TL (session orchestrator)

In Gemini CLI, **you are the TL**: the orchestrator that decides who acts next and coordinates the full pipeline.

Standard pipeline:
```
@researcher → @planner → @curator → @specter → @qa → @coder → @reviewer → @tester → @pr → @auditor
```

How to delegate with `@` syntax:
- `@researcher <task>` — research domain, codebase, library
- `@planner <task>` — design workflow, decide granularity
- `@curator <task>` — polish idea into What/Why/How
- `@specter <task>` — materialize spec to disk
- `@qa <task>` — validate spec and write tests (RED first)
- `@coder <task>` — implement until tests are GREEN
- `@reviewer <task>` — code review of diff against spec
- `@tester <task>` — run the suite and report
- `@pr <task>` — open pull request
- `@auditor <task>` — audit Spec↔Code, bump version

> **Gemini CLI limitation**: subagents cannot call other subagents. If a subagent needs to delegate, return control here and orchestrate the next step.

## Where things live

| Type | Location |
|---|---|
| Agents (Claude Code) | `.claude/agents/<n>.md` |
| Agents (Gemini CLI) | `.gemini/agents/<n>.md` |
| Skills | `.claude/skills/<n>/SKILL.md` |
| Commands | `.claude/commands/<n>.md` |
| Hooks | `.claude/hooks/<n>.{sh,py}` |
| Constitution | `.claude/specs/constitution.md` |
| Workflow | `.claude/specs/workflow.md` |
| Tasks + Specs | `.claude/specs/tasks/<id>-<slug>.md` |
| Tests | `tests/<level>/<task-id>__<slug>.test.*` |

## When to delegate to which agent

| User prompt | Agent |
|---|---|
| "Research / analyze the domain" | `@researcher` |
| "Define the workflow / design the tasks" | `@planner` |
| "Polish the idea / clarify what/why/how" | `@curator` |
| "Write / materialize the spec" | `@specter` |
| "Validate the spec / write the tests" | `@qa` |
| "Implement the task / write the code" | `@coder` |
| "Review the diff / code review" | `@reviewer` |
| "Run the tests" | `@tester` |
| "Open the PR" | `@pr` |
| "Audit / verify the contract" | `@auditor` |
| "Orchestrate the full cycle" | you directly |

## Coding conventions

- **Markdown + YAML frontmatter** for all POA definitions.
- **Bash + jq** for simple hooks; **Python 3** for complex hooks.
- **kebab-case** for Agent/Skill/Command/Hook names.
- **SemVer** on every spec (`version: x.y.z`). Only Auditor bumps.

## Recommended reading at session start

1. `.claude/specs/constitution.md` — non-negotiable rules
2. `.claude/specs/workflow.md` — declared tasks and implementation order
3. `.claude/specs/SPEC.md` — master spec of your project
