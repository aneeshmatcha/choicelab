import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { Shell } from "./components/Shell";
import { Dashboard } from "./pages/Dashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { Participant } from "./pages/Participant";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import type { Analytics, Experiment, StudySettings } from "./types";

type View = "dashboard" | "experiment" | "login" | "reports" | "settings";
const DEFAULT_SETTINGS: StudySettings = { studyActive: true, randomizeVariations: true, collectConfidence: true, collectFeedback: true, collectDemographics: true, workspaceLabel: "Demo workspace" };

function savedSettings(): StudySettings {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("choicelab-study-settings") ?? "{}") }; }
  catch { return DEFAULT_SETTINGS; }
}

export default function App() {
  const [view, setView] = useState<View>("experiment");
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [settings, setSettings] = useState<StudySettings>(savedSettings);
  const [error, setError] = useState("");

  const loadExperiment = useCallback(async () => {
    try {
      setError("");
      const experiments = await api.listExperiments();
      if (!experiments.length) throw new Error("No experiments are available.");
      const detail = await api.getExperiment(experiments[0].id);
      setExperiment(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load ChoiceLab.");
    }
  }, []);

  useEffect(() => { void loadExperiment(); }, [loadExperiment]);

  async function login(username: string, password: string) {
    await api.login(username, password);
    if (!experiment) throw new Error("Experiment is still loading.");
    const analysis = await api.getAnalytics(experiment.id);
    setAnalytics(analysis);
    setView("dashboard");
  }

  async function logout() {
    await api.logout();
    setAnalytics(null);
    setView("experiment");
  }

  function saveSettings(nextSettings: StudySettings) {
    setSettings(nextSettings);
    localStorage.setItem("choicelab-study-settings", JSON.stringify(nextSettings));
  }

  function navigate(nextView: View) {
    if ((nextView === "dashboard" || nextView === "reports") && experiment) {
      void api.getAnalytics(experiment.id).then(setAnalytics).catch(() => setView("login"));
    }
    setView(nextView);
  }

  if (error) {
    return <div className="state-page"><h1>ChoiceLab is offline</h1><p>{error}</p><button className="button primary" onClick={() => void loadExperiment()}>Try again</button></div>;
  }
  if (!experiment) {
    return <div className="state-page loading"><div className="loader" /><p>Loading the experiment…</p></div>;
  }
  if (view === "login") return <AdminLogin onLogin={login} onBack={() => setView("experiment")} />;
  if (view === "experiment") {
    return <Participant experiment={experiment} settings={settings} onAdminAccess={() => setView("login")} />;
  }
  if (view === "settings") {
    return <Shell active="settings" workspaceLabel={settings.workspaceLabel} onNavigate={navigate} onLogout={() => void logout()}><Settings experiment={experiment} settings={settings} onSave={saveSettings} /></Shell>;
  }
  if (!analytics) return <div className="state-page loading"><div className="loader" /><p>Loading behavioral insights…</p></div>;
  if (view === "reports") {
    return <Shell active="reports" workspaceLabel={settings.workspaceLabel} onNavigate={navigate} onLogout={() => void logout()}><Reports experiment={experiment} analytics={analytics} /></Shell>;
  }
  return (
    <Shell active="dashboard" workspaceLabel={settings.workspaceLabel} onNavigate={navigate} onLogout={() => void logout()}>
      <Dashboard experiment={experiment} analytics={analytics} onTryExperiment={() => navigate("experiment")} />
    </Shell>
  );
}
