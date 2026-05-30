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
3. Hand off to `planner`. Planner runs `Skill(draft-prd)` to conduct the product interview, then hands content to `specter`.
4. **Gate 1 — PRD draft.** `specter` writes `.claude/specs/drafts/prd.md` (`status: draft`). `tl` surfaces: _"Open `.claude/specs/drafts/prd.md`, review/edit it. Reply 'approve prd', 'revise: \<feedback\>', or 'cancel'."_ **No other files are written.** If `revise`, Planner updates the draft in-place and re-surfaces.
5. On PRD `approve`, Planner runs `Skill(draft-rfc)` using the draft as input. Also invokes `Skill(propose-agents)` for RFC §8. Hands content to `specter`.
6. **Gate 2 — RFC draft.** `specter` writes `.claude/specs/drafts/rfc.md` (`status: draft`). `tl` surfaces: _"Open `.claude/specs/drafts/rfc.md`, review/edit it (§7 Granularidad and §8 Declaración POA must be complete). Reply 'approve rfc', 'revise: \<feedback\>', or 'cancel'."_ **No other files are written.**
7. On RFC `approve`: `specter` promotes both drafts (`drafts/prd.md` → `prd.md`, `drafts/rfc.md` → `rfc.md`, `status: approved`).
8. Planner runs `Skill(plan-workflow)` to derive `workflow.md` from the approved `rfc.md` (§7 + §8).
9. `specter` materializes:
   - `.claude/specs/workflow.md` (derived from RFC)
   - `.claude/specs/constitution.md`
   - Per-Task skeletons under `.claude/specs/tasks/`
   - Agent/skill/hook/command skeletons
10. Return the list of files created and the recommended next step (`/task-run 0001`).

## Acceptance

- The ONLY files written before Gate 1 approval: `.claude/specs/drafts/prd.md`.
- The ONLY files written before Gate 2 approval: `.claude/specs/drafts/rfc.md`.
- `workflow.md`, `constitution.md`, and all task specs are written ONLY after both gates pass.
- Granularity is fixed in the RFC (§7) and not re-decided by downstream agents.
- RFC §8 (Declaración POA) is complete before `plan-workflow` runs.
- All declared components appear in `Workflow.declared*`.
