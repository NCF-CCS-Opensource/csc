#!/usr/bin/env python3
import os
import sys
import time
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
VAULT_DIR = os.environ.get("OBSIDIAN_VAULT", "/home/jai/Documents/csc/csc")
SYNC_SCRIPT = REPO_ROOT / "scripts" / "sync-obsidian.sh"

EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".sql", ".md", ".yaml", ".yml"
}
IGNORED_DIRS = {
    ".git", "node_modules", "graphify-out", ".next", ".turbo", "dist", "build", ".obsidian", ".agents"
}

def get_latest_mtime(root: Path) -> float:
    latest = 0.0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS and not d.startswith(".")]
        for f in filenames:
            ext = os.path.splitext(f)[1].lower()
            if ext in EXTENSIONS:
                filepath = os.path.join(dirpath, f)
                try:
                    mtime = os.path.getmtime(filepath)
                    if mtime > latest:
                        latest = mtime
                except OSError:
                    pass
    return latest

def main():
    print(f"👀 Watching {REPO_ROOT} for changes...")
    print(f"📓 Target Obsidian vault: {VAULT_DIR}")
    print("Press Ctrl+C to stop.\n")

    last_mtime = get_latest_mtime(REPO_ROOT)
    debounce_sec = 2.0
    
    while True:
        try:
            time.sleep(1.0)
            current_mtime = get_latest_mtime(REPO_ROOT)
            if current_mtime > last_mtime:
                time.sleep(debounce_sec)
                last_mtime = get_latest_mtime(REPO_ROOT)
                print("\n🔔 Detected changes. Updating graph and syncing to Obsidian...")
                subprocess.run([str(SYNC_SCRIPT)], env=dict(os.environ, OBSIDIAN_VAULT=VAULT_DIR))
                print(f"\n👀 Resumed watching {REPO_ROOT}...")
        except KeyboardInterrupt:
            print("\nStopped watching.")
            break

if __name__ == "__main__":
    main()
