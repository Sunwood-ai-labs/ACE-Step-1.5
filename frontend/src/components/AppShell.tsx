import { Activity, Archive, CircleHelp, Settings2, Sparkles } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import type { ServiceState } from "../lib/types";

interface AppShellProps {
  children: ReactNode;
  serviceState: ServiceState;
  activeCount: number;
}

const navigation = [
  { to: "/", label: "Create", icon: Sparkles, hint: "Compose a new generation" },
  { to: "/library", label: "Library", icon: Archive, hint: "Listen to finished work" },
  { to: "/system", label: "System", icon: Settings2, hint: "Connection and API access" },
];

function pageTitle(pathname: string) {
  if (pathname === "/library") return ["Library", "Local collection"];
  if (pathname === "/system") return ["System", "Connection control"];
  return ["Create", "A quieter way to start a track"];
}

export function AppShell({ children, serviceState, activeCount }: AppShellProps) {
  const location = useLocation();
  const [title, eyebrow] = pageTitle(location.pathname);
  const serviceLabel = serviceState === "online" ? "API ready" : serviceState === "checking" ? "Checking API" : "API unavailable";

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span>A</span><i /></div>
          <div>
            <strong>ACE / STEP</strong>
            <span>FORGE 1.5</span>
          </div>
        </div>

        <nav className="side-nav">
          <p className="nav-caption">Workspace</p>
          {navigation.map(({ to, label, icon: Icon, hint }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`} title={hint}>
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className={`service-badge ${serviceState}`} aria-label={serviceLabel}>
            <span aria-hidden="true" />
            {serviceLabel}
          </div>
          <p>All jobs are rendered by your local ACE-Step service.</p>
          <a href="https://github.com/Sunwood-ai-labs/ace-step-forge" target="_blank" rel="noreferrer">
            <CircleHelp size={15} aria-hidden="true" /> Source &amp; API
          </a>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          <div className="topbar-status" aria-label={`${activeCount} active jobs`}>
            <Activity size={16} aria-hidden="true" />
            <span>{activeCount ? `${activeCount} job${activeCount === 1 ? "" : "s"} in motion` : "Queue clear"}</span>
          </div>
        </header>
        <main id="main-content" className="main-content">{children}</main>
      </section>
    </div>
  );
}
