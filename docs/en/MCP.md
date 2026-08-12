# Streamable HTTP MCP

Forge includes an MCP gateway for the same ACE-Step API queue used by the web
workspace. A completed agent-generated track is therefore retained in the same
server-side Library that Forge displays.

## Local connection

Bring up Compose first:

```powershell
docker compose up -d
```

The MCP endpoint is deliberately bound to the local machine:

```text
http://127.0.0.1:8002/mcp
```

Register it with a client:

```powershell
# Claude Code, current project scope
claude mcp add --transport http ace-step-forge http://127.0.0.1:8002/mcp

# Codex CLI
codex mcp add ace-step-forge --url http://127.0.0.1:8002/mcp
```

## Available tools

| Tool | Purpose |
| --- | --- |
| `generate_music` | Submit a music-generation request to ACE-Step. |
| `get_generation_status` | Read one task's current queue or completion state. |
| `wait_for_generation` | Wait for the terminal generation result. |
| `list_music_library` | List the shared completed Library. |
| `get_music_server_status` | Check MCP and underlying service readiness. |

A useful agent request is: “Generate a 10-second instrumental Japanese rock
intro with shamisen, taiko, and distorted guitar. Wait for it, then tell me the
Library item and audio URL.” The agent should call `generate_music`, wait with
`wait_for_generation`, then use `list_music_library` if it needs to locate the
retained take.

## Optional bearer-token protection

Set a secret only in your ignored `.env` file:

```dotenv
ACESTEP_MCP_API_KEY=replace-with-a-long-random-token
```

Restart the gateway, then give the client the value through an environment
variable rather than committing it in a command history:

```powershell
$env:ACESTEP_MCP_API_KEY = "replace-with-a-long-random-token"

codex mcp add ace-step-forge --url http://127.0.0.1:8002/mcp `
  --bearer-token-env-var ACESTEP_MCP_API_KEY

claude mcp add --transport http ace-step-forge http://127.0.0.1:8002/mcp `
  --header "Authorization: Bearer $env:ACESTEP_MCP_API_KEY"
```

Keep the real secret out of `.env.example`, commits, screenshots, and prompt
logs.

## Tailnet use, not public exposure

The Compose port is localhost-only by design. If another device on your
Tailnet must use it, put a Tailscale Serve/ACL boundary in front of the local
service; do not casually change the Compose binding to `0.0.0.0`.

Set the exact host that will reach MCP and a browser-reachable base URL for
returned audio links, for example:

```dotenv
ACESTEP_MCP_ALLOWED_HOSTS=localhost:*,127.0.0.1:*,[::1]:*,forge-host.tailnet-name.ts.net
ACESTEP_MCP_PUBLIC_API_BASE_URL=https://forge-host.tailnet-name.ts.net/api
```

The base URL must be an address that the MCP client can actually reach for
`/v1/audio` responses. A Tailnet address remains private to the Tailnet; it is
not a public Internet deployment.
