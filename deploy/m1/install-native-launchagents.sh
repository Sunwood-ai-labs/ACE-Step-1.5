#!/bin/zsh
set -euo pipefail

ROOT="${FORGE_NATIVE_ROOT:-$HOME/ace-step-forge-native}"
LAUNCH_DIR="$HOME/Library/LaunchAgents"
API_LABEL="com.sunwood.ace-step-forge.api"
MCP_LABEL="com.sunwood.ace-step-forge.mcp"
API_PLIST="$LAUNCH_DIR/$API_LABEL.plist"
MCP_PLIST="$LAUNCH_DIR/$MCP_LABEL.plist"

mkdir -p "$LAUNCH_DIR"

cat > "$API_PLIST" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.sunwood.ace-step-forge.api</string>
  <key>ProgramArguments</key><array>
    <string>/bin/zsh</string><string>-lc</string>
    <string>exec "$HOME/ace-step-forge-native/deploy/m1/native-api.sh"</string>
  </array>
  <key>WorkingDirectory</key><string>/Users/admin/ace-step-forge-native</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/Users/admin/ace-step-native-api.log</string>
  <key>StandardErrorPath</key><string>/Users/admin/ace-step-native-api.log</string>
</dict></plist>
PLIST

cat > "$MCP_PLIST" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.sunwood.ace-step-forge.mcp</string>
  <key>ProgramArguments</key><array>
    <string>/bin/zsh</string><string>-lc</string>
    <string>exec "$HOME/ace-step-forge-native/deploy/m1/native-mcp.sh"</string>
  </array>
  <key>WorkingDirectory</key><string>/Users/admin/ace-step-forge-native</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/Users/admin/ace-step-native-mcp.log</string>
  <key>StandardErrorPath</key><string>/Users/admin/ace-step-native-mcp.log</string>
</dict></plist>
PLIST

uid="$(id -u)"
launchctl bootout "gui/$uid/$API_LABEL" 2>/dev/null || true
launchctl bootout "gui/$uid/$MCP_LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$uid" "$API_PLIST"
launchctl bootstrap "gui/$uid" "$MCP_PLIST"
launchctl kickstart -k "gui/$uid/$API_LABEL"
launchctl kickstart -k "gui/$uid/$MCP_LABEL"

echo "Native ACE-Step API and MCP launch agents installed under $ROOT"
