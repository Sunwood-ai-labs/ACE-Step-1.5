import { Eye, EyeOff, KeyRound, LockKeyhole, RotateCcw } from "lucide-react";
import { useState } from "react";
import { ServicePanel } from "../components/ServicePanel";
import type { Workspace } from "../lib/useWorkspace";

interface SystemPageProps {
  workspace: Workspace;
}

export function SystemPage({ workspace }: SystemPageProps) {
  const [showToken, setShowToken] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const saveToken = () => {
    setSavedMessage("Saved in this browser. The next API check uses the new token.");
    window.setTimeout(() => setSavedMessage(""), 3000);
  };
  return (
    <div className="page-stack system-page">
      <div className="system-grid">
        <section className="settings-card" aria-labelledby="connection-heading">
          <div className="section-heading"><div><p className="eyebrow">API access</p><h2 id="connection-heading">Connection settings</h2></div><KeyRound size={21} aria-hidden="true" /></div>
          <p className="settings-copy">The Compose proxy keeps the browser on one origin. Enter a token only when <code>ACESTEP_API_KEY</code> is enabled on the API.</p>
          <label className="token-field"><span>API token</span><div><input type={showToken ? "text" : "password"} value={workspace.settings.apiToken} autoComplete="off" placeholder="Optional local token" onChange={(event) => workspace.setSettings({ apiToken: event.target.value })} /><button className="icon-button" type="button" onClick={() => setShowToken((value) => !value)} title={showToken ? "Hide token" : "Show token"} aria-label={showToken ? "Hide token" : "Show token"}>{showToken ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button></div></label>
          <div className="settings-actions"><button className="secondary-button" type="button" onClick={saveToken}><LockKeyhole size={16} aria-hidden="true" /> Save local setting</button><button className="text-button" type="button" onClick={() => workspace.setSettings({ apiToken: "" })}><RotateCcw size={15} aria-hidden="true" /> Clear</button></div>
          {savedMessage && <p className="saved-message" role="status">{savedMessage}</p>}
          <p className="privacy-note">This value is stored only in this browser’s local storage and is never placed in the frontend build.</p>
        </section>
        <ServicePanel state={workspace.serviceState} health={workspace.health} onRefresh={workspace.refreshService} />
      </div>
      <section className="settings-card api-contract" aria-labelledby="contract-heading">
        <p className="eyebrow">Integration contract</p><h2 id="contract-heading">The UI speaks the official REST API.</h2>
        <div><code>POST /release_task</code><span>queue a generation, with optional source and reference audio</span></div>
        <div><code>POST /query_result</code><span>poll the queue and reveal returned audio</span></div>
        <div><code>GET /health</code><span>show the available local service without exposing a key</span></div>
      </section>
    </div>
  );
}
