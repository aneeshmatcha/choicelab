import { BarChart3, FlaskConical, LayoutDashboard, Library, LogOut, Route, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

interface ShellProps {
  children: ReactNode;
  active: "dashboard" | "experiment" | "experiments" | "program" | "reports" | "settings";
  onNavigate: (view: "dashboard" | "experiment" | "experiments" | "program" | "reports" | "settings") => void;
  onLogout: () => void;
  workspaceLabel: string;
  responseCount?: number;
}

export function Shell({ children, active, onNavigate, onLogout, workspaceLabel, responseCount = 0 }: ShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <nav>
          <button className={active === "dashboard" ? "active" : ""} onClick={() => onNavigate("dashboard")}>
            <LayoutDashboard size={19} /> Overview
          </button>
          <button className={active === "experiments" ? "active" : ""} onClick={() => onNavigate("experiments")}>
            <Library size={19} /> Experiments
          </button>
          <button className={active === "program" ? "active" : ""} onClick={() => onNavigate("program")}>
            <Route size={19} /> Research program
          </button>
          <button className={active === "experiment" ? "active" : ""} onClick={() => onNavigate("experiment")}>
            <FlaskConical size={19} /> Live experiment
          </button>
          <button className={active === "reports" ? "active" : ""} onClick={() => onNavigate("reports")}><BarChart3 size={19} /> Reports</button>
          <button className={active === "settings" ? "active" : ""} onClick={() => onNavigate("settings")}><Settings size={19} /> Settings</button>
        </nav>
        <div className="sidebar-note">
          <span className="pulse" /> {workspaceLabel || "ChoiceLab workspace"}
          <strong>{responseCount} research responses</strong>
        </div>
        <button className="sidebar-logout" onClick={onLogout}><LogOut size={16} /> Sign out</button>
      </aside>
      <main>{children}</main>
    </div>
  );
}
