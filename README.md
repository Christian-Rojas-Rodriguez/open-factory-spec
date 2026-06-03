<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/banner-dark.svg">
  <img alt="open/factory — an agent factory for spec-driven software" src=".github/assets/banner-light.svg" width="100%">
</picture>

<br />
<br />

<p><strong>An agent factory for Claude Code.</strong><br />
<code>npx opftr init</code> drops a spec-as-source <code>.claude/</code> factory — an agent roster, a 5-level contract, and hooks that actually enforce it — into your project.</p>

[![npm](https://img.shields.io/npm/v/opftr?style=flat-square&label=npm)](https://www.npmjs.com/package/opftr)
[![CI](https://img.shields.io/github/actions/workflow/status/Christian-Rojas-Rodriguez/open-factory-spec/ci.yml?style=flat-square&label=ci)](https://github.com/Christian-Rojas-Rodriguez/open-factory-spec/actions)
[![License](https://img.shields.io/github/license/Christian-Rojas-Rodriguez/open-factory-spec?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen?style=flat-square)](https://nodejs.org)

</div>

---

> ### ⚠️ Status: early — Milestone A
> The factory is still bootstrapping **itself**. What works today is honest and small:
> the **`architect`** orchestrator and **`researcher`** agent are implemented, and the
> **spec↔code contract is enforced for real** by `opftr spec-lint` + `opftr audit` behind
> the git/Claude-Code hooks. The other agents ship as reviewed definitions but aren't
> individually spec'd and battle-tested yet, and most skills are still skeletons. See
> [Roadmap](#roadmap). This is **for early adopters**, not production.

---

Our philosophy:

```text
→ specs before code, always
→ agents write code, humans edit specs & approve PRs
→ every code diff traces to a spec diff (enforced, not regenerated)
→ composition over inheritance
→ least privilege by default
```

Targets **Claude Code** only. (Earlier multi-tool mirrors were dropped to go deeper on one platform.)

---

## Quick start

**Requires Node ≥ 20.** In your project:

```bash
npx opftr init
```

That writes exactly three things into the current directory:

```
.claude/              the factory (agents, skills, commands, hooks, specs)
CLAUDE.md             project memory loaded by Claude Code each session
opftr.config.json     { "version": "…" }  — lets `opftr update` upgrade you later
```

Then open Claude Code in the same directory and bootstrap your project:

```text
/factory-init "your project description"
```

### What actually runs today

The enforcement layer is real — you can see it block bad work:

```text
# In Claude Code, an agent tries to write an incomplete Task spec:
[pre-spec-validate] block  frontmatter missing required key: scope
[pre-spec-validate] block  missing required section: ## Why
[pre-spec-validate] blocked — fix the spec issues above before writing.

# At commit time, a POA component with no governing spec is rejected:
$ git commit
  block  scope: .claude/agents/ghost.md is a POA component not covered by any Spec's scope
[pre-commit-contract] commit blocked by the spec-as-source contract.
```

You can run the same checks by hand:

```bash
npx opftr spec-lint .claude/specs/tasks/0001-my-task.md   # exit 2 if malformed
npx opftr audit --check                                   # exit 2 on contract violation
```

---

## How it works

Open Factory combines two disciplines:

**SDD — Spec-Driven Development.** Humans edit the spec and approve the PR; agents write
the code. The factory does **not** regenerate the codebase from the spec — agents edit
incrementally, and *correspondence* is enforced: every changed component must trace to a
Spec's `scope`, and every active Spec must have a test.

**POA — Agent-Oriented Programming.** Every component (Agent, Skill, Command, Hook) is a
first-class object with a `name`, minimal `permissions`, and one `objective`.

### The contract — and how it's enforced

| Invariant | Enforced by |
|---|---|
| Every Task spec is well-formed (frontmatter, sections, SemVer, testable criteria) | `opftr spec-lint` ← `pre-spec-validate` hook |
| Every changed POA component is inside some active Spec's `scope` | `opftr audit --check` ← `pre-commit-contract` hook |
| Every active Spec has a test | `opftr audit --check` |
| `Spec.version` is bumped on merge | `opftr audit --bump` ← `post-merge-bump` hook |
| Least-privilege smells are surfaced | `permissions-guard` hook (SessionStart) |

Wire the git hooks into your repo with:

```bash
pnpm run git-hooks:install   # links pre-commit-contract + post-merge-bump
```

---

## Agents

| Agent | Layer | Color | Objective |
|---|---|---|---|
| `architect` | Cross-cutting | orange | Orchestrate UC-1/2/4 end-to-end |
| `researcher` | Transversal | orange | Research domain / stack / codebase |
| `planner` | Bootstrap | orange | Define Workflow, granularity, Tasks |
| `curator` | Specify | orange | Polish What/Why/How per Task |
| `specter` | Specify | orange | Materialize versioned Spec to disk |
| `qa` | Plan | orange | Lint Spec · author 3-level failing tests |
| `coder` | Implement | orange | Implement until the QA suite passes |
| `reviewer` | Implement | orange | Review diff against Spec scope |
| `tester` | Validate | orange | Run the test suite · report |
| `pr` | Validate | orange | Open the pull request |
| `auditor` | Validate | orange | Validate Spec↔Code · bump version |

> **Implemented & exercised today:** `architect`, `researcher`.
> The rest are reviewed definitions on the roadmap to being spec'd + tested.

---

## CLI

```text
opftr init [dir]          Scaffold .claude/ + CLAUDE.md + opftr.config.json
opftr update [dir]        Update factory files; never touches your specs or CLAUDE.md
opftr spec-lint <file>    Validate a Task spec (exit 2 if blocking)
opftr audit --check       Enforce scope + coverage on staged changes (exit 2 on violation)
opftr audit --bump --since <ref>   Propose/apply SemVer bumps for changed Task specs
```

---

## Repo layout

```
open-factory-spec/
├── .claude/                    ← the factory (source of truth for templates)
│   ├── agents/                 ← agent definitions
│   ├── skills/ commands/ hooks/
│   ├── specs/                  ← constitution · workflow · tasks · diagrams
│   └── settings.json           ← hook registry
├── CLAUDE.md                   ← project memory loaded by Claude Code
└── packages/cli/               ← opftr (zero runtime deps)
    ├── src/                    ← init · update · spec-lint · audit
    ├── scripts/sync-templates.mjs
    └── templates/              ← synced snapshot of .claude/ + CLAUDE.md (gitignored)
```

> The `.claude/` directory at the root **is** the template. The CLI ships a synced
> snapshot in `packages/cli/templates/`. One source of truth, zero duplication.

---

## Development

```bash
corepack enable          # activate pnpm if needed
pnpm install
pnpm -r build            # sync templates + compile CLI
pnpm test                # CLI tests (dist) + factory tests (.claude/)
node packages/cli/dist/index.js init ./tmp-test   # smoke-test
```

When you edit `.claude/` or `CLAUDE.md`, re-sync before testing: `pnpm sync`
(`build`, `test`, and `prepack` all run it automatically).

---

## Roadmap

| Milestone | Tasks | What it unlocks |
|---|---|---|
| **A — Foundation** *(current)* | 0001–0006 | 4 enforcement hooks + `researcher` + `architect` · factory can use itself |
| **B — Specify** | 0007–0014 | `planner` + `curator` + `specter` · UC-1 fully runnable |
| **C — Implement** | 0015–0019 | `qa` + `coder` + `reviewer` · UC-2 runnable to code |
| **D — Validate** | 0020–0029 | `tester` + `auditor` + `pr` + the 6 commands · UC-1..4 complete |

**Done so far:** Claude-Code-only focus, the `architect` orchestrator, real
`spec-lint`/`audit` enforcement behind all four hooks, CI on Node 20/22.

---

## Contributing

**Small fixes** — typos, clarifications — submit directly as a PR.

**Larger changes** — new agents, new skills, architectural changes — open an issue first
so we can align on spec before any code is written. (Yes, we dogfood the process.)

**AI-generated code is welcome** — mention the agent and model used in the PR description.

---

## License

MIT © Christian Rojas Rodriguez
