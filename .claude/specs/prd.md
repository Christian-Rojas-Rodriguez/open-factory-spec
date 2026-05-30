---
version: 0.1.0
status: approved
---

# PRD: open-factory-spec — Factory de Agentes para Claude Code

| Campo | Valor |
|---|---|
| **Autor** | Christian Rojas |
| **Stakeholders** | Equipos de ingeniería que adoptan Claude Code como runtime de agentes |
| **Target release** | v0.1.0 (Blueprint inicial) |

## §1. TL;DR

`open-factory-spec` es una factory de agentes para Claude Code que implementa SDD spec-as-source + POA (Programación Orientada a Agentes). Permite a cualquier proyecto bootstrapearse con un conjunto base de agentes, skills, hooks y commands listos para usar, más un flujo de trabajo disciplinado donde los humanos solo editan specs y los agentes escriben el código.

## §2. Problema

- **¿Qué problema resolvemos?** Proyectos que adoptan Claude Code terminan con agentes ad-hoc, sin contratos, sin tests y sin forma de auditar que el código corresponde a lo especificado. El "spec drift" es silencioso: nadie sabe qué fue diseñado vs. qué fue improvisado.
- **¿Cómo lo sabemos?** Experiencia directa: iniciar un proyecto con Claude Code desde cero requiere decidir a mano la granularidad, qué agentes crear, cómo versionar las specs, y cómo evitar que los agentes tomen decisiones que deberían ser humanas.
- **¿A quién le pasa?** Ingenieros/equipos que quieren usar Claude Code para automatizar desarrollo pero necesitan disciplina y trazabilidad desde el día 0.

## §3. Objetivos y métricas de éxito

**Goals:**
- Proveer una factory scaffoldeable (`opftr init`) que deje un proyecto con un conjunto base de agentes/skills/hooks/commands funcionales y un flujo PRD → RFC → Specs.
- Garantizar que toda diff de código tenga una diff de Spec correspondiente (spec-as-source invariant).
- Hacer el Bootstrap tan claro y estructurado que cualquier equipo pueda adoptarlo sin fricción.

**No-goals:**
- No imponer un framework de testing específico (cada proyecto elige el suyo).
- No proveer MCPs; los agents de dominio los declaran.
- No reemplazar la revisión humana de código: los humanos aprueban PRs.

**Métricas:**
- North star: proyectos que adoptan la factory tienen 0 "código sin spec" al momento de su primer PR de dominio.
- Guardrails: el hook `pre-commit-contract` nunca se deshabilita en producción; el Auditor siempre es el gate de merge.

## §4. Usuarios y casos de uso

**Persona principal:** Ingeniero/líder técnico que bootstrapea un nuevo proyecto y quiere adoptar Claude Code con disciplina desde el día 0.

**User stories:**
- Como ingeniero, quiero correr `opftr init` y tener un proyecto con agentes POA listos, para no tener que decidir la arquitectura de agentes desde cero.
- Como ingeniero, quiero que el Bootstrap me guíe a través de un PRD y luego un RFC antes de generar las specs, para que el proyecto tenga claridad de producto y técnica antes de codear.
- Como lead técnico, quiero que ningún commit pase si hay código fuera del scope de una spec, para mantener la trazabilidad intacta.
- Como contribuidor, quiero que los agentes sean invocables por frases naturales, para no tener que recordar nombres de comandos.

## §5. Requisitos

### P0 — Must have
- `opftr init` scaffoldea `.claude/` con todos los agents/skills/hooks/commands base y los templates PRD/RFC.
- Bootstrap flow: `/factory-init` conduce PRD interview (Gate 1) → RFC interview (Gate 2) → deriva `workflow.md` → materializa specs.
- Hook `pre-spec-validate` bloquea cualquier spec sin What/Why/How.
- Hook `pre-commit-contract` bloquea commits con código fuera de scope de specs activas.
- Auditor valida equivalencia Spec↔Código en cada PR y bumpea `Spec.version` al merge.
- Todos los componentes POA tienen `name`, `permissions` mínimas y `objective` explícito.

### P1 — Should have
- Templates PRD y RFC canónicos en `.claude/specs/templates/`.
- `opftr update` para actualizar agentes/skills/hooks de proyectos existentes sin pisar specs de tasks.
- `invocation-fixtures.md` con smoke-tests de matching de descriptions.

### P2 — Nice to have
- Monorepo `@open-factory/core` + `@open-factory/plugin` (Opción D, fase futura).
- Playbooks por dominio (ML, Backend, Frontend) en SPEC §9.

## §6. Experiencia de usuario

**Flujo principal (usuario nuevo):**
1. `npx opftr init <target-dir>` — selecciona providers por fase (spec/code/review), scaffoldea `.claude/`.
2. `/factory-init "<descripción del proyecto>"` — Planner conduce PRD interview, User aprueba, luego RFC interview, User aprueba, Specter materializa.
3. `/task-run 0001` — ciclo SDD por task: curator → specter → qa → coder → reviewer → tester → pr → auditor.

**Edge cases:**
- Bootstrap recursivo (la factory se construye con sí misma): mitigado corriendo Tasks 0001-0006 a mano primero.
- Target dir = source tree: `opftr init` rechaza con error a menos que se pase `--force`.

## §7. Dependencias y riesgos

| Dependencia | Equipo/sistema | Riesgo | Mitigación |
|---|---|---|---|
| Claude Code subagents | Anthropic | Breaking changes en el formato de frontmatter de agents | Pin major de Claude Code; tests smoke de descriptions |
| `Skill(disable-model-invocation)` | Anthropic | La flag no se respeta en futuras versiones | Monitorear changelog; skills críticas tienen `disable-model-invocation: true` |
| Matching por `description` | Anthropic | Cambios en el algoritmo de matching | invocation-fixtures.md como regresión smoke |

## §8. Rollout

- **Fase B (actual):** paquete `@open-factory/cli` distribuido vía npm/pnpm. Scaffoldea `.claude/` completo.
- **Fase D (futura):** monorepo con `@open-factory/core` (tipos + validadores), `@open-factory/cli` y `@open-factory/plugin`. Plugin distribuye lo que tolera plugin-level; CLI sigue generando lo que requiere campos por-agent restringidos.

## §9. Preguntas abiertas

- [ ] ¿Se necesita un dashboard/UI para visualizar el estado de Tasks? (actualmente todo es CLI/terminal)
- [ ] ¿Cómo se maneja el Bootstrap cuando el proyecto ya tiene código existente y no es greenfield?
