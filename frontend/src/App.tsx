import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { Shell } from "./components/Shell";
import { Dashboard } from "./pages/Dashboard";
import { Participant } from "./pages/Participant";
import type { Analytics, Experiment } from "./types";

type View = "dashboard" | "experiment";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const experiments = await api.listExperiments();
      if (!experiments.length) throw new Error("No experiments are available.");
      const [detail, analysis] = await Promise.all([
        api.getExperiment(experiments[0].id),
        api.getAnalytics(experiments[0].id),
      ]);
      setExperiment(detail);
      setAnalytics(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load ChoiceLab.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function navigate(nextView: View) {
    if (nextView === "dashboard") void load();
    setView(nextView);
  }

  if (error) {
    return <div className="state-page"><h1>ChoiceLab is offline</h1><p>{error}</p><button className="button primary" onClick={() => void load()}>Try again</button></div>;
  }
  if (!experiment || !analytics) {
    return <div className="state-page loading"><div className="loader" /><p>Loading behavioral insights…</p></div>;
  }
  if (view === "experiment") {
    return <Participant experiment={experiment} onBack={() => navigate("dashboard")} />;
  }
  return (
    <Shell active={view} onNavigate={navigate}>
      <Dashboard experiment={experiment} analytics={analytics} onTryExperiment={() => navigate("experiment")} />
    </Shell>
  );
}

