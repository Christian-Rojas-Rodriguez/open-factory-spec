---
description: Draft a PRD (Product Requirements Document) for a new project by conducting a structured product interview. Use during Bootstrap (UC-1) after researcher has surveyed the domain. Input: description + researcher findings. Output: filled PRD using the canonical template at .claude/specs/templates/prd.md.
disable-model-invocation: true
allowed-tools: Read
---

> Skeleton — full behavior is implemented in Task 0030.

# draft-prd

Conduct a product-layer interview and render a filled PRD in the canonical format.

## Inputs

- Project description (raw intent from the user).
- Domain summary (from `researcher`).
- Stack summary (from `researcher`).
- Template: `.claude/specs/templates/prd.md`.

## Interview guide

Derive questions from the template sections. For each section where context is missing or ambiguous, surface one focused question. Prefer to infer from the project description and researcher findings; ask only when genuinely ambiguous.

| Section | Key question to resolve |
|---|---|
| §1 TL;DR | ¿Cuál es el resultado en una línea para el usuario? |
| §2 Problema | ¿Qué pain/gap motiva esto? ¿Qué evidencia existe? |
| §3 Objetivos | ¿Cómo se ve el éxito? ¿Qué no debería empeorar? |
| §4 Usuarios | ¿Quién es el usuario primario? ¿Hay usuarios secundarios? |
| §5 Requisitos | ¿Qué es no-negociable (P0)? ¿Qué puede esperar (P1/P2)? |
| §6 UX | ¿Hay flujos conocidos, wireframes o productos de referencia? |
| §7 Dependencias | ¿Qué sistemas o equipos externos toca esto? |
| §8 Rollout | ¿Fases? ¿Feature flags? ¿Corte duro? |

## Output

A filled `.claude/specs/templates/prd.md`-shaped Markdown document:

```markdown
---
version: 0.1.0
status: draft
---

# PRD: <title>
...
## §9. Preguntas abiertas
- [ ] <anything unresolved>
```

## Operating rules

- The PRD captures **What and Why only** — no task decomposition, no implementation decisions, no agent/skill declarations. Those live in the RFC.
- Do not fabricate data, metrics, or personas. Leave the cell empty and add an `Open question` instead.
- If the user's description already answers a section fully, skip that interview question.
- Mark all sections attempted; an empty section with `TBD` is only allowed if paired with an explicit `Open question`.
- This skill is `disable-model-invocation: true` because the final PRD must be reviewed and approved by the User before anything is written to disk.
