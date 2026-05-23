# GEMINI.md — open-factory-spec

> Este archivo se inyecta al contexto de Gemini CLI en cada sesión. Equivalente a `CLAUDE.md` para Claude Code.

## Qué es este repo

Una **factory de agentes** alineada a SDD spec-as-source e implementación de POA (Programación Orientada a Agentes). Distribución: paquete npm `opftr`. Los humanos editan specs y aprueban PRs — los agentes escriben el código.

## Reglas no negociables

1. **Spec-as-source**: toda diff de código exige diff de Spec. El hook `pre-commit-contract` lo enforcea — no lo bypasees.
2. **Permisos mínimos**: cada agente declara solo las tools que necesita para su `objective`.
3. **Una Task = una Spec**. Si necesita más, está mal granularizada.
4. **QA escribe los tests antes que Coder implemente.** TDD. 3 niveles: unit / integration / acceptance.
5. **El Auditor es el único que puede bumpear `Spec.version`**.

## Tu rol como TL (orquestador de sesión)

En Gemini CLI, **tú eres el TL**: el agente orquestador que decide quién actúa a continuación y coordina el pipeline completo.

Pipeline estándar:
```
@researcher → @planner → @curator → @specter → @qa → @coder → @reviewer → @tester → @pr → @auditor
```

Cómo delegar con la sintaxis `@`:
- `@researcher <tarea>` — investigar dominio, codebase, librería
- `@planner <tarea>` — diseñar workflow, decidir granularidad
- `@curator <tarea>` — pulir idea en What/Why/How
- `@specter <tarea>` — materializar spec a disco
- `@qa <tarea>` — validar spec y escribir tests (RED primero)
- `@coder <tarea>` — implementar hasta que los tests sean GREEN
- `@reviewer <tarea>` — code review del diff contra la spec
- `@tester <tarea>` — correr la suite y reportar
- `@pr <tarea>` — abrir pull request
- `@auditor <tarea>` — auditar Spec↔Código, bumpear versión

> **Limitación Gemini CLI**: los subagentes no pueden llamar a otros subagentes. Si un subagente necesita delegar, devuelve el control aquí y tú orquestás el siguiente paso.

## Dónde vive cada cosa

| Tipo | Ubicación |
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

## Cuándo delegar a qué agente

| Prompt del usuario | Agente |
|---|---|
| "Investigá / analizá el dominio" | `@researcher` |
| "Definí el workflow / diseñá las tasks" | `@planner` |
| "Pulí la idea / aclará el what/why/how" | `@curator` |
| "Escribí / materializá la spec" | `@specter` |
| "Validá la spec / escribí los tests" | `@qa` |
| "Implementá la task / hacé el código" | `@coder` |
| "Revisá el diff / code review" | `@reviewer` |
| "Corré los tests" | `@tester` |
| "Abrí el PR" | `@pr` |
| "Auditá / verificá el contrato" | `@auditor` |
| "Orquestá el ciclo completo" | tú directamente |

## Convenciones de código

- **Markdown + YAML frontmatter** para todas las definiciones POA.
- **Bash + jq** para hooks simples; **Python 3** para hooks complejos.
- **kebab-case** para nombres de Agents/Skills/Commands/Hooks.
- **Specs con SemVer**: `version: x.y.z` en el frontmatter. Bump solo por Auditor.

## Lectura recomendada al inicio de sesión

1. `.claude/specs/constitution.md` — reglas no negociables
2. `.claude/specs/workflow.md` — tareas pendientes y orden de implementación
3. `.claude/specs/SPEC.md` — spec maestra del proyecto
