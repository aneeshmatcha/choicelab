import { BarChart3, Check, Copy, ExternalLink, FlaskConical, Layers3, Link2, Pause, Play, Plus, Sparkles, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Experiment, ExperimentCreate } from "../types";

interface ExperimentsProps {
  experiments: Experiment[];
  selectedId: number;
  onSelect: (experiment: Experiment, destination: "dashboard" | "participant") => void;
  onCreate: (payload: ExperimentCreate) => Promise<void>;
  onStatusChange: (experiment: Experiment, status: string) => Promise<void>;
  onDuplicate: (experiment: Experiment) => Promise<void>;
}

const templates: Array<{ key: Experiment["template_key"]; name: string; detail: string; a: string; b: string }> = [
  { key: "checkout", name: "Checkout flow", detail: "Compare purchase layouts and task clarity", a: "One-page Checkout", b: "Guided Checkout" },
  { key: "pricing", name: "Pricing page", detail: "Test plan discovery and decision confidence", a: "Comparison Table", b: "Recommendation Cards" },
  { key: "travel", name: "Travel planner", detail: "Compare planning and discovery patterns", a: "Itinerary Studio", b: "Discovery Map" },
  { key: "onboarding", name: "Onboarding", detail: "Test setup flow and activation speed", a: "Setup Checklist", b: "Guided Tour" },
];

function typeLabel(type: Experiment["test_type"]) {
  return { preference: "Preference", "first-click": "First click", "task-completion": "Task completion" }[type];
}

function CreatePanel({ onClose, onCreate }: { onClose: () => void; onCreate: (payload: ExperimentCreate) => Promise<void> }) {
  const [template, setTemplate] = useState(templates[0]);
  const [type, setType] = useState<Experiment["test_type"]>("preference");
  const [title, setTitle] = useState("Find the clearest checkout experience");
  const [description, setDescription] = useState("Compare two purchase flows to learn which experience feels faster, clearer, and more trustworthy.");
  const [task, setTask] = useState("Explore both concepts, complete the primary task, and choose the interface you prefer.");
  const [launch, setLaunch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function chooseTemplate(next: typeof templates[number]) {
    setTemplate(next);
    const titles = {
      checkout: "Find the clearest checkout experience",
      pricing: "Choose the right workspace plan",
      travel: "Plan a three-day city escape",
      onboarding: "Set up a new team workspace",
    };
    setTitle(titles[next.key]);
  }

  async function submit() {
    setSaving(true); setError("");
    try {
      await onCreate({
        title, description, task_prompt: task, test_type: type, template_key: template.key,
        status: launch ? "active" : "draft",
        variations: [
          { label: "A", title: template.a, description: `The ${template.a.toLowerCase()} concept for this study.`, accent_color: "#5b63d3" },
          { label: "B", title: template.b, description: `The ${template.b.toLowerCase()} concept for this study.`, accent_color: "#df6b47" },
        ],
      });
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create experiment."); }
    finally { setSaving(false); }
  }

  return (
    <div className="builder-backdrop" role="presentation">
      <section className="experiment-builder" role="dialog" aria-modal="true" aria-label="Create experiment">
        <header><div><p className="eyebrow">NEW EXPERIMENT</p><h2>Build a UI test</h2><p>Start with an interactive template, then define what participants should evaluate.</p></div><button onClick={onClose} aria-label="Close"><X size={18} /></button></header>
        <div className="builder-section"><label>1. Choose an interface template</label><div className="template-grid">{templates.map((item) => <button type="button" className={template.key === item.key ? "selected" : ""} onClick={() => chooseTemplate(item)} key={item.key}><span><Layers3 size={17} /></span><strong>{item.name}</strong><small>{item.detail}</small>{template.key === item.key && <i><Check size={12} /></i>}</button>)}</div></div>
        <div className="builder-fields">
          <label>Experiment name<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label>Test method<select value={type} onChange={(event) => setType(event.target.value as Experiment["test_type"])}><option value="preference">Preference test</option><option value="first-click">First-click test</option><option value="task-completion">Task-completion test</option></select></label>
          <label className="wide">Study description<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="wide">Participant task<textarea value={task} onChange={(event) => setTask(event.target.value)} /></label>
        </div>
        <label className="launch-option"><button type="button" className={`setting-toggle ${launch ? "on" : ""}`} onClick={() => setLaunch(!launch)}><i /></button><span><strong>Launch immediately</strong><small>Otherwise, this experiment will be saved as a draft.</small></span></label>
        {error && <p className="form-error">{error}</p>}
        <footer><button className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving || title.length < 3} onClick={() => void submit()}>{saving ? "Creating…" : "Create experiment"} <Sparkles size={16} /></button></footer>
      </section>
    </div>
  );
}

export function Experiments({ experiments, selectedId, onSelect, onCreate, onStatusChange, onDuplicate }: ExperimentsProps) {
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const totals = useMemo(() => ({ active: experiments.filter((item) => item.status === "active").length, responses: experiments.reduce((sum, item) => sum + item.response_count, 0) }), [experiments]);

  async function copyLink(experiment: Experiment) {
    const url = `${window.location.origin}/?experiment=${experiment.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(experiment.id); window.setTimeout(() => setCopied(null), 1400);
  }

  return (
    <div className="page experiments-page">
      <header className="page-header"><div><p className="eyebrow">EXPERIMENT LIBRARY</p><h1>Test more than one idea.</h1><p>Create, launch, and compare interactive UI studies from one workspace.</p></div><button className="button primary" onClick={() => setCreating(true)}><Plus size={17} /> New experiment</button></header>
      <section className="library-summary"><span><FlaskConical size={17} /><b>{experiments.length}</b> total experiments</span><span><Play size={17} /><b>{totals.active}</b> currently live</span><span><Users size={17} /><b>{totals.responses}</b> collected responses</span></section>
      <section className="experiment-list">
        {experiments.map((experiment) => (
          <article className={`experiment-card ${experiment.id === selectedId ? "current" : ""}`} key={experiment.id}>
            <div className={`template-thumbnail ${experiment.template_key}`}><span>{experiment.variations[0]?.title}</span><i>VS</i><span>{experiment.variations[1]?.title}</span></div>
            <div className="experiment-card-body">
              <div className="experiment-card-top"><span className={`experiment-status ${experiment.status}`}><i /> {experiment.status}</span><span>{typeLabel(experiment.test_type)}</span></div>
              <h2>{experiment.title}</h2><p>{experiment.description}</p>
              <div className="experiment-stats"><span><strong>{experiment.response_count}</strong> responses</span><span><strong>{experiment.variations.length}</strong> variations</span></div>
              <div className="experiment-actions"><button className="button primary" onClick={() => onSelect(experiment, "dashboard")}><BarChart3 size={15} /> Analyze</button><button className="icon-action" title="Open participant view" onClick={() => onSelect(experiment, "participant")}><ExternalLink size={16} /></button><button className="icon-action" title="Copy participant link" onClick={() => void copyLink(experiment)}>{copied === experiment.id ? <Check size={16} /> : <Link2 size={16} />}</button><button className="icon-action" title="Duplicate" onClick={() => void onDuplicate(experiment)}><Copy size={16} /></button><button className="icon-action" title={experiment.status === "active" ? "Pause" : "Launch"} onClick={() => void onStatusChange(experiment, experiment.status === "active" ? "paused" : "active")}>{experiment.status === "active" ? <Pause size={16} /> : <Play size={16} />}</button></div>
            </div>
          </article>
        ))}
      </section>
      {creating && <CreatePanel onClose={() => setCreating(false)} onCreate={onCreate} />}
    </div>
  );
}
