# Autonomous-mode guardrail

This repo ships a safety net so Claude Code can run **unattended** (including
`--dangerously-skip-permissions` / bypass-permissions mode) without being able
to delete files, push, or make high-risk system/security changes on its own.

## How it works

Bypass-permissions mode turns off the interactive approval prompt, but
**PreToolUse hooks still run**. So enforcement lives in a hook, not in the
prompt:

- **`.claude/hooks/guardrail.sh`** — runs before every `Bash`, `Write`, and
  `Edit` call. It inspects the command / file path and returns
  `permissionDecision: "deny"` for anything on the blocklist. Anything not
  matched proceeds. Matching is done inside the script (the hook `if` filter is
  best-effort and fails open, so it isn't trusted for security).
- **`.claude/settings.json`** — wires up the hook and adds a `permissions.deny`
  list (`rm`, `git push`, `sudo`, `publish`, …) as a second, independent layer.

Requires `jq` on the PATH.

## Allowed autonomously (no human needed)

Read/search (`ls`, `cat`, `grep`, `find` without `-delete`), run tests and
builds (`npm test`, `npx vitest run`, `npm run build`, `tsc`), `npx prisma
generate`, project-local installs (`npm install`), create branches
(`git checkout -b`), stage and **commit locally** (`git add`, `git commit`),
and write/edit source files inside this project directory.

## Blocked (Claude must ask the user first)

- **Deleting anything**: `rm`, `rmdir`, `unlink`, `shred`, `trash`,
  `git rm`, `find -delete`, `find -exec rm`.
- **Publishing / pushing**: `git push` (incl. `--force`), `git remote` changes,
  `npm/yarn/pnpm publish`.
- **Rewriting history / discarding work**: `git reset --hard`, `git clean`,
  `git rebase`, `git filter-branch`, `git commit --amend`,
  `git checkout -- <path>`, `git branch -D`, `git stash drop/clear`.
- **System / privilege**: `sudo`, `su`, `shutdown`/`reboot`, recursive/`777`
  `chmod`, `chown`, `mkfs`, `fdisk`, `dd of=…`, raw-disk redirects, `killall`,
  fork bombs.
- **Supply chain**: global installs (`npm i -g`), piping a downloaded script
  into a shell (`curl … | bash`).
- **Secrets**: reading/piping `.env`, SSH/AWS keys, `.npmrc`, or credentials to
  the network; editing `.env` or credential/key files.
- **The guardrail itself**: editing `.claude/settings*`, `.claude/hooks/*`, or
  `.git/hooks/*`; and any file **outside** this project directory.

When Claude hits a block, it sees the reason and should stop and ask you rather
than work around it.

## Testing / changing the policy

Dry-run a command against the hook:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git push"}}' \
  | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/guardrail.sh
```

Empty output = allowed; a JSON `permissionDecision: "deny"` = blocked. Edit the
`RULES` array in `guardrail.sh` to adjust, and re-run the check above.
