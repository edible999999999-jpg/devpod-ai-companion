#!/bin/bash
# DevPod Hook Installer
# Installs DevPod hook scripts into Claude Code's settings.
#
# Usage: ./install.sh [--port PORT]
#
# This script:
#   1. Copies hook scripts to ~/.devpod/hooks/
#   2. Makes them executable
#   3. Merges hook configuration into ~/.claude/settings.json
#   4. Preserves existing hooks from other tools

set -euo pipefail

DEVPod_HOME="$HOME/.devpod"
HOOK_DIR="$DEVPod_HOME/hooks"
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-31275}"

echo "🎙️  DevPod Hook Installer"
echo "========================="
echo ""

# Create directories
mkdir -p "$HOOK_DIR"
mkdir -p "$HOME/.claude"

# Copy hook script
cp "$SCRIPT_DIR/devpod-hook.sh" "$HOOK_DIR/devpod-hook.sh"
chmod +x "$HOOK_DIR/devpod-hook.sh"

echo "✓ Hook script installed to $HOOK_DIR/devpod-hook.sh"

# Build the hook configuration
HOOK_CMD="$HOOK_DIR/devpod-hook.sh"

# Read existing settings or create empty object
if [ -f "$CLAUDE_SETTINGS" ]; then
  SETTINGS=$(cat "$CLAUDE_SETTINGS")
else
  SETTINGS="{}"
fi

# Use Python to safely merge hooks into settings (avoids jq dependency)
NEW_SETTINGS=$(python3 -c "
import json, sys

settings = json.loads('''$SETTINGS''')
if not isinstance(settings, dict):
    settings = {}

hooks = settings.get('hooks', {})

# DevPod hook entries
hook_cmd = '$HOOK_CMD'
devpod_hooks = {
    'PermissionRequest': [{
        'hooks': [{
            'type': 'command',
            'command': hook_cmd,
            'timeout': 120000
        }]
    }],
    'Stop': [{
        'hooks': [{
            'type': 'command',
            'command': hook_cmd
        }]
    }],
    'TaskCompleted': [{
        'hooks': [{
            'type': 'command',
            'command': hook_cmd
        }]
    }],
    'Notification': [{
        'hooks': [{
            'type': 'command',
            'command': hook_cmd
        }]
    }]
}

# Merge (DevPod entries override existing ones for these events)
for key, value in devpod_hooks.items():
    hooks[key] = value

settings['hooks'] = hooks
print(json.dumps(settings, indent=2))
" 2>/dev/null) || {
  echo "⚠ Warning: Python3 not found, using basic merge"
  # Fallback: just write the hooks directly
  NEW_SETTINGS=$(echo "$SETTINGS" | python3 -c "
import json, sys
settings = json.load(sys.stdin) if sys.stdin.read().strip() else {}
settings['hooks'] = settings.get('hooks', {})
settings['hooks']['PermissionRequest'] = [{'hooks': [{'type': 'command', 'command': '$HOOK_CMD', 'timeout': 120000}]}]
settings['hooks']['Stop'] = [{'hooks': [{'type': 'command', 'command': '$HOOK_CMD'}]}]
settings['hooks']['TaskCompleted'] = [{'hooks': [{'type': 'command', 'command': '$HOOK_CMD'}]}]
settings['hooks']['Notification'] = [{'hooks': [{'type': 'command', 'command': '$HOOK_CMD'}]}]
print(json.dumps(settings, indent=2))
")
}

# Write settings
echo "$NEW_SETTINGS" > "$CLAUDE_SETTINGS"

echo "✓ Hooks configured in $CLAUDE_SETTINGS"
echo ""
echo "Installed hooks:"
echo "  • PermissionRequest → voice confirmation"
echo "  • Stop              → task completion broadcast"
echo "  • TaskCompleted     → task summary broadcast"
echo "  • Notification      → notification broadcast"
echo ""
echo "⚡ Restart Claude Code for changes to take effect."
echo "   Verify with /hooks inside Claude Code."
echo ""
echo "✅ Installation complete!"
