---
version: 0.1.0
status: approved
prd: .claude/specs/prd.md
---

# RFC: open-factory-spec — Diseño técnico de la factory POA

| Campo | Valor |
|---|---|
| **Autor(es)** | Christian Rojas |
| **Revisores** | — |
| **PRD relacionado** | [.claude/specs/prd.md](.claude/specs/prd.md) |

## §1. Resumen

Este RFC describe la arquitectura técnica de `open-factory-spec`: el modelo POA (Programación Orientada a Agentes), la granularidad de tasks, la descomposición en 31 Tasks (0001-0031), y la declaración completa de agents/skills/hooks/commands que forman la factory base.

## §2. Contexto y motivación

No existía un sistema disciplinado para bootstrapear proyectos Claude Code con spec-as-source. Ver PRD §2. El diseño parte de dos ideas combinadas: SDD (paper arxiv:2602.00180 §II-C) y POA — los componentes ejecutables son objetos de primera clase con `name`, `permissions` mínimas y `objective`.

## §3. Goals / Non-goals

**Goals:**
- Definir un modelo POA claro (Agent, Skill, Command, Hook, MCP) con contratos explícitos.
- Estructurar el Bootstrap como dos reviews humanas separadas (PRD → RFC) antes de derivar el Workflow.
- Garantizar que `workflow.md` sea derivable desde el RFC y sirva como declarante soberano en tiempo de ejecución.
- Proveer 29+2 Tasks con granularidad 1 Task = 1 componente POA, ordenadas por dependencia.

**Non-goals:**
- No definir la implementación interna de cada skill (eso vive en cada Task spec).
- No imponer frameworks de testing ni MCPs específicos.

## §4. Diseño propuesto

### Modelo POA

Cinco primitivas, cada una con `name`, `permissions` (mínimas) y `objective`:

| Primitiva | Archivo | Naturaleza |
|---|---|---|
| `Agent` | `.claude/agents/<n>.md` | Subagent de Claude Code (YAML frontmatter + markdown body) |
| `Skill` | `.claude/skills/<n>/SKILL.md` | Capacidad invocable por prompt o comando |
| `Command` | `.claude/commands/<n>.md` | Punto de entrada explícito `/comando` |
| `Hook` | `.claude/hooks/<n>.{sh,py}` + `settings.json` | Disparador determinístico por evento |
| `MCP` | `.mcp.json` o inline en Agent | Conector externo (no incluido en factory base) |

### Flujo de Bootstrap (UC-1)

```
/factory-init "<desc>"
  researcher → hallazgos de dominio + stack
  planner
    Skill(draft-prd) → PRD → Gate 1: User aprueba
    Skill(draft-rfc) → RFC (§7 granularidad + §8 POA) → Gate 2: User aprueba
    Skill(plan-workflow) → deriva workflow.md desde RFC §7+§8
  specter → materializa prd.md + rfc.md + workflow.md + constitution.md + skeletons
```

### Capas y colores

| Capa | Color | Agents |
|---|---|---|
| Bootstrap | orange | planner |
| Specify | blue | curator, specter |
| Plan | purple | qa |
| Implement | green | coder, reviewer |
| Validate | red | tester, pr, auditor |
| Transversales | cyan / red | researcher, architect |

### Distribución

- **Fase B (actual):** `@open-factory/cli` (`opftr` bin). Scaffoldea `.claude/` completo desde templates sincronizados con el source tree.
- Templates → `packages/cli/templates/.claude/` vía `scripts/sync-templates.mjs` (copia ALLOWLIST desde root).
- **Fase D (futura):** monorepo `@open-factory/core` + `@open-factory/cli` + `@open-factory/plugin`.

## §5. Alternativas consideradas

| Opción | Pros | Contras | Decisión |
|---|---|---|---|
| Un solo `workflow.md` como único artefacto de Bootstrap | Simple, un archivo | Mezcla producto + técnico + POA; difícil de revisar por separado | Descartado — se adopta PRD+RFC+workflow derivado |
| Plugin de Claude Code (Opción D) como distribución inicial | Sin CLI externa | No soporta `permissionMode` ni `hooks` por-agent todavía | Fase futura (Opción D); CLI primero |
| Una Task por capa (ej. "todos los agents de Specify en una Task") | Menos Tasks | PRs irrevisables; versionado de Specs ingobernable | Descartado — granularidad 1 Task = 1 componente |

## §6. Impacto transversal

- **Seguridad:** permisos mínimos por defecto; `permissions-guard` hook warnea violaciones al boot; `pre-spec-validate` bloquea specs sin What/Why/How.
- **Performance:** N/A — la factory es archivos markdown + scripts bash/python; sin hot path de producción.
- **Observabilidad:** hooks de git (`pre-commit-contract`, `post-merge-bump`) proveen trazabilidad en el historial de commits. `agent-memory/` persiste aprendizajes institucionales.
- **Backward compatibility:** `workflow.md` sigue siendo el declarante soberano; `prd.md` y `rfc.md` son aditivos. Proyectos que no tienen PRD/RFC todavía son válidos (degradación graceful).

## §7. Granularidad y descomposición en Tasks

Estrategia de granularidad elegida: `1 Task = 1 componente POA`

**Justificación:** la factory es meta-tooling donde cada primitiva tiene contrato propio y es testeable en aislamiento. Granularidades más gruesas harían los PRs irrevisables y el versionado de Specs ingobernable.

| id | slug | scope |
|---|---|---|
| 0001 | settings-permissions-guard | `.claude/settings.json` + hook `permissions-guard` |
| 0002 | pre-spec-validate | Hook que bloquea specs sin What/Why/How |
| 0003 | pre-commit-contract | Hook git que bloquea commits fuera de scope |
| 0004 | post-merge-bump | Hook git que bumpea `Spec.version` al merge |
| 0005 | researcher-agent | Agent `researcher` (cyan, plan-only) |
| 0006 | architect-agent | Agent `architect` (red, orquestador) |
| 0007 | planner-agent | Agent `planner` (orange, Bootstrap) |
| 0008 | plan-workflow-skill | Skill `plan-workflow` (deriva workflow.md desde RFC) |
| 0009 | propose-agents-skill | Skill `propose-agents` (catálogo POA para RFC §8) |
| 0010 | research-topic-skill | Skill `research-topic` |
| 0011 | curator-agent | Agent `curator` (blue, Specify) |
| 0012 | polish-idea-skill | Skill `polish-idea` |
| 0013 | specter-agent | Agent `specter` (blue, materializa specs) |
| 0014 | write-spec-skill | Skill `write-spec` |
| 0015 | qa-agent | Agent `qa` (purple, Plan) |
| 0016 | spec-lint-skill | Skill `spec-lint` |
| 0017 | author-tests-skill | Skill `author-tests` |
| 0018 | coder-agent | Agent `coder` (green, Implement) |
| 0019 | reviewer-agent | Agent `reviewer` (green, Implement) |
| 0020 | tester-agent | Agent `tester` (red, Validate) |
| 0021 | pr-agent | Agent `pr` (red, Validate) |
| 0022 | auditor-agent | Agent `auditor` (red, Validate) |
| 0023 | verify-contract-skill | Skill `verify-contract` |
| 0024 | factory-init-command | Command `/factory-init` (UC-1) |
| 0025 | workflow-review-command | Command `/workflow-review` |
| 0026 | task-run-command | Command `/task-run` (UC-2) |
| 0027 | agent-new-command | Command `/agent-new` (UC-4) |
| 0028 | spec-new-command | Command `/spec-new` |
| 0029 | spec-bump-command | Command `/spec-bump` |
| 0030 | draft-prd-skill | Skill `draft-prd` (interview PRD, Gate 1 Bootstrap) |
| 0031 | draft-rfc-skill | Skill `draft-rfc` (interview RFC, Gate 2 Bootstrap) |

## §8. Declaración POA

> Estas tablas son la fuente que `plan-workflow` usa para derivar `workflow.md`.

### Agents

| # | Agent | Capa | Color | Task |
|---|---|---|---|---|
| 1 | `researcher` | Transversal | `cyan` | 0005 |
| 2 | `architect` | Cross-cutting | `red` | 0006 |
| 3 | `planner` | Bootstrap | `orange` | 0007 |
| 4 | `curator` | Specify | `blue` | 0011 |
| 5 | `specter` | Specify | `blue` | 0013 |
| 6 | `qa` | Plan | `purple` | 0015 |
| 7 | `coder` | Implement | `green` | 0018 |
| 8 | `reviewer` | Implement | `green` | 0019 |
| 9 | `tester` | Validate | `red` | 0020 |
| 10 | `pr` | Validate | `red` | 0021 |
| 11 | `auditor` | Validate | `red` | 0022 |

### Skills

| # | Skill | Usada por | Task | `disable-model-invocation` |
|---|---|---|---|---|
| 1 | `research-topic` | researcher | 0010 | no |
| 2 | `draft-prd` | planner | 0030 | sí |
| 3 | `draft-rfc` | planner | 0031 | sí |
| 4 | `plan-workflow` | planner | 0008 | sí |
| 5 | `propose-agents` | planner (vía draft-rfc) | 0009 | sí |
| 6 | `polish-idea` | curator | 0012 | no |
| 7 | `write-spec` | specter | 0014 | sí |
| 8 | `spec-lint` | qa | 0016 | sí |
| 9 | `author-tests` | qa | 0017 | sí |
| 10 | `verify-contract` | auditor | 0023 | sí |

### Hooks

| # | Hook | Evento | Task | Bloqueante |
|---|---|---|---|---|
| 1 | `permissions-guard` | `SessionStart` | 0001 | warn (no block) |
| 2 | `pre-spec-validate` | `PreToolUse(Write)` sobre `.claude/specs/tasks/**` | 0002 | sí (exit 2) |
| 3 | `pre-commit-contract` | git pre-commit | 0003 | sí (exit 2) |
| 4 | `post-merge-bump` | git post-merge | 0004 | no (efecto) |

### Commands

| # | Command | Use case | Task |
|---|---|---|---|
| 1 | `/factory-init` | UC-1 Bootstrap (PRD → RFC → Workflow → materializar) | 0024 |
| 2 | `/workflow-review` | Re-abre Workflow | 0025 |
| 3 | `/task-run` | UC-2 | 0026 |
| 4 | `/agent-new` | UC-4 | 0027 |
| 5 | `/spec-new` | Crea esqueleto de Spec | 0028 |
| 6 | `/spec-bump` | Bumpea versión | 0029 |

### MCPs

`Ninguno en la factory base`. Los MCPs son responsabilidad de los Agents de dominio.

## §9. Plan de testing

- **Unit:** smoke-tests de matching de `description` (invocation-fixtures.md) por cada agent/skill. Tests de scripts Python de skills con efectos (pytest).
- **Integration:** test de que `/factory-init` escribe los artefactos correctos y en el orden correcto; test de que `pre-spec-validate` bloquea specs incompletas.
- **Acceptance:** ciclo UC-1 completo sobre un proyecto de ejemplo; ciclo UC-2 completo para Task 0005.

## §10. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Bootstrap recursivo — la factory se construye con sí misma | Alta (inherente) | Alto | Tasks 0001-0006 se materializan a mano; recién desde 0007 se usa `/task-run` real |
| Descriptions que no disparan (matching falla) | Media | Medio | invocation-fixtures.md como regresión; smoke-test en cada PR que toca un `description` |
| Tests de agents (¿cómo se testea un Agent?) | Media | Medio | Smoke-tests por prompt (matching) + ejecución de Skills aisladas con pytest |

## §11. Preguntas abiertas

- [ ] ¿El hook `pre-spec-validate` debe validar también `prd.md` y `rfc.md` o solo `tasks/**`?
- [ ] ¿Se necesita un comando `/prd-review` / `/rfc-review` separado de `/factory-init` para re-abrir el PRD/RFC post-Bootstrap?
