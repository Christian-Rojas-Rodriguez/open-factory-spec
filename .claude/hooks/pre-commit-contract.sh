#!/usr/bin/env bash
# pre-commit-contract — git pre-commit hook (Task 0003).
# Delegates to `opftr audit --check`: rejects any commit whose staged diff touches
# a POA component (.claude/agents|skills|commands|hooks) outside every active
# Spec's scope, or that leaves an active Spec without a test.
#
# Hook input: none (reads `git diff --cached`). Output: exit 0 pass, exit 2 block.
set -u
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$REPO_ROOT" || exit 0

CHANGED=$(git diff --cached --name-only --diff-filter=ACMRTUXB)
[ -z "$CHANGED" ] && exit 0

opftr() {
  if [ -f packages/cli/dist/index.js ]; then node packages/cli/dist/index.js "$@";
  elif [ -x node_modules/.bin/opftr ]; then node_modules/.bin/opftr "$@";
  else npx --yes opftr "$@"; fi
}

if ! opftr audit --check >&2; then
  printf "[pre-commit-contract] commit blocked by the spec-as-source contract.\n" >&2
  exit 2
fi
exit 0
