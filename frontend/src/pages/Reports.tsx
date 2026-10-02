import { ArrowDownToLine, CheckCircle2, Clock3, FileText, Lightbulb, Printer, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import type { Analytics, Experiment } from "../types";

interface ReportsProps {
  experiment: Experiment;
  analytics: Analytics;
}

const themeRules = {
  travel: [{ label: "Map & location context", words: ["map", "nearby"] }, { label: "Saving & flexibility", words: ["saving", "saved"] }, { label: "Structure & planning", words: ["daily", "budget"] }, { label: "Ease of discovery", words: ["explor", "inspiring"] }],
  checkout: [{ label: "Reduced complexity", words: ["steps", "process"] }, { label: "Order visibility", words: ["total", "visible"] }, { label: "Trust & reassurance", words: ["safer", "check"] }, { label: "Speed to purchase", words: ["quick", "everything"] }],
  pricing: [{ label: "Plan recommendation", words: ["recommended", "clear"] }, { label: "Feature transparency", words: ["feature", "limitation"] }, { label: "Decision simplicity", words: ["overwhelming", "less"] }, { label: "Comparison depth", words: ["differences", "verify"] }],
  onboarding: [{ label: "Guidance", words: ["guided", "steps"] }, { label: "Setup progress", words: ["progress", "checklist"] }, { label: "Clarity", words: ["clear", "easy"] }, { label: "Activation speed", words: ["quick", "fast"] }],
};

export function Reports({ experiment, analytics }: ReportsProps) {
  const winner = analytics.choices.reduce((best, choice) => choice.percentage > best.percentage ? choice : best, analytics.choices[0]);
  const feedbackText = analytics.recent_responses.map((response) => response.feedback.toLowerCase()).join(" ");
  const themes = themeRules[experiment.template_key].map((theme) => ({ ...theme, matches: theme.words.filter((word) => feedbackText.includes(word)).length })).sort((a, b) => b.matches - a.matches);
  const nextStep = experiment.template_key === "checkout" ? "Run a moderated purchase test with real cart decisions and payment-error recovery." : experiment.template_key === "pricing" ? "Validate plan discovery using realistic team-size and budget scenarios." : "Advance the winning concept to a moderated task-based usability study.";

  return (
    <div className="page reports-page">
      <header className="page-header report-header">
        <div><p className="eyebrow">EXPERIMENT REPORT</p><h1>Decision brief: {experiment.title}</h1><p>A concise, shareable interpretation of the current behavioral evidence.</p></div>
        <div className="header-actions"><button className="button secondary" onClick={() => window.print()}><Printer size={17} /> Print report</button><a className="button primary" href={api.exportUrl(experiment.id)}><ArrowDownToLine size={17} /> Download data</a></div>
      </header>

      <section className="report-hero">
        <div className="report-hero-copy"><span className="report-icon"><FileText size={20} /></span><p className="eyebrow">EXECUTIVE SUMMARY</p><h2>Variation {winner.label} is the leading experience with {winner.percentage}% preference.</h2><p>{analytics.effect_summary} The observed result is based on {analytics.total_responses} responses and should be interpreted alongside the confidence interval and participant mix.</p><div className="report-verdict"><CheckCircle2 size={17} /><span><strong>{analytics.is_significant ? "Evidence threshold reached" : "More evidence needed"}</strong>p = {analytics.p_value.toFixed(4)} · 95% CI {analytics.confidence_interval[0]}–{analytics.confidence_interval[1]}%</span></div></div>
        <div className="report-score"><span>Preferred concept</span><strong>{winner.label}</strong><small>{winner.count} of {analytics.total_responses} participants</small></div>
      </section>

      <section className="report-kpis">
        <article><Users size={18} /><span>Sample size<strong>{analytics.total_responses}</strong></span></article>
        <article><TrendingUp size={18} /><span>Task success<strong>{analytics.task_success_rate}%</strong></span></article>
        <article><Clock3 size={18} /><span>Mean decision time<strong>{(analytics.average_latency_ms / 1000).toFixed(1)}s</strong></span></article>
        <article><ShieldCheck size={18} /><span>Mean ease<strong>{analytics.average_ease_score}/5</strong></span></article>
      </section>

      <section className="report-grid">
        <article className="panel report-chart-panel"><div className="panel-heading"><div><p className="eyebrow">SEGMENT CHECK</p><h2>Variation B preference by device</h2></div></div><ResponsiveContainer width="100%" height={250}><BarChart data={analytics.device_segments}><CartesianGrid vertical={false} stroke="#ece9e3" /><XAxis dataKey="segment" axisLine={false} tickLine={false} /><YAxis domain={[0,100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${value}%`, "Chose B"]} /><Bar dataKey="variation_b_percentage" fill="#7467e8" radius={[6,6,0,0]} barSize={44} /></BarChart></ResponsiveContainer><p className="association-note">Segment differences are descriptive associations, not causal effects.</p></article>
        <article className="panel theme-panel"><div className="panel-heading"><div><p className="eyebrow">QUALITATIVE SIGNALS</p><h2>Feedback themes</h2></div></div><div className="theme-list">{themes.map((theme, index) => <div key={theme.label}><span><i>{index + 1}</i><strong>{theme.label}</strong></span><b>{theme.matches > 0 ? "Observed" : "Monitor"}</b></div>)}</div><div className="theme-note"><Lightbulb size={16} /><span>Use themes to explain preference patterns, not as a substitute for reviewing full comments.</span></div></article>
      </section>

      <section className="panel recommendation-panel"><p className="eyebrow">RECOMMENDED NEXT STEP</p><h2>Advance Variation {winner.label} to the next validation round.</h2><p>{nextStep} Measure observed behavior before treating stated preference as evidence that the design improves outcomes.</p><div><span>Primary success metric<b>Task completion</b></span><span>Secondary metric<b>Time on task</b></span><span>Follow-up sample<b>8–12 participants</b></span></div></section>
    </div>
  );
}
