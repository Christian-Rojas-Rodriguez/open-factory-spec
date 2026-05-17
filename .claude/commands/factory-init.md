---
description: Bootstrap a new open-factory-spec project — runs UC-1 (researcher → planner → user review → specter). Use when starting a brand-new project that should adopt POA + spec-as-source.
argument-hint: "<one-paragraph project description>"
disable-model-invocation: true
---

> Skeleton — full behavior is implemented in Task 0024.

# /factory-init

Drive UC-1 end-to-end. Project description: `$ARGUMENTS`.

## Plan

1. Use the `tl` agent to orchestrate the cycle.
2. Have `tl` invoke `researcher` first to survey the domain and stack implied by the description.
3. Hand off to `planner`. Planner produces a Workflow proposal: granularity, Task list, declared agents/skills/hooks/commands/MCPs.
4. **Stop and surface the proposal to the user.** Do not write any files yet. Ask: `Approve Workflow? (yes / revise / cancel)`.
5. If `revise`, return to Planner with the user's feedback.
6. If `yes`, hand off to `specter` to materialize: `constitution.md`, `workflow.md`, per-Task skeletons under `.claude/specs/tasks/`, and agent skeletons under `.claude/agents/`.
7. Return the list of files created and the recommended next step (`/task-run 0001`).

## Acceptance

- No file is written before the user types `APPROVED`.
- Granularity is fixed in the Workflow and not re-decided by downstream agents.
- All declared components appear in `Workflow.declared*`.
