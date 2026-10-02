import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { Shell } from "./components/Shell";
import { Dashboard } from "./pages/Dashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { Participant } from "./pages/Participant";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Experiments } from "./pages/Experiments";
import { Program } from "./pages/Program";
import type { Analytics, Experiment, ExperimentCreate, ProgramSummary, StudySettings } from "./types";

type View = "dashboard" | "experiment" | "experiments" | "program" | "login" | "reports" | "settings";
const DEFAULT_SETTINGS: StudySettings = { studyActive: true, randomizeVariations: true, collectConfidence: true, collectFeedback: true, collectDemographics: true, workspaceLabel: "Roamly beta research" };

function savedSettings(): StudySettings {
  try {
    const saved = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("choicelab-study-settings") ?? "{}") };
    if (saved.workspaceLabel === "Demo workspace") saved.workspaceLabel = DEFAULT_SETTINGS.workspaceLabel;
    return saved;
  }
  catch { return DEFAULT_SETTINGS; }
}

export default function App() {
  const [view, setView] = useState<View>("experiment");
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [adminExperiments, setAdminExperiments] = useState<Experiment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [program, setProgram] = useState<ProgramSummary | null>(null);
  const [settings, setSettings] = useState<StudySettings>(savedSettings);
  const [error, setError] = useState("");

  const loadExperiment = useCallback(async () => {
    try {
      setError("");
      const experiments = await api.listExperiments();
      if (!experiments.length) throw new Error("No experiments are available.");
      setExperiments(experiments);
      const requestedSlug = new URLSearchParams(window.location.search).get("experiment");
      const selected = experiments.find((item) => item.slug === requestedSlug) ?? experiments[0];
      const detail = await api.getExperiment(selected.id);
      setExperiment(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load ChoiceLab.");
    }
  }, []);

  useEffect(() => { void loadExperiment(); }, [loadExperiment]);

  async function login(username: string, password: string) {
    await api.login(username, password);
    if (!experiment) throw new Error("Experiment is still loading.");
    const [adminItems, analysis, programSummary] = await Promise.all([api.listAdminExperiments(), api.getAnalytics(experiment.id), api.getProgramSummary()]);
    setAdminExperiments(adminItems);
    setAnalytics(analysis);
    setProgram(programSummary);
    setView("program");
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
    if (nextView === "program") void api.getProgramSummary().then(setProgram).catch(() => setView("login"));
    setView(nextView);
  }

  async function refreshAdminExperiments() {
    const next = await api.listAdminExperiments();
    setAdminExperiments(next);
    setExperiments(next.filter((item) => item.status === "active"));
    setProgram(await api.getProgramSummary());
    return next;
  }

  async function selectExperiment(next: Experiment, destination: "dashboard" | "participant") {
    const detail = await api.getExperiment(next.id);
    setExperiment(detail);
    setAnalytics(null);
    const url = new URL(window.location.href);
    url.searchParams.set("experiment", detail.slug);
    window.history.replaceState({}, "", url);
    if (destination === "dashboard") {
      setAnalytics(await api.getAnalytics(detail.id));
      setView("dashboard");
    } else setView("experiment");
  }

  async function createExperiment(payload: ExperimentCreate) {
    const created = await api.createExperiment(payload);
    await refreshAdminExperiments();
    setExperiment(created);
  }

  async function changeStatus(item: Experiment, status: string) {
    await api.updateExperiment(item.id, { status });
    await refreshAdminExperiments();
  }

  async function duplicateExperiment(item: Experiment) {
    await api.duplicateExperiment(item.id);
    await refreshAdminExperiments();
  }

  if (error) {
    return <div className="state-page"><h1>ChoiceLab is offline</h1><p>{error}</p><button className="button primary" onClick={() => void loadExperiment()}>Try again</button></div>;
  }
  if (!experiment) {
    return <div className="state-page loading"><div className="loader" /><p>Loading the experiment…</p></div>;
  }
  if (view === "login") return <AdminLogin onLogin={login} onBack={() => setView("experiment")} />;
  if (view === "experiment") {
    return <Participant key={experiment.id} experiment={experiment} experiments={experiments} settings={settings} onSelectExperiment={(item) => void selectExperiment(item, "participant")} onAdminAccess={() => setView("login")} />;
  }
  if (view === "experiments") {
    return <Shell active="experiments" workspaceLabel={settings.workspaceLabel} responseCount={program?.total_responses} onNavigate={navigate} onLogout={() => void logout()}><Experiments experiments={adminExperiments} selectedId={experiment.id} onSelect={(item, destination) => void selectExperiment(item, destination)} onCreate={createExperiment} onStatusChange={changeStatus} onDuplicate={duplicateExperiment} /></Shell>;
  }
  if (view === "program") {
    if (!program) return <div className="state-page loading"><div className="loader" /><p>Building the research program…</p></div>;
    return <Shell active="program" workspaceLabel={settings.workspaceLabel} responseCount={program.total_responses} onNavigate={navigate} onLogout={() => void logout()}><Program summary={program} experiments={adminExperiments} onOpen={(item) => void selectExperiment(item, "dashboard")} /></Shell>;
  }
  if (view === "settings") {
    return <Shell active="settings" workspaceLabel={settings.workspaceLabel} responseCount={program?.total_responses} onNavigate={navigate} onLogout={() => void logout()}><Settings experiment={experiment} settings={settings} onSave={saveSettings} /></Shell>;
  }
  if (!analytics) return <div className="state-page loading"><div className="loader" /><p>Loading behavioral insights…</p></div>;
  if (view === "reports") {
    return <Shell active="reports" workspaceLabel={settings.workspaceLabel} responseCount={program?.total_responses} onNavigate={navigate} onLogout={() => void logout()}><Reports experiment={experiment} analytics={analytics} /></Shell>;
  }
  return (
    <Shell active="dashboard" workspaceLabel={settings.workspaceLabel} responseCount={program?.total_responses} onNavigate={navigate} onLogout={() => void logout()}>
      <Dashboard experiment={experiment} analytics={analytics} onTryExperiment={() => navigate("experiment")} />
    </Shell>
  );
}
