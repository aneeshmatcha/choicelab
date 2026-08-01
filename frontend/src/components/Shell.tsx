import { BarChart3, FlaskConical, LayoutDashboard, LogOut, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

interface ShellProps {
  children: ReactNode;
  active: "dashboard" | "experiment" | "reports" | "settings";
  onNavigate: (view: "dashboard" | "experiment" | "reports" | "settings") => void;
  onLogout: () => void;
  workspaceLabel: string;
}

export function Shell({ children, active, onNavigate, onLogout, workspaceLabel }: ShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <nav>
          <button className={active === "dashboard" ? "active" : ""} onClick={() => onNavigate("dashboard")}>
            <LayoutDashboard size={19} /> Overview
          </button>
          <button className={active === "experiment" ? "active" : ""} onClick={() => onNavigate("experiment")}>
            <FlaskConical size={19} /> Live experiment
          </button>
          <button className={active === "reports" ? "active" : ""} onClick={() => onNavigate("reports")}><BarChart3 size={19} /> Reports</button>
          <button className={active === "settings" ? "active" : ""} onClick={() => onNavigate("settings")}><Settings size={19} /> Settings</button>
        </nav>
        <div className="sidebar-note">
          <span className="pulse" /> {workspaceLabel || "ChoiceLab workspace"}
          <strong>180 responses seeded</strong>
        </div>
        <button className="sidebar-logout" onClick={onLogout}><LogOut size={16} /> Sign out</button>
      </aside>
      <main>{children}</main>
    </div>
  );
}
