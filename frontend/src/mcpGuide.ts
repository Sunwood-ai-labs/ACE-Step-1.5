export interface McpClientSetup {
  id: "claude-code" | "codex";
  label: string;
  description: string;
  command: string;
}

export interface McpTool {
  name: string;
  description: string;
}

export const MCP_ENDPOINT = "http://127.0.0.1:8002/mcp";
export const MCP_DOCS_URL =
  "https://github.com/Sunwood-ai-labs/ace-step-forge#streamable-http-mcp-claude-code--codex";

export const MCP_START_COMMAND = "docker compose up -d";

export const MCP_CLIENTS: McpClientSetup[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    description: "Add Forge to the current local project scope.",
    command: `claude mcp add --transport http ace-step-forge ${MCP_ENDPOINT}`,
  },
  {
    id: "codex",
    label: "Codex CLI",
    description: "Register Forge as a Streamable HTTP MCP server.",
    command: `codex mcp add ace-step-forge --url ${MCP_ENDPOINT}`,
  },
];

export const MCP_AGENT_PROMPT =
  "和風ロックを10秒生成して、完了まで待ち、Library に保存された曲を教えて。";

export const MCP_TOOLS: McpTool[] = [
  { name: "generate_music", description: "Queue a text-to-music generation." },
  { name: "get_generation_status", description: "Check one queued generation." },
  { name: "wait_for_generation", description: "Wait for a terminal result." },
  { name: "list_music_library", description: "Find finished tracks in Forge." },
  { name: "get_music_server_status", description: "Confirm the backing service is ready." },
];

export const MCP_CODEX_AUTH_COMMAND = [
  '$env:ACESTEP_MCP_API_KEY = "replace-with-a-long-random-token"',
  `codex mcp add ace-step-forge --url ${MCP_ENDPOINT} --bearer-token-env-var ACESTEP_MCP_API_KEY`,
].join("\n");

export const MCP_CLAUDE_AUTH_COMMAND = [
  '$env:ACESTEP_MCP_API_KEY = "replace-with-a-long-random-token"',
  `claude mcp add --transport http ace-step-forge ${MCP_ENDPOINT} --header "Authorization: Bearer $env:ACESTEP_MCP_API_KEY"`,
].join("\n");
