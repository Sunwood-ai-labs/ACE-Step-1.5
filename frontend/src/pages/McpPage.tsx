import {
  ArrowRight,
  Bot,
  CircleCheck,
  ExternalLink,
  KeyRound,
  LockKeyhole,
  Server,
  Terminal,
  Workflow,
} from "lucide-react";
import { CodeSnippet } from "../components/CodeSnippet";
import {
  MCP_AGENT_PROMPT,
  MCP_CLAUDE_AUTH_COMMAND,
  MCP_CLIENTS,
  MCP_CODEX_AUTH_COMMAND,
  MCP_DOCS_URL,
  MCP_ENDPOINT,
  MCP_START_COMMAND,
  MCP_TOOLS,
} from "../mcpGuide";

const flow = [
  ["Describe", "Your agent turns a music brief into a Forge job."],
  ["Generate", "ACE-Step renders through the same shared queue."],
  ["Collect", "The finished MP3 arrives in Forge Library."],
];

export function McpPage() {
  return (
    <div className="page-stack mcp-page">
      <section className="mcp-hero" aria-labelledby="mcp-hero-heading">
        <div className="mcp-hero-copy">
          <div className="mcp-hero-topline">
            <p className="eyebrow">Agent music bridge</p>
            <span className="mcp-private-pill"><LockKeyhole size={13} aria-hidden="true" /> Host-only by default</span>
          </div>
          <h2 id="mcp-hero-heading">Make music from your coding agent.</h2>
          <p>Connect Claude Code or Codex to Forge’s Streamable HTTP gateway, then generate, wait, and collect a track without leaving your agent session.</p>
          <CodeSnippet label="Streamable HTTP endpoint" code={MCP_ENDPOINT} compact />
        </div>
        <aside className="mcp-flow" aria-label="MCP generation flow">
          <div className="mcp-flow-heading"><Workflow size={19} aria-hidden="true" /><span>One request, one path</span></div>
          <ol>
            {flow.map(([title, detail], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{title}</strong><p>{detail}</p></div>
                {index < flow.length - 1 && <ArrowRight size={15} aria-hidden="true" />}
              </li>
            ))}
          </ol>
          <div className="mcp-flow-result"><CircleCheck size={16} aria-hidden="true" /> Same shared Library as the Forge UI</div>
        </aside>
      </section>

      <section className="mcp-card mcp-start-card" aria-labelledby="mcp-start-heading">
        <div className="section-heading"><div><p className="eyebrow">Step 1</p><h2 id="mcp-start-heading">Start Forge and the gateway.</h2></div><Server size={22} aria-hidden="true" /></div>
        <p>Compose starts the MCP sidecar with the API and Forge UI. Run this on the machine that hosts Docker Compose.</p>
        <CodeSnippet label="Start the stack" code={MCP_START_COMMAND} />
      </section>

      <section className="mcp-card" aria-labelledby="mcp-connect-heading">
        <div className="section-heading"><div><p className="eyebrow">Step 2</p><h2 id="mcp-connect-heading">Connect your agent.</h2></div><Terminal size={22} aria-hidden="true" /></div>
        <p className="mcp-section-copy">Choose one command and run it locally. The endpoint listens on <code>127.0.0.1</code>, so a Forge page opened through Tailnet does not make the gateway available on that phone or another computer.</p>
        <div className="mcp-client-grid">
          {MCP_CLIENTS.map((client) => (
            <article className="mcp-client-card" key={client.id}>
              <div><Bot size={19} aria-hidden="true" /><h3>{client.label}</h3></div>
              <p>{client.description}</p>
              <CodeSnippet label={`${client.label} command`} code={client.command} />
            </article>
          ))}
        </div>
      </section>

      <div className="mcp-guide-grid">
        <section className="mcp-card" aria-labelledby="mcp-ask-heading">
          <div className="section-heading"><div><p className="eyebrow">Step 3</p><h2 id="mcp-ask-heading">Ask for a track.</h2></div><KeyRound size={22} aria-hidden="true" /></div>
          <ol className="mcp-steps">
            <li><span>1</span><p>Ask the agent to call <code>generate_music</code> with a clear musical scene.</p></li>
            <li><span>2</span><p>It waits with <code>wait_for_generation</code> until the render finishes.</p></li>
            <li><span>3</span><p>It can call <code>list_music_library</code> to find the finished audio.</p></li>
          </ol>
          <CodeSnippet label="Prompt to try" code={MCP_AGENT_PROMPT} />
        </section>

        <section className="mcp-card mcp-tool-card" aria-labelledby="mcp-tools-heading">
          <div className="section-heading"><div><p className="eyebrow">Gateway tools</p><h2 id="mcp-tools-heading">Five focused actions.</h2></div><Bot size={22} aria-hidden="true" /></div>
          <ul className="mcp-tool-list">
            {MCP_TOOLS.map((tool) => <li key={tool.name}><code>{tool.name}</code><span>{tool.description}</span></li>)}
          </ul>
        </section>
      </div>

      <section className="mcp-card mcp-auth-card" aria-labelledby="mcp-auth-heading">
        <div className="section-heading"><div><p className="eyebrow">Optional hardening</p><h2 id="mcp-auth-heading">Require a bearer token when you need one.</h2></div><LockKeyhole size={22} aria-hidden="true" /></div>
        <p className="mcp-section-copy">Set <code>ACESTEP_MCP_API_KEY</code> in your Compose <code>.env</code>, restart the stack, then register the same environment variable with your client. Keep real tokens out of commands, commits, and screenshots.</p>
        <div className="mcp-client-grid mcp-auth-grid">
          <CodeSnippet label="Codex CLI with a bearer token" code={MCP_CODEX_AUTH_COMMAND} />
          <CodeSnippet label="Claude Code with a bearer token" code={MCP_CLAUDE_AUTH_COMMAND} />
        </div>
        <a className="mcp-doc-link" href={MCP_DOCS_URL} target="_blank" rel="noreferrer">Open the full MCP setup notes <ExternalLink size={15} aria-hidden="true" /></a>
      </section>
    </div>
  );
}
