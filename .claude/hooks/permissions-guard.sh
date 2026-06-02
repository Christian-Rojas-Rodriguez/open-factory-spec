#!/usr/bin/env bash
# permissions-guard — SessionStart hook (Task 0001).
# Read-only least-privilege audit of .claude/{skills,hooks,settings.json}.
# Warns on stderr; NEVER blocks (always exit 0).
#
# Hook input (stdin, JSON): { "session_id": "...", "cwd": "..." }
set -u
cat >/dev/null 2>&1 || true  # drain stdin if present
DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude"
[ -d "$DIR" ] || exit 0

warns=0

# 1. Skills that wield effectful tools must opt out of model auto-invocation.
for skill in "$DIR"/skills/*/SKILL.md; do
  [ -f "$skill" ] || continue
  if grep -qiE 'allowed-tools:.*(Write|Edit|Bash)' "$skill" \
     && ! grep -qi 'disable-model-invocation: *true' "$skill"; then
    printf "[permissions-guard] warn: %s has write/exec tools but no 'disable-model-invocation: true'\n" \
      "${skill#"$DIR"/}" >&2
    warns=$((warns + 1))
  fi
done

# 2. Hooks referenced in settings.json must have a script on disk.
if [ -f "$DIR/settings.json" ]; then
  for h in permissions-guard pre-spec-validate pre-commit-contract post-merge-bump; do
    if grep -q "$h" "$DIR/settings.json" && [ ! -f "$DIR/hooks/$h.sh" ]; then
      printf "[permissions-guard] warn: hook '%s' is registered but %s/hooks/%s.sh is missing\n" \
        "$h" "$DIR" "$h" >&2
      warns=$((warns + 1))
    fi
  done
fi

if [ "$warns" -eq 0 ]; then
  printf "[permissions-guard] ok — no least-privilege smells detected.\n" >&2
fi
exit 0
