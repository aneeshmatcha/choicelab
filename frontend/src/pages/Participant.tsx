import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { Experiment, ResponsePayload, Variation } from "../types";
import { Logo } from "../components/Logo";

interface ParticipantProps {
  experiment: Experiment;
  onBack: () => void;
}

function detectDevice(): ResponsePayload["device_type"] {
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

function ProductMockup({ variation }: { variation: Variation }) {
  const focused = variation.label === "B";
  return (
    <div className={`product-mockup ${focused ? "focused" : "classic"}`}>
      <div className="mock-browser"><i /><i /><i /><span>secure.checkout</span></div>
      <div className="mock-body">
        <div className="mock-copy"><span>Complete your order</span><i /><i /><i className="short" /></div>
        <div className="mock-summary">
          <div><span>Order summary</span><b>$84.00</b></div>
          <i /><i /><i />
          {focused && <div className="trust-line"><ShieldCheck size={12} /> Secure checkout</div>}
          <span className="mock-button">{focused ? "Continue securely" : "Continue"}</span>
        </div>
      </div>
    </div>
  );
}

export function Participant({ experiment, onBack }: ParticipantProps) {
  const [startedAt] = useState(() => performance.now());
  const [selected, setSelected] = useState<Variation | null>(null);
  const [confidence, setConfidence] = useState(4);
  const [feedback, setFeedback] = useState("");
  const [experience, setExperience] = useState<ResponsePayload["experience_level"]>("intermediate");
  const [ageRange, setAgeRange] = useState<ResponsePayload["age_range"]>("25-34");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectionLatency, setSelectionLatency] = useState<number | null>(null);

  const variations = useMemo(() => {
    const copy = [...experiment.variations];
    return Math.random() > 0.5 ? copy.reverse() : copy;
  }, [experiment.variations]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function choose(variation: Variation) {
    if (!selectionLatency) setSelectionLatency(Math.round(performance.now() - startedAt));
    setSelected(variation);
  }

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      await api.submitResponse(experiment.id, {
        selected_variation_id: selected.id,
        anonymous_id: crypto.randomUUID(),
        decision_latency_ms: Math.max(100, selectionLatency ?? Math.round(performance.now() - startedAt)),
        confidence_score: confidence,
        qualitative_feedback: feedback,
        device_type: detectDevice(),
        experience_level: experience,
        age_range: ageRange,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your response.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="participant-page success-page">
        <Logo />
        <section className="success-card">
          <div className="success-icon"><Check size={30} /></div>
          <p className="eyebrow">RESPONSE RECORDED</p>
          <h1>Thanks for sharing your perspective.</h1>
          <p>Your anonymous response is now part of the live ChoiceLab dataset.</p>
          <div className="receipt">
            <span>Your choice <strong>Variation {selected?.label}</strong></span>
            <span>Decision time <strong>{((selectionLatency ?? 0) / 1000).toFixed(1)} seconds</strong></span>
          </div>
          <button className="button primary" onClick={onBack}>View updated dashboard <ArrowRight size={17} /></button>
        </section>
      </div>
    );
  }

  return (
    <div className="participant-page">
      <header className="participant-header"><Logo /><button className="text-button" onClick={onBack}><ArrowLeft size={16} /> Exit preview</button></header>
      <main className="experiment-main">
        <div className="experiment-intro">
          <span className="step-label">1 OF 1 · PRODUCT PREFERENCE</span>
          <h1>{experiment.title}</h1>
          <p>{experiment.description}</p>
          <div className="privacy-note"><ShieldCheck size={15} /> Anonymous · usually takes under one minute</div>
        </div>

        <section className="variation-grid">
          {variations.map((variation) => (
            <button key={variation.id} className={`variation-card ${selected?.id === variation.id ? "selected" : ""}`} onClick={() => choose(variation)}>
              <div className="variation-top"><span>VARIATION {variation.label}</span>{selected?.id === variation.id && <i><Check size={14} /></i>}</div>
              <ProductMockup variation={variation} />
              <h2>{variation.title}</h2>
              <p>{variation.description}</p>
              <span className="choose-label">{selected?.id === variation.id ? "Selected" : `Choose variation ${variation.label}`} <ArrowRight size={15} /></span>
            </button>
          ))}
        </section>

        <section className={`follow-up ${selected ? "visible" : ""}`} aria-hidden={!selected}>
          <div className="follow-up-heading"><Sparkles size={19} /><div><h2>Tell us about your choice</h2><p>This helps explain the behavior behind the result.</p></div></div>
          <div className="field-grid">
            <label>How confident are you?<span className="rating-row">{[1,2,3,4,5].map((value) => <button key={value} className={confidence === value ? "active" : ""} onClick={() => setConfidence(value)}>{value}</button>)}</span><small>Not sure <i /> Very confident</small></label>
            <label>Your product-design experience<select value={experience} onChange={(event) => setExperience(event.target.value as ResponsePayload["experience_level"])}><option value="new">New to product design</option><option value="intermediate">Some experience</option><option value="expert">Expert</option></select></label>
            <label>Your age range<select value={ageRange} onChange={(event) => setAgeRange(event.target.value as ResponsePayload["age_range"])}><option value="18-24">18–24</option><option value="25-34">25–34</option><option value="35-44">35–44</option><option value="45+">45+</option><option value="prefer-not-to-say">Prefer not to say</option></select></label>
            <label className="feedback-label">What influenced your choice? <em>Optional</em><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="The option I chose felt clearer because…" maxLength={2000} /></label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="button primary submit-button" onClick={submit} disabled={!selected || submitting}>{submitting ? "Saving…" : "Submit response"} <ArrowRight size={17} /></button>
        </section>
      </main>
    </div>
  );
}
