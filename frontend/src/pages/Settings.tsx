import { Check, RotateCcw, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import type { Experiment, StudySettings } from "../types";

interface SettingsProps {
  experiment: Experiment;
  settings: StudySettings;
  onSave: (settings: StudySettings) => void;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <button type="button" className={`setting-toggle ${checked ? "on" : ""}`} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><i /></button>;
}

export function Settings({ experiment, settings, onSave }: SettingsProps) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(settings), [settings]);

  function update<K extends keyof StudySettings>(key: K, value: StudySettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }
  function save() { onSave(draft); setSaved(true); window.setTimeout(() => setSaved(false), 2200); }

  return (
    <div className="page settings-page">
      <header className="page-header"><div><p className="eyebrow">WORKSPACE SETTINGS</p><h1>Experiment configuration</h1><p>Control what participants see and which behavioral signals ChoiceLab collects.</p></div><button className="button primary" onClick={save}>{saved ? <><Check size={17} /> Saved</> : <><Save size={17} /> Save changes</>}</button></header>
      <div className="settings-layout">
        <section className="settings-main">
          <article className="settings-card"><div className="settings-card-heading"><span><SlidersHorizontal size={18} /></span><div><h2>Study behavior</h2><p>Changes apply to the participant experience on this device.</p></div></div>
            <div className="setting-row"><div><strong>Study is accepting responses</strong><p>When paused, participants see a closed-study message.</p></div><Toggle checked={draft.studyActive} onChange={(value) => update("studyActive", value)} /></div>
            <div className="setting-row"><div><strong>Randomize variation order</strong><p>Alternate which concept appears first to reduce order bias.</p></div><Toggle checked={draft.randomizeVariations} onChange={(value) => update("randomizeVariations", value)} /></div>
            <div className="setting-row"><div><strong>Collect confidence</strong><p>Ask participants to rate certainty from one to five.</p></div><Toggle checked={draft.collectConfidence} onChange={(value) => update("collectConfidence", value)} /></div>
            <div className="setting-row"><div><strong>Collect written feedback</strong><p>Show the optional explanation field after a choice.</p></div><Toggle checked={draft.collectFeedback} onChange={(value) => update("collectFeedback", value)} /></div>
            <div className="setting-row"><div><strong>Collect participant profile</strong><p>Ask age range and product-design experience.</p></div><Toggle checked={draft.collectDemographics} onChange={(value) => update("collectDemographics", value)} /></div>
          </article>
          <article className="settings-card"><div className="settings-card-heading"><span><ShieldCheck size={18} /></span><div><h2>Workspace identity</h2><p>Customize the label shown inside the admin workspace.</p></div></div><label className="settings-input">Workspace label<input value={draft.workspaceLabel} onChange={(event) => update("workspaceLabel", event.target.value.slice(0, 40))} /></label><div className="security-callout"><ShieldCheck size={17} /><span><strong>Privacy baseline</strong>Participant IDs remain anonymous and analytics access requires an HTTP-only admin session.</span></div></article>
        </section>
        <aside className="settings-summary"><p className="eyebrow">CURRENT STUDY</p><h2>{experiment.title}</h2><span className={`study-state ${draft.studyActive ? "active" : "paused"}`}><i /> {draft.studyActive ? "Accepting responses" : "Paused"}</span><dl><div><dt>Experiment ID</dt><dd>#{experiment.id.toString().padStart(4,"0")}</dd></div><div><dt>Variations</dt><dd>{experiment.variations.length}</dd></div><div><dt>Recorded responses</dt><dd>{experiment.response_count}</dd></div><div><dt>Order</dt><dd>{draft.randomizeVariations ? "Randomized" : "Fixed A → B"}</dd></div></dl><button className="reset-settings" onClick={() => setDraft({ studyActive:true, randomizeVariations:true, collectConfidence:true, collectFeedback:true, collectDemographics:true, workspaceLabel:"Demo workspace" })}><RotateCcw size={14} /> Restore defaults</button></aside>
      </div>
    </div>
  );
}

