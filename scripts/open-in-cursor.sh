#!/usr/bin/env bash
# Opens Cursor on the absolute path of this repository (the folder that contains /scripts).
# Use this if Cursor shows EROFS when writing to /Desktop/NexaCare — that path is wrong:
# your project must be under your home directory, e.g. /Users/you/Desktop/NexaCare.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec open -a Cursor "$REPO_ROOT"
