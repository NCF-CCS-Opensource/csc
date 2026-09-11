#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VAULT_DIR="${OBSIDIAN_VAULT:-/home/jai/Documents/csc/csc}"

cd "$REPO_ROOT"

GRAPHIFY_BIN="$(which graphify 2>/dev/null || echo "/home/jai/.local/bin/graphify")"

echo "🔄 [graphify] Updating graph from changes in $REPO_ROOT..."
"$GRAPHIFY_BIN" update .

echo "📓 [obsidian] Syncing knowledge graph to $VAULT_DIR..."
"$GRAPHIFY_BIN" export obsidian --dir "$VAULT_DIR"

echo "✅ [done] Obsidian vault synced at $(date "+%Y-%m-%d %H:%M:%S")."
