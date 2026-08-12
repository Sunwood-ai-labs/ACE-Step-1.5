import { describe, expect, it } from "vitest";
import { MCP_CLIENTS, MCP_ENDPOINT, MCP_TOOLS } from "./mcpGuide";

describe("Forge MCP guide", () => {
  it("keeps both client setup commands on the local Streamable HTTP endpoint", () => {
    expect(MCP_ENDPOINT).toBe("http://127.0.0.1:8002/mcp");
    expect(MCP_CLIENTS.map((client) => client.command)).toEqual([
      `claude mcp add --transport http ace-step-forge ${MCP_ENDPOINT}`,
      `codex mcp add ace-step-forge --url ${MCP_ENDPOINT}`,
    ]);
  });

  it("documents every MCP tool exposed by the gateway", () => {
    expect(MCP_TOOLS.map((tool) => tool.name)).toEqual([
      "generate_music",
      "get_generation_status",
      "wait_for_generation",
      "list_music_library",
      "get_music_server_status",
    ]);
  });
});
