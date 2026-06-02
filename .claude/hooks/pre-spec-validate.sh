#!/usr/bin/env bash
# pre-spec-validate — PreToolUse hook on Write under .claude/specs/tasks/** (Task 0002).
# Delegates to `opftr spec-lint`: blocks (exit 2) Spec writes that miss required
# frontmatter keys or sections, carry a non-SemVer version, or have empty
# acceptance criteria. The workflow cross-link check is skipped here (the file
# isn't on disk yet); pre-commit-contract / the Auditor cover it.
#
# Hook input (stdin, JSON): { "tool_input": { "file_path": "...", "content": "..." } }
# Hook output: exit 0 to allow, exit 2 to block (reason on stderr).
set -u
INPUT=$(cat)
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" 2>/dev/null || true

field() {
  printf "%s" "$INPUT" | python3 -c \
    "import sys,json;print(json.load(sys.stdin).get('tool_input',{}).get('$1',''))" 2>/dev/null
}
FILE_PATH=$(field file_path)
CONTENT=$(field content)

case "$FILE_PATH" in
  *".claude/specs/tasks/"*".md") ;;
  *) exit 0 ;;  # not a Task spec write — pass through
esac
[ -z "$CONTENT" ] && exit 0  # partial edit / nothing to validate

opftr() {
  if [ -f packages/cli/dist/index.js ]; then node packages/cli/dist/index.js "$@";
  elif [ -x node_modules/.bin/opftr ]; then node_modules/.bin/opftr "$@";
  else npx --yes opftr "$@"; fi
}

TMP=$(mktemp -d)
TMPFILE="$TMP/$(basename "$FILE_PATH")"
printf "%s" "$CONTENT" > "$TMPFILE"
opftr spec-lint "$TMPFILE" >&2
CODE=$?
rm -rf "$TMP"

if [ "$CODE" -ne 0 ]; then
  printf "[pre-spec-validate] blocked — fix the spec issues above before writing.\n" >&2
  exit 2
fi
exit 0
