import { ArrowDownToLine, ArrowRight, CheckCircle2, Clock3, MessageSquareText, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import type { Analytics, Experiment } from "../types";

interface DashboardProps {
  experiment: Experiment;
  analytics: Analytics;
  onTryExperiment: () => void;
}

function formatSeconds(milliseconds: number) {
  return `${(milliseconds / 1000).toFixed(1)}s`;
}

export function Dashboard({ experiment, analytics, onTryExperiment }: DashboardProps) {
  const choiceData = analytics.choices.map((choice) => ({
    name: `Variation ${choice.label}`,
    value: choice.count,
    percentage: choice.percentage,
  }));

  return (
    <div className="page dashboard-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">EXPERIMENT OVERVIEW</p>
          <h1>Good afternoon, Aneesh.</h1>
          <p>Here’s how people are responding to your latest product test.</p>
        </div>
        <div className="header-actions">
          <a className="button secondary" href={api.exportUrl(experiment.id)}>
            <ArrowDownToLine size={17} /> Export CSV
          </a>
          <button className="button primary" onClick={onTryExperiment}>
            Try participant view <ArrowRight size={17} />
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <article className="metric-card">
          <div className="metric-icon violet"><Users size={19} /></div>
          <span>Total responses</span>
          <strong>{analytics.total_responses}</strong>
          <small><b>+24</b> in the last 24 hours</small>
        </article>
        <article className="metric-card">
          <div className="metric-icon coral"><Clock3 size={19} /></div>
          <span>Average decision time</span>
          <strong>{formatSeconds(analytics.average_latency_ms)}</strong>
          <small>Across all variations</small>
        </article>
        <article className="metric-card">
          <div className="metric-icon green"><CheckCircle2 size={19} /></div>
          <span>Average confidence</span>
          <strong>{analytics.average_confidence}<em>/ 5</em></strong>
          <small>Self-reported certainty</small>
        </article>
        <article className="metric-card">
          <div className="metric-icon amber"><MessageSquareText size={19} /></div>
          <span>Feedback coverage</span>
          <strong>72%</strong>
          <small>Participants left a comment</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel preference-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">PREFERENCE SPLIT</p><h2>Which variation won?</h2></div>
            <span className="status-pill"><i /> Live</span>
          </div>
          <div className="preference-content">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={choiceData} dataKey="value" innerRadius={67} outerRadius={94} startAngle={90} endAngle={-270} strokeWidth={0}>
                    <Cell fill="#7467e8" /><Cell fill="#ef6d4e" />
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} responses`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-center"><strong>{analytics.choices[1]?.percentage}%</strong><span>choose B</span></div>
            </div>
            <div className="choice-legend">
              {analytics.choices.map((choice) => (
                <div key={choice.label}>
                  <i className={choice.label === "A" ? "dot-a" : "dot-b"} />
                  <span>Variation {choice.label}<small>{choice.count} responses</small></span>
                  <strong>{choice.percentage}%</strong>
                </div>
              ))}
            </div>
          </div>
          <div className={`insight ${analytics.is_significant ? "significant" : ""}`}>
            <CheckCircle2 size={18} />
            <div><strong>{analytics.is_significant ? "Statistically significant result" : "Collecting more evidence"}</strong><span>{analytics.effect_summary} p = {analytics.p_value.toFixed(4)}, 95% CI {analytics.confidence_interval[0]}–{analytics.confidence_interval[1]}%.</span></div>
          </div>
        </article>

        <article className="panel segment-panel">
          <div className="panel-heading"><div><p className="eyebrow">BEHAVIOR BY DEVICE</p><h2>Preference for Variation B</h2></div></div>
          <ResponsiveContainer width="100%" height={245}>
            <BarChart data={analytics.device_segments} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid horizontal={false} stroke="#ecebe7" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="segment" axisLine={false} tickLine={false} width={68} />
              <Tooltip formatter={(value) => [`${value}%`, "Chose B"]} />
              <Bar dataKey="variation_b_percentage" fill="#7467e8" radius={[0, 6, 6, 0]} barSize={23} />
            </BarChart>
          </ResponsiveContainer>
          <p className="association-note">Association, not causation. Device differences may reflect participant mix or context.</p>
        </article>
      </section>

      <section className="panel responses-panel">
        <div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Latest participant responses</h2></div><button className="text-button">View all <ArrowRight size={15} /></button></div>
        <div className="response-table">
          <div className="response-row table-head"><span>Choice</span><span>Confidence</span><span>Decision time</span><span>Device</span><span>Feedback</span></div>
          {analytics.recent_responses.map((response) => (
            <div className="response-row" key={response.id}>
              <span><b className={`choice-badge choice-${response.selected_label.toLowerCase()}`}>{response.selected_label}</b> Variation {response.selected_label}</span>
              <span className="confidence-dots">{[1,2,3,4,5].map((dot) => <i className={dot <= response.confidence_score ? "filled" : ""} key={dot} />)}</span>
              <span>{formatSeconds(response.decision_latency_ms)}</span>
              <span className="capitalize">{response.device_type}</span>
              <span className="feedback-cell">{response.feedback || "No written feedback"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

