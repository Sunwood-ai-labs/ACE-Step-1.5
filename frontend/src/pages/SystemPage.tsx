import { Eye, EyeOff, KeyRound, LockKeyhole, RotateCcw } from "lucide-react";
import { useState } from "react";
import { ServicePanel } from "../components/ServicePanel";
import { useLocale } from "../i18n/LocaleProvider";
import { getSystemCopy } from "../i18n/systemCopy";
import type { Workspace } from "../lib/useWorkspace";

interface SystemPageProps {
  workspace: Workspace;
}

export function SystemPage({ workspace }: SystemPageProps) {
  const { locale } = useLocale();
  const copy = getSystemCopy(locale);
  const [showToken, setShowToken] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const saveToken = () => {
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 3000);
  };
  return (
    <div className="page-stack system-page">
      <div className="system-grid">
        <section className="settings-card" aria-labelledby="connection-heading">
          <div className="section-heading"><div><p className="eyebrow">{copy.apiAccess}</p><h2 id="connection-heading">{copy.connectionTitle}</h2></div><KeyRound size={21} aria-hidden="true" /></div>
          <p className="settings-copy" dangerouslySetInnerHTML={{ __html: copy.connectionBody }} />
          <label className="token-field"><span>{copy.token}</span><div><input type={showToken ? "text" : "password"} value={workspace.settings.apiToken} autoComplete="off" placeholder={copy.tokenPlaceholder} onChange={(event) => workspace.setSettings({ apiToken: event.target.value })} /><button className="icon-button" type="button" onClick={() => setShowToken((value) => !value)} title={showToken ? copy.hideToken : copy.showToken} aria-label={showToken ? copy.hideToken : copy.showToken}>{showToken ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button></div></label>
          <div className="settings-actions"><button className="secondary-button" type="button" onClick={saveToken}><LockKeyhole size={16} aria-hidden="true" /> {copy.save}</button><button className="text-button" type="button" onClick={() => workspace.setSettings({ apiToken: "" })}><RotateCcw size={15} aria-hidden="true" /> {copy.clear}</button></div>
          {isSaved && <p className="saved-message" role="status">{copy.saved}</p>}
          <p className="privacy-note">{copy.privacy}</p>
        </section>
        <ServicePanel state={workspace.serviceState} health={workspace.health} onRefresh={workspace.refreshService} />
      </div>
      <section className="settings-card api-contract" aria-labelledby="contract-heading">
        <p className="eyebrow">{copy.contract}</p><h2 id="contract-heading">{copy.contractTitle}</h2>
        <div><code>POST /release_task</code><span>{copy.release}</span></div>
        <div><code>POST /query_result</code><span>{copy.query}</span></div>
        <div><code>GET /health</code><span>{copy.health}</span></div>
      </section>
    </div>
  );
}
