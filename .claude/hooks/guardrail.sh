#!/usr/bin/env bash
#
# guardrail.sh — PreToolUse safety net for autonomous / bypass-permissions runs.
#
# In bypass-permissions mode Claude Code no longer prompts before tool calls,
# so this hook is the enforcement layer. It runs before every Bash, Write, and
# Edit call, inspects the request, and returns permissionDecision "deny" for
# anything destructive or security-sensitive. Everything not matched here is
# allowed to proceed — so Claude can still read, search, run tests/builds,
# install project deps, stage files, and make local commits without a human.
#
# Enforcement is done in-script (not via the hook `if` filter, which the docs
# note is best-effort and fails open on unparseable commands). Patterns use `.`
# (grep is line-oriented) rather than [^\n], which grep misreads as "not n".
#
# Requires: jq.

set -euo pipefail

INPUT="$(cat)"
TOOL="$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')"

deny() {
  jq -n --arg r "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $r
    }
  }'
  exit 0
}

# ── Bash command policy ─────────────────────────────────────────────────────
if [ "$TOOL" = "Bash" ]; then
  CMD="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')"

  # Each entry: "<extended-regex>|||<reason>". Matching is case-insensitive.
  RULES=(
    # --- File / data deletion ---
    '(^|[;&|`(]|&&|\|\|)[[:space:]]*rm([[:space:]]|$)|||File deletion (rm) is blocked. Ask the user before deleting files.'
    '\b(rmdir|unlink|shred|trash)\b|||File deletion command is blocked. Ask the user first.'
    '\bgit[[:space:]]+rm\b|||`git rm` deletes tracked files; blocked. Ask the user first.'
    '\bfind\b.*-delete\b|||`find -delete` is blocked. Ask the user first.'
    '\bfind\b.*-exec[[:space:]]+rm\b|||`find -exec rm` is blocked. Ask the user first.'
    '>[[:space:]]*/dev/(sd|nvme|disk)|||Writing to a raw disk device is blocked.'
    '\b(mkfs|fdisk)\b|||Filesystem/partition commands are blocked.'
    '\bdd\b.*[[:space:]]of=|||`dd of=` is blocked (can destroy data/devices).'

    # --- Git: remote / history-rewriting ---
    '\bgit[[:space:]]+push\b|||`git push` is blocked. Pushing requires explicit user permission.'
    '\bgit[[:space:]]+remote\b|||Changing git remotes is blocked. Ask the user first.'
    '\bgit[[:space:]]+reset[[:space:]]+--hard\b|||`git reset --hard` discards work; blocked. Ask the user first.'
    '\bgit[[:space:]]+clean\b|||`git clean` deletes untracked files; blocked. Ask the user first.'
    '\bgit[[:space:]]+(rebase|filter-branch|filter-repo)\b|||History-rewriting git command is blocked. Ask the user first.'
    '\bgit[[:space:]]+commit\b.*--amend|||`git commit --amend` rewrites history; blocked. Ask the user first.'
    '\bgit[[:space:]]+branch\b.*[[:space:]]-[Dd]\b|||Deleting branches is blocked. Ask the user first.'
    '\bgit[[:space:]]+tag\b.*[[:space:]]-d\b|||Deleting tags is blocked. Ask the user first.'
    '\bgit[[:space:]]+checkout\b.*[[:space:]]--[[:space:]]|||`git checkout -- <path>` discards changes; blocked. Ask the user first.'
    '\bgit[[:space:]]+stash[[:space:]]+(drop|clear)\b|||Dropping stashes is blocked. Ask the user first.'

    # --- Publishing / supply chain ---
    '\b(npm|pnpm|yarn)[[:space:]]+publish\b|||Publishing packages is blocked. Ask the user first.'
    '\b(npm|pnpm)[[:space:]]+(install|i|add)\b.*(-g|--global)\b|||Global package installs are blocked. Install project-local deps instead (and ask before adding new deps).'
    '(curl|wget).*\|.*(sh|bash|zsh|python|node)\b|||Piping a downloaded script into an interpreter is blocked.'

    # --- Privilege / system control ---
    '(^|[;&|`(]|&&|\|\|)[[:space:]]*(sudo|su)\b|||Privilege escalation (sudo/su) is blocked.'
    '\bchmod\b.*(-R|[[:space:]]777|[[:space:]]a\+|\+s)|||Broad/recursive chmod is blocked.'
    '\bchown\b|||chown is blocked.'
    '\b(shutdown|reboot|halt|poweroff)\b|||System power commands are blocked.'
    '\bkillall\b|||killall is blocked.'
    '\bkill[[:space:]]+-9[[:space:]]+-1\b|||Mass kill is blocked.'
    ':\(\)[[:space:]]*\{[[:space:]]*:|||Fork bomb pattern is blocked.'

    # --- Secret exfiltration (both command orders) ---
    '(curl|wget|nc|ncat|scp|rsync).*(\.env|id_rsa|id_ed25519|\.aws|\.ssh|\.npmrc|credentials)|||Sending credentials/secrets over the network is blocked.'
    '(\.env|id_rsa|id_ed25519|\.aws|\.ssh|\.npmrc|credentials).*\|.*(curl|wget|nc|ncat|scp|rsync)|||Piping credentials/secrets to the network is blocked.'
    '(>|>>|tee|sed[[:space:]]+-i|truncate).*\.env\b|||Modifying .env files is blocked. Ask the user first.'

    # --- Protect the guardrail itself ---
    '(>|>>|tee|sed[[:space:]]+-i|truncate|mv|cp).*\.claude/(settings|hooks)|||Modifying the guardrail (.claude/settings or hooks) is blocked.'
    '\.git/hooks|||Modifying .git/hooks is blocked.'
  )

  for entry in "${RULES[@]}"; do
    pat="${entry%%|||*}"
    reason="${entry##*|||}"
    if printf '%s' "$CMD" | grep -qiE "$pat"; then
      deny "$reason"
    fi
  done

  exit 0  # no match: allow through normal flow
fi

# ── Write / Edit file policy ────────────────────────────────────────────────
if [ "$TOOL" = "Write" ] || [ "$TOOL" = "Edit" ] || [ "$TOOL" = "MultiEdit" ]; then
  FILE="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')"
  [ -z "$FILE" ] && exit 0

  case "$FILE" in
    *.env|*.env.*)              deny "Editing .env / secret files is blocked. Ask the user first." ;;
    */.claude/settings*|*/.claude/hooks/*) deny "Editing the guardrail config is blocked." ;;
    */.git/*)                   deny "Editing files under .git/ is blocked." ;;
    *id_rsa*|*id_ed25519*|*.pem|*/.npmrc|*/.aws/*|*/.ssh/*|*.credentials.json)
                                deny "Editing credential/key files is blocked." ;;
  esac

  if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
    case "$FILE" in
      /*) case "$FILE" in
            "$CLAUDE_PROJECT_DIR"/*) : ;;
            *) deny "Writing outside the project directory is blocked: $FILE" ;;
          esac ;;
    esac
  fi

  exit 0
fi

exit 0
