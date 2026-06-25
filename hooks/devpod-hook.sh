#!/bin/bash
# DevPod Hook Script
# Receives Claude Code events from stdin and forwards them to the DevPod local server.
#
# This script is installed into ~/.claude/settings.json as a hook handler.
# When Claude Code triggers an event, this script:
#   1. Reads the JSON payload from stdin
#   2. POSTs it to the DevPod hook server (localhost)
#   3. For PermissionRequest events: waits for user decision and outputs the response
#
# Environment:
#   DEVPod_PORT - DevPod server port (default: 31275)

set -euo pipefail

DEVPod_PORT="${DEVPod_PORT:-31275}"
DEVPod_URL="http://localhost:${DEVPod_PORT}/event"

# Read the JSON payload from stdin
PAYLOAD=$(cat)

if [ -z "$PAYLOAD" ]; then
  echo "Error: No payload received on stdin" >&2
  exit 1
fi

# Forward to DevPod server
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$DEVPod_URL" \
  --max-time 120 \
  2>/dev/null) || {
  # DevPod server not running — fail silently for non-critical events
  HOOK_EVENT=$(echo "$PAYLOAD" | python3 -c "import sys,json; print(json.load(sys.stdin).get('hook_event_name',''))" 2>/dev/null || echo "")
  if [ "$HOOK_EVENT" = "PermissionRequest" ]; then
    echo "Warning: DevPod not running, PermissionRequest will need manual handling" >&2
  fi
  exit 0
}

# Split response body and HTTP status code
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Handle response based on status code
case "$HTTP_CODE" in
  200)
    # Success — if this is a PermissionRequest, output the response JSON
    # Claude Code reads stdout for hook responses
    if [ -n "$BODY" ]; then
      echo "$BODY"
    fi
    exit 0
    ;;
  204)
    # No content — just acknowledge
    exit 0
    ;;
  504)
    # Timeout — DevPod waited too long for user decision
    echo "Warning: DevPod confirmation timed out" >&2
    exit 0
    ;;
  *)
    echo "Warning: DevPod returned HTTP $HTTP_CODE" >&2
    exit 0
    ;;
esac
