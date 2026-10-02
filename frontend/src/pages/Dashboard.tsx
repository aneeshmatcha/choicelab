import { ArrowDownToLine, ArrowRight, CheckCircle2, Clock3, Gauge, GitCompareArrows, MousePointerClick, Trophy, Users } from "lucide-react";
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
  const choiceA = analytics.choices[0];
  const choiceB = analytics.choices[1];
  const preferenceWinner = choiceA.percentage > choiceB.percentage ? "A" : "B";
  const successWinner = choiceA.task_success_rate > choiceB.task_success_rate ? "A" : "B";
  const evidenceConverges = preferenceWinner === successWinner;

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
          <span>Task success</span>
          <strong>{analytics.task_success_rate}%</strong>
          <small>Participants completing the task</small>
        </article>
        <article className="metric-card">
          <div className="metric-icon amber"><Gauge size={19} /></div>
          <span>Ease score</span>
          <strong>{analytics.average_ease_score}<em>/ 5</em></strong>
          <small>{analytics.average_interactions} interactions on average</small>
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
          <div className="behavior-note"><MousePointerClick size={15} /><span><strong>{analytics.average_interactions} interactions per response</strong>Choice alone does not show usability; task success and effort provide the outcome context.</span></div>
        </article>
      </section>

      <section className="panel ab-scorecard">
        <div className="panel-heading"><div><p className="eyebrow">A/B OUTCOME SCORECARD</p><h2>Preference is only one part of the result</h2><p>Compare what participants said with what they were actually able to do.</p></div><span className={`convergence-badge ${evidenceConverges ? "aligned" : "conflict"}`}><GitCompareArrows size={14} /> {evidenceConverges ? "Signals align" : "Signals conflict"}</span></div>
        <div className="scorecard-head"><span>Outcome</span><span className="score-a"><i>A</i><b>{experiment.variations.find((variation) => variation.label === "A")?.title}</b></span><span className="score-b"><i>B</i><b>{experiment.variations.find((variation) => variation.label === "B")?.title}</b></span><span>Difference</span></div>
        <div className="scorecard-row"><span><b>Preference</b><small>Stated choice</small></span><strong className={preferenceWinner === "A" ? "winner-a" : ""}>{choiceA.percentage}%</strong><strong className={preferenceWinner === "B" ? "winner-b" : ""}>{choiceB.percentage}%</strong><span className={choiceB.percentage >= choiceA.percentage ? "delta-b" : "delta-a"}>{Math.abs(choiceB.percentage - choiceA.percentage).toFixed(1)} pts {choiceB.percentage >= choiceA.percentage ? "toward B" : "toward A"}</span></div>
        <div className="scorecard-row"><span><b>Task success</b><small>Behavioral outcome</small></span><strong className={successWinner === "A" ? "winner-a" : ""}>{choiceA.task_success_rate}%</strong><strong className={successWinner === "B" ? "winner-b" : ""}>{choiceB.task_success_rate}%</strong><span className={choiceB.task_success_rate >= choiceA.task_success_rate ? "delta-b" : "delta-a"}>{Math.abs(choiceB.task_success_rate - choiceA.task_success_rate).toFixed(1)} pts {choiceB.task_success_rate >= choiceA.task_success_rate ? "toward B" : "toward A"}</span></div>
        <div className="scorecard-row"><span><b>Ease score</b><small>Perceived effort</small></span><strong className={choiceA.average_ease_score > choiceB.average_ease_score ? "winner-a" : ""}>{choiceA.average_ease_score}/5</strong><strong className={choiceB.average_ease_score >= choiceA.average_ease_score ? "winner-b" : ""}>{choiceB.average_ease_score}/5</strong><span className={choiceB.average_ease_score >= choiceA.average_ease_score ? "delta-b" : "delta-a"}>{Math.abs(choiceB.average_ease_score - choiceA.average_ease_score).toFixed(2)} points</span></div>
        <div className="scorecard-row"><span><b>Decision time</b><small>Lower is faster</small></span><strong className={choiceA.average_latency_ms < choiceB.average_latency_ms ? "winner-a" : ""}>{formatSeconds(choiceA.average_latency_ms)}</strong><strong className={choiceB.average_latency_ms <= choiceA.average_latency_ms ? "winner-b" : ""}>{formatSeconds(choiceB.average_latency_ms)}</strong><span className={choiceB.average_latency_ms <= choiceA.average_latency_ms ? "delta-b" : "delta-a"}>{formatSeconds(Math.abs(choiceB.average_latency_ms - choiceA.average_latency_ms))} faster</span></div>
        <div className={`scorecard-verdict ${evidenceConverges ? "aligned" : "conflict"}`}><Trophy size={18} /><div><strong>{evidenceConverges ? `Variation ${preferenceWinner} leads both preference and successful task completion.` : `Participants prefer Variation ${preferenceWinner}, but Variation ${successWinner} produces more successful tasks.`}</strong><span>{evidenceConverges ? "The stated and behavioral evidence point in the same direction; validate the magnitude in the next research round." : "Do not ship on preference alone. Investigate why the liked concept underperforms on the actual task."}</span></div></div>
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
