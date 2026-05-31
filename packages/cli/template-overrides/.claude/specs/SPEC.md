# SPEC — [Your Project]

> Master spec for this project. Generated and maintained after running `/factory-init`.
>
> This file consolidates the principles from [`constitution.md`](./constitution.md), the POA model from [`diagrams/poa-class.md`](./diagrams/poa-class.md), the use cases from [`diagrams/sequences.md`](./diagrams/sequences.md), and the implementation plan from [`workflow.md`](./workflow.md).

---

Run `/factory-init "[your project description]"` in Claude Code to generate the full master spec for your project through the two-gate Bootstrap process (PRD → RFC → Workflow).

Once generated, this file will contain:

- **§1 — Purpose and scope**: what this project is and what it does.
- **§2 — POA model**: the primitives (Agent, Skill, Command, Hook, MCP) and their invariants.
- **§3 — Use cases**: UC-1 (Bootstrap), UC-2 (Spec cycle), UC-4 (Add component).
- **§4 — Agent catalog**: all declared agents with their layer and objective.
- **§5 — Skill catalog**: all declared skills with their trigger and `disable-model-invocation` flag.
- **§6 — Hook catalog**: all declared hooks with their event and blocking behavior.
- **§7 — Command catalog**: all declared commands with their use case.
- **§8 — Testing strategy**: test runner, coverage gate, and 3-level structure.
- **§9 and beyond**: additional project-specific sections from the RFC.
