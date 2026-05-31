# Constitution — [Your Project]

> Non-negotiable principles for this project. Any Spec, Agent, Skill, Command or Hook that contradicts this constitution must be rejected in review.

## 1. Identity

This project implements two complementary disciplines:

- **SDD spec-as-source** (Spec-Driven Development, paper arxiv:2602.00180 §II-C): the spec is the only artifact humans edit directly; code is entirely generated from the spec.
- **POA** (Agent-Oriented Programming): executable components (Agent, Skill, Command, Hook, MCP) are modeled as first-class objects with `name`, minimal `permissions`, and an explicit `objective`.

## 2. Non-negotiable rules

### 2.1 Spec-as-source

1. **Humans only edit specs and approve PRs.** Any direct human edit to code is a workflow bug, not a valid shortcut.
2. **Every code diff requires a corresponding Spec diff.** The `pre-commit-contract` hook rejects commits whose code diff is not covered by the current version of some in-scope Spec.
3. **Auditor is the final gate.** It validates Spec↔Code equivalence on every PR and, at merge, bumps `Spec.version` according to the scope of the change.
4. **Coder edits incrementally** (does not regenerate from scratch). The equivalence invariant with the Spec is enforced by Auditor + QA-authored tests, not by pure regeneration.

### 2.2 POA — Agent-Oriented Programming

5. **Every executable component is a `POAObject`** with `name`, `permissions` (minimal), `objective`. No exceptions.
6. **Minimum permissions by default.** An Agent/Skill/Command/Hook that requires more permissions than strictly necessary to fulfill its `objective` must be rejected.
7. **Encapsulation by file.** Each Agent lives in `.claude/agents/<name>.md`, each Skill in `.claude/skills/<name>/SKILL.md`, each Command in `.claude/commands/<name>.md`, each Hook as a script in `.claude/hooks/` + an entry in `.claude/settings.json`.
8. **Composition over inheritance.** An Agent composes Skills + Commands + MCPs + Hooks; it does not inherit behavior from another Agent. Reuse between agents goes through shared Skills.

### 2.3 Granularity and workflow

9. **Granularity is decided at Bootstrap, not at spec-cycle.** Specifically, it is fixed in the **RFC** (§7 Granularity), and the User approves it at the RFC gate before `planner` derives the Workflow. Curator/Specter do NOT decide it; they inherit it from the derived Workflow.
10. **Bootstrap is conducted as an interview in two stages: PRD → RFC. Each stage writes a draft to disk for editor review.**
    - The **PRD draft** is written to `.claude/specs/drafts/prd.md` (`status: draft`). The User opens it in their editor, edits it directly, and approves with "approve prd" (Gate 1).
    - The **RFC draft** is written to `.claude/specs/drafts/rfc.md` (`status: draft`). The User opens it, reviews it (§7 Granularity and §8 POA Declaration must be complete), and approves with "approve rfc" (Gate 2).
    - Upon approving each gate, the draft is **promoted** to `.claude/specs/prd.md` / `rfc.md` (`status: approved`).
    - `workflow.md` is **derived from the approved RFC** by `plan-workflow`. It remains the sole sovereign declarant at runtime.
    - **Until both gates pass**: the only files written are the drafts in `drafts/`. `workflow.md`, `constitution.md`, and all task specs are written ONLY after Gate 2.
    - The final artifacts (`prd.md`, `rfc.md`, `workflow.md`, `constitution.md`) are committed together at Bootstrap close.
11. **One Task = one Spec.** If a Task requires multiple specs, it is mis-granulated and must be decomposed.
12. **Workflow is the only artifact that declares which agents/skills/hooks/commands/MCPs the project needs.** Creating a new component without going through Workflow is technical debt. (`workflow.md` is derived from the RFC; the canonical source for human review is the RFC, but the runtime declarant is always `workflow.md`.)

### 2.4 Invocation and discovery

12. **Agents and Skills are invoked by matching the prompt against `description`.** Every `description` must be written thinking about the User's natural phrases. Validated with fixtures in `.claude/specs/diagrams/invocation-fixtures.md`.
13. **Commands and Hooks are deterministic.** For actions with side effects (writing a spec, bumping a version, opening a PR), prefer Commands (`/command`) or Hooks (event) over prompt-based invocation.
14. **Skills with side effects carry `disable-model-invocation: true`** to prevent Claude from triggering them on its own.

### 2.5 Testing — 3 mandatory levels

15. **QA writes tests before Coder implements.** TDD by default, derived from the Spec contract.
16. **Minimum coverage at 3 levels**: `unit` (per acceptance criterion), `integration` (per inter-Task interaction declared in the Workflow), `acceptance` (per user-facing "What" scenario).
17. **Conventional paths**: `tests/<level>/<task-id>__*.test.*` so that `pre-commit-contract` can map diff → Task → required tests.

### 2.6 Contract versioning

18. **SemVer per Spec.** Patch = clarification with no behavior change. Minor = new compatible acceptance criterion. Major = incompatible change to What/Why or removal of criterion.
19. **The bump is triggered by Auditor at merge**, never before.

## 3. Technical stack

- **Definitions**: Markdown with YAML frontmatter (Claude Code's native format for subagents/skills/commands).
- **Hooks**: bash + `jq` for JSON stdin parsing. Python optional for complex hooks.
- **Skill scripts**: Python 3 preferred (stdlib when sufficient, declared requirements when not). Bash for short scripts. Node only if justified.
- **Tests**: depends on the project's domain — the factory does not impose a framework, only the folder structure and the coverage gate.

## 4. Distribution

This factory was scaffolded with `opftr`. See [opftr on npm](https://www.npmjs.com/package/opftr) for updates. Run `npx opftr update` to pull new agent/skill/hook definitions without overwriting your specs.

## 5. Naming conventions

- **Agents** in kebab-case without namespace (e.g. `planner`, `nextjs-page`).
- **Skills** in kebab-case with verb-noun (e.g. `polish-idea`, `author-tests`).
- **Commands** in kebab-case with verb or verb-noun (e.g. `factory-init`, `task-run`, `spec-bump`).
- **Hooks** in kebab-case with `pre-`/`post-` + objective (e.g. `pre-spec-validate`, `post-merge-bump`).
- **Tasks** with 4-digit numeric id + descriptive slug (e.g. `0007-figma-design-system-import`).
- **Specs**: filename = Task id (`tasks/0007-….md`).

## 6. Living memory

Agents with `memory: project` write learnings to `.claude/agent-memory/<agent>/MEMORY.md`. This directory is committed so institutional knowledge travels with the repo.

Agents with `memory: local` use `.claude/agent-memory-local/` (gitignored) for private experiments.

## 7. Changes to this constitution

Changing this file requires:

1. A PR with explicit justification for each touched clause.
2. Human approval (not delegated to Auditor — the constitution is above the Spec contract).
3. If the clause affects any existing Agent/Skill/Hook, the corresponding Specs must bump major.
