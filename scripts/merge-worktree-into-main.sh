#!/usr/bin/env bash
# Merge the current worktree commit into your main checkout using git (uses $HOME, not /Desktop).
# Use when Cursor "Apply worktree to current branch" fails with EROFS on mkdir '/Desktop'.
set -euo pipefail
MAIN_REPO="${NEXACARE_MAIN:-$HOME/Desktop/NexaCare}"
WT="${NEXACARE_WORKTREE:-$HOME/.cursor/worktrees/NexaCare/vvr}"

if [[ ! -e "$MAIN_REPO/.git" ]]; then
  echo "Main repo not found: $MAIN_REPO (set NEXACARE_MAIN)" >&2
  exit 1
fi
if [[ ! -e "$WT/.git" ]]; then
  echo "Worktree not found: $WT (set NEXACARE_WORKTREE)" >&2
  exit 1
fi

COMMIT="$(git -C "$WT" rev-parse HEAD)"
echo "Merging $COMMIT from worktree into main at $MAIN_REPO"
git -C "$MAIN_REPO" checkout main
git -C "$MAIN_REPO" merge "$COMMIT" -m "Merge worktree $(basename "$WT") at $COMMIT"
