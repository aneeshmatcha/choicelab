import { BarChart3, FlaskConical, LayoutDashboard, LogOut, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

interface ShellProps {
  children: ReactNode;
  active: "dashboard" | "experiment";
  onNavigate: (view: "dashboard" | "experiment") => void;
  onLogout: () => void;
}

export function Shell({ children, active, onNavigate, onLogout }: ShellProps) {
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
          <button disabled><BarChart3 size={19} /> Reports</button>
          <button disabled><Settings size={19} /> Settings</button>
        </nav>
        <div className="sidebar-note">
          <span className="pulse" /> Demo workspace
          <strong>180 responses seeded</strong>
        </div>
        <button className="sidebar-logout" onClick={onLogout}><LogOut size={16} /> Sign out</button>
      </aside>
      <main>{children}</main>
    </div>
  );
}
