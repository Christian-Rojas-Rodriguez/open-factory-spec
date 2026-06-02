#!/usr/bin/env bash
# post-merge-bump — git post-merge hook (Task 0004).
# After a merge, patch-bumps `version` in the frontmatter of every Task spec that
# changed in the merge, and records it as a dedicated commit. Side effect only —
# never blocks.
#
# Hook input: none (compares against HEAD~1). Output: exit 0 always.
set -u
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$REPO_ROOT" || exit 0

opftr() {
  if [ -f packages/cli/dist/index.js ]; then node packages/cli/dist/index.js "$@";
  elif [ -x node_modules/.bin/opftr ]; then node_modules/.bin/opftr "$@";
  else npx --yes opftr "$@"; fi
}

opftr audit --bump --since HEAD~1 --write >&2 || exit 0

if ! git diff --quiet -- .claude/specs/tasks/ 2>/dev/null; then
  git add .claude/specs/tasks/
  git commit -m "chore(spec): bump Spec versions after merge $(git rev-parse --short HEAD)" >&2 || true
fi
exit 0
