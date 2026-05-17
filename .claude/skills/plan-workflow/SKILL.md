---
description: Produce a Workflow proposal — granularity strategy, task list, and declared agents/skills/hooks/commands/MCPs — for a project after researcher has surveyed the domain. Use during Bootstrap (UC-1) and Workflow revision.
disable-model-invocation: true
allowed-tools: Read
---

> Skeleton — full behavior is implemented in Task 0008.

# plan-workflow

Render a Workflow proposal in the canonical shape expected by Planner.

## Inputs

- Domain summary (from `researcher`).
- Stack summary (from `researcher`).
- User's high-level intent.

## Output

A Markdown document with the following sections, ready to be inserted as `.claude/specs/workflow.md`:

1. `## 1. Granularity` — the chosen granularity strategy and the justification (one paragraph).
2. `## 2. Declared components` — tables for agents / skills / hooks / commands / MCPs.
3. `## 3. Tasks` — ordered list with `id`, `slug`, scope.
4. `## 4. Dependencies` — mermaid graph of Task dependencies.
5. `## 5. Definition of Done` — generic DoD plus task-specific overrides if needed.
6. `## 6. Risks` — known risks and their mitigations.

## Operating rules

- Keep the proposal **terse**. The Workflow is reviewed by the User; verbosity kills review quality.
- One Task = one Spec. If you cannot describe a Task in one sentence, it is too big.
- Do not invent components. If unsure whether the project needs an agent/skill/hook, leave a `?` and surface it in `## Open questions`.
