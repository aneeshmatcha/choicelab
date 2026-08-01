import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { Shell } from "./components/Shell";
import { Dashboard } from "./pages/Dashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { Participant } from "./pages/Participant";
import type { Analytics, Experiment } from "./types";

type View = "dashboard" | "experiment" | "login";

export default function App() {
  const [view, setView] = useState<View>("experiment");
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
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

  function navigate(nextView: View) {
    if (nextView === "dashboard" && experiment) {
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
    return <Participant experiment={experiment} onAdminAccess={() => setView("login")} />;
  }
  if (!analytics) return <div className="state-page loading"><div className="loader" /><p>Loading behavioral insights…</p></div>;
  return (
    <Shell active="dashboard" onNavigate={navigate} onLogout={() => void logout()}>
      <Dashboard experiment={experiment} analytics={analytics} onTryExperiment={() => navigate("experiment")} />
    </Shell>
  );
}
