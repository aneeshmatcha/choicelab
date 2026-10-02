import { ArrowRight, CheckCircle2, Clock3, Compass, Gauge, Layers3, MousePointerClick, Route, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Experiment, ProgramSummary } from "../types";

interface ProgramProps {
  summary: ProgramSummary;
  experiments: Experiment[];
  onOpen: (experiment: Experiment) => void;
}

const stageOrder: Record<Experiment["template_key"], number> = { onboarding: 1, travel: 2, pricing: 3, checkout: 4 };
const stageMeta = {
  onboarding: { label: "01 · Activate", icon: Sparkles, goal: "Reach a useful first recommendation" },
  travel: { label: "02 · Plan", icon: Route, goal: "Build a realistic trip" },
  pricing: { label: "03 · Decide", icon: Layers3, goal: "Choose the right membership" },
  checkout: { label: "04 · Book", icon: ShieldCheck, goal: "Complete booking with confidence" },
};

export function Program({ summary, experiments, onOpen }: ProgramProps) {
  const ordered = [...summary.experiments].sort((a, b) => stageOrder[a.template_key] - stageOrder[b.template_key]);
  const chartData = ordered.map((item) => ({
    name: stageMeta[item.template_key].label.split(" · ")[1],
    "Task success": item.task_success_rate,
    "Ease score": Number((item.average_ease_score * 20).toFixed(1)),
  }));
  const friction = [...ordered].sort((a, b) => a.task_success_rate - b.task_success_rate)[0];
  const strongest = [...ordered].sort((a, b) => b.winning_percentage - a.winning_percentage)[0];

  return (
    <div className="page program-page">
      <header className="page-header program-header"><div><p className="eyebrow">ROAMLY BETA RESEARCH PROGRAM</p><h1>Validate the journey, not just one screen.</h1><p>ChoiceLab connects four interface studies into one launch decision—from first-run setup to final booking.</p></div><span className="program-readiness"><CheckCircle2 size={17} /><b>{summary.evidence_ready}/{summary.total_experiments}</b> studies evidence-ready</span></header>

      <section className="program-kpis">
        <article><span><Users size={18} /></span><div><small>Behavioral records</small><strong>{summary.total_responses}</strong></div></article>
        <article><span><CheckCircle2 size={18} /></span><div><small>Overall task success</small><strong>{summary.overall_success_rate}%</strong></div></article>
        <article><span><Gauge size={18} /></span><div><small>Average ease</small><strong>{summary.average_ease_score}/5</strong></div></article>
        <article><span><Compass size={18} /></span><div><small>Journey stages tested</small><strong>{summary.total_experiments}</strong></div></article>
      </section>

      <section className="journey-panel panel">
        <div className="panel-heading"><div><p className="eyebrow">END-TO-END VALIDATION</p><h2>Roamly customer journey</h2></div><span className="status-pill"><i /> Research active</span></div>
        <div className="journey-track">{ordered.map((metric, index) => { const meta = stageMeta[metric.template_key]; const Icon = meta.icon; const experiment = experiments.find((item) => item.id === metric.experiment_id); return <article key={metric.experiment_id}><div className="journey-node"><Icon size={17} /></div>{index < ordered.length - 1 && <i className="journey-line" />}<span>{meta.label}</span><h3>{meta.goal}</h3><div className="journey-result"><strong>{metric.task_success_rate}%</strong><small>task success</small></div><div className="journey-result"><strong>{metric.average_ease_score}/5</strong><small>ease</small></div><button onClick={() => experiment && onOpen(experiment)}>Open study <ArrowRight size={13} /></button></article>; })}</div>
      </section>

      <section className="program-grid">
        <article className="panel program-chart"><div className="panel-heading"><div><p className="eyebrow">OUTCOME COMPARISON</p><h2>Success and perceived ease by stage</h2></div></div><ResponsiveContainer width="100%" height={280}><BarChart data={chartData} margin={{ top: 24, right: 8, left: -18 }}><CartesianGrid vertical={false} stroke="#ece9e3" /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis domain={[0,100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} /><Tooltip formatter={(value, name) => [`${value}${name === "Ease score" ? "% normalized" : "%"}`, name]} /><Legend /><Bar dataKey="Task success" fill="#7467e8" radius={[5,5,0,0]} /><Bar dataKey="Ease score" fill="#ef8b68" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer><p className="association-note">Ease scores are normalized to a 100-point scale for comparison.</p></article>
        <article className="panel decision-panel"><p className="eyebrow">RESEARCH DECISION</p><h2>Where should the team focus?</h2><div className="decision-callout risk"><Clock3 size={17} /><span><small>Largest friction point</small><strong>{stageMeta[friction.template_key].goal}</strong><p>{friction.task_success_rate}% success · {(friction.average_latency_ms / 1000).toFixed(1)}s average decision time</p></span></div><div className="decision-callout win"><MousePointerClick size={17} /><span><small>Clearest design signal</small><strong>Variation {strongest.winning_label} in {stageMeta[strongest.template_key].label.split(" · ")[1]}</strong><p>{strongest.winning_percentage}% preference · {strongest.is_significant ? "significant" : "directional"} evidence</p></span></div><div className="program-recommendation"><Sparkles size={16} /><p><b>Recommendation</b>Prioritize the lowest-success journey stage, then validate the winning concept in a moderated usability session before launch.</p></div></article>
      </section>

      <section className="panel comparison-panel"><div className="panel-heading"><div><p className="eyebrow">EXPERIMENT MATRIX</p><h2>Compare every test in one view</h2></div></div><div className="program-table"><div className="program-row head"><span>Journey stage</span><span>Responses</span><span>Winner</span><span>Preference</span><span>Task success</span><span>Ease</span><span>Evidence</span></div>{ordered.map((metric) => <div className="program-row" key={metric.experiment_id}><span><b>{stageMeta[metric.template_key].label}</b><small>{metric.title}</small></span><span>{metric.total_responses}</span><span><i className={`choice-badge choice-${metric.winning_label.toLowerCase()}`}>{metric.winning_label}</i></span><span>{metric.winning_percentage}%</span><span>{metric.task_success_rate}%</span><span>{metric.average_ease_score}/5</span><span className={metric.is_significant ? "evidence-ready" : "evidence-building"}>{metric.is_significant ? "Ready" : "Building"}</span></div>)}</div></section>
    </div>
  );
}
