---
description: Bootstrap a new open-factory-spec project — runs UC-1 (researcher → planner PRD interview → PRD review → RFC interview → RFC review → specter). Use when starting a brand-new project that should adopt POA + spec-as-source.
argument-hint: "<one-paragraph project description>"
disable-model-invocation: true
---

> Skeleton — full behavior is implemented in Task 0024.

# /factory-init

Drive UC-1 end-to-end with two review gates (PRD then RFC). Project description: `$ARGUMENTS`.

## Plan

1. Use the `tl` agent to orchestrate the cycle.
2. Have `tl` invoke `researcher` to survey the domain and stack implied by the description.
3. Hand off to `planner`. Planner runs `Skill(draft-prd)` to conduct the product interview.
4. **Gate 1 — PRD review.** Stop and surface the PRD proposal. Ask: `Approve PRD? (yes / revise / cancel)`. Do not write any files yet. If `revise`, Planner iterates.
5. On PRD `yes`, Planner runs `Skill(draft-rfc)` to conduct the technical interview (using the approved PRD as input). Also invokes `Skill(propose-agents)` for the RFC §8 Declaración POA.
6. **Gate 2 — RFC review.** Stop and surface the RFC proposal (verify §7 Granularidad and §8 Declaración POA are complete). Ask: `Approve RFC? (yes / revise / cancel)`. Do not write any files yet. If `revise`, Planner iterates.
7. On RFC `yes`, Planner runs `Skill(plan-workflow)` to derive `workflow.md` from the RFC (§7 + §8).
8. Hand off to `specter` to materialize:
   - `.claude/specs/prd.md`
   - `.claude/specs/rfc.md`
   - `.claude/specs/workflow.md` (derived from RFC)
   - `.claude/specs/constitution.md`
   - Per-Task skeletons under `.claude/specs/tasks/`
   - Agent/skill/hook/command skeletons
9. Return the list of files created and the recommended next step (`/task-run 0001`).

## Acceptance

- No file is written before **both** PRD and RFC are approved by the User.
- Granularity is fixed in the RFC (§7) and not re-decided by downstream agents.
- RFC §8 (Declaración POA) is complete before `plan-workflow` runs.
- All declared components appear in `Workflow.declared*`.
- `prd.md` and `rfc.md` are committed alongside `workflow.md` and `constitution.md`.
