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
import { useLocale } from "../i18n/LocaleProvider";
import { getMcpCopy } from "../i18n/mcpCopy";
import {
  MCP_CLAUDE_AUTH_COMMAND,
  MCP_CLIENTS,
  MCP_CODEX_AUTH_COMMAND,
  MCP_DOCS_URL,
  MCP_ENDPOINT,
  MCP_START_COMMAND,
  MCP_TOOLS,
} from "../mcpGuide";

export function McpPage() {
  const { locale } = useLocale();
  const copy = getMcpCopy(locale);
  return (
    <div className="page-stack mcp-page">
      <section className="mcp-hero" aria-labelledby="mcp-hero-heading">
        <div className="mcp-hero-copy">
          <div className="mcp-hero-topline">
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <span className="mcp-private-pill"><LockKeyhole size={13} aria-hidden="true" /> {copy.hero.private}</span>
          </div>
          <h2 id="mcp-hero-heading">{copy.hero.title}</h2>
          <p>{copy.hero.body}</p>
          <CodeSnippet label={copy.hero.endpoint} code={MCP_ENDPOINT} compact />
        </div>
        <aside className="mcp-flow" aria-label={copy.hero.flowLabel}>
          <div className="mcp-flow-heading"><Workflow size={19} aria-hidden="true" /><span>{copy.hero.flowHeading}</span></div>
          <ol>
            {copy.flow.map(([title, detail], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{title}</strong><p>{detail}</p></div>
                {index < copy.flow.length - 1 && <ArrowRight size={15} aria-hidden="true" />}
              </li>
            ))}
          </ol>
          <div className="mcp-flow-result"><CircleCheck size={16} aria-hidden="true" /> {copy.hero.result}</div>
        </aside>
      </section>

      <section className="mcp-card mcp-start-card" aria-labelledby="mcp-start-heading">
        <div className="section-heading"><div><p className="eyebrow">{copy.start.step}</p><h2 id="mcp-start-heading">{copy.start.title}</h2></div><Server size={22} aria-hidden="true" /></div>
        <p>{copy.start.body}</p>
        <CodeSnippet label={copy.start.command} code={MCP_START_COMMAND} />
      </section>

      <section className="mcp-card" aria-labelledby="mcp-connect-heading">
        <div className="section-heading"><div><p className="eyebrow">{copy.connect.step}</p><h2 id="mcp-connect-heading">{copy.connect.title}</h2></div><Terminal size={22} aria-hidden="true" /></div>
        <p className="mcp-section-copy" dangerouslySetInnerHTML={{ __html: copy.connect.body }} />
        <div className="mcp-client-grid">
          {MCP_CLIENTS.map((client) => (
            <article className="mcp-client-card" key={client.id}>
              <div><Bot size={19} aria-hidden="true" /><h3>{client.label}</h3></div>
              <p>{copy.connect.clients[client.id]}</p>
              <CodeSnippet label={copy.connect.command(client.label)} code={client.command} />
            </article>
          ))}
        </div>
      </section>

      <div className="mcp-guide-grid">
        <section className="mcp-card" aria-labelledby="mcp-ask-heading">
          <div className="section-heading"><div><p className="eyebrow">{copy.ask.step}</p><h2 id="mcp-ask-heading">{copy.ask.title}</h2></div><KeyRound size={22} aria-hidden="true" /></div>
          <ol className="mcp-steps">
            {copy.ask.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p dangerouslySetInnerHTML={{ __html: step }} /></li>)}
          </ol>
          <CodeSnippet label={copy.ask.promptLabel} code={copy.ask.prompt} />
        </section>

        <section className="mcp-card mcp-tool-card" aria-labelledby="mcp-tools-heading">
          <div className="section-heading"><div><p className="eyebrow">{copy.tools.eyebrow}</p><h2 id="mcp-tools-heading">{copy.tools.title}</h2></div><Bot size={22} aria-hidden="true" /></div>
          <ul className="mcp-tool-list">
            {MCP_TOOLS.map((tool) => <li key={tool.name}><code>{tool.name}</code><span>{copy.tools.description[tool.name]}</span></li>)}
          </ul>
        </section>
      </div>

      <section className="mcp-card mcp-auth-card" aria-labelledby="mcp-auth-heading">
        <div className="section-heading"><div><p className="eyebrow">{copy.auth.eyebrow}</p><h2 id="mcp-auth-heading">{copy.auth.title}</h2></div><LockKeyhole size={22} aria-hidden="true" /></div>
        <p className="mcp-section-copy" dangerouslySetInnerHTML={{ __html: copy.auth.body }} />
        <div className="mcp-client-grid mcp-auth-grid">
          <CodeSnippet label={copy.auth.codexLabel} code={MCP_CODEX_AUTH_COMMAND} />
          <CodeSnippet label={copy.auth.claudeLabel} code={MCP_CLAUDE_AUTH_COMMAND} />
        </div>
        <a className="mcp-doc-link" href={MCP_DOCS_URL} target="_blank" rel="noreferrer">{copy.auth.docs} <ExternalLink size={15} aria-hidden="true" /></a>
      </section>
    </div>
  );
}
