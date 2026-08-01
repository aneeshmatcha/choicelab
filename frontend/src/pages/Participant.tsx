import { ArrowRight, Bookmark, CalendarDays, Check, Clock3, Coffee, Compass, LockKeyhole, MapPin, Route, ShieldCheck, Sparkles, Star, Utensils, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { Experiment, ResponsePayload, StudySettings, Variation } from "../types";
import { Logo } from "../components/Logo";

interface ParticipantProps {
  experiment: Experiment;
  settings: StudySettings;
  onAdminAccess: () => void;
}

function detectDevice(): ResponsePayload["device_type"] {
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

function ProductMockup({ variation }: { variation: Variation }) {
  const [activeDay, setActiveDay] = useState(1);
  const [filter, setFilter] = useState("Culture");
  const [saved, setSaved] = useState<string[]>(["Trastevere"]);
  const itinerary = {
    1: [["09:00", "Roscioli breakfast", "45 min · $18"], ["10:15", "Roman Forum", "2 hr · $24"], ["13:00", "Monti lunch", "1.5 hr · $32"]],
    2: [["09:30", "Vatican Museums", "3 hr · $35"], ["13:15", "Prati market", "1 hr · $22"], ["16:00", "Villa Borghese", "2 hr · Free"]],
    3: [["10:00", "Trastevere walk", "2 hr · Free"], ["12:30", "Pasta workshop", "2.5 hr · $68"], ["17:00", "Gianicolo sunset", "1 hr · Free"]],
  } as const;

  function toggleSaved(place: string) {
    setSaved((current) => current.includes(place) ? current.filter((item) => item !== place) : [...current, place]);
  }

  if (variation.label === "A") {
    return (
      <div className="product-experience itinerary-experience">
        <div className="experience-bar"><span className="experience-brand"><Compass size={13} /> Roamly</span><span>Rome escape · May 14–17</span><b>3 travelers</b></div>
        <div className="itinerary-toolbar">
          <div><small>YOUR ITINERARY</small><strong>Three perfect days in Rome</strong></div>
          <span><WalletCards size={12} /> $684 planned</span>
        </div>
        <div className="day-tabs" aria-label="Itinerary days">
          {[1, 2, 3].map((day) => <button type="button" className={activeDay === day ? "active" : ""} onClick={() => setActiveDay(day)} key={day}>Day {day}<small>{day === 1 ? "Historic core" : day === 2 ? "Art & parks" : "Local Rome"}</small></button>)}
        </div>
        <div className="itinerary-content">
          <div className="timeline-list">
            {itinerary[activeDay as keyof typeof itinerary].map(([time, place, detail], index) => (
              <div className="timeline-item" key={place}>
                <span>{time}</span><i>{index === 0 ? <Coffee size={12} /> : index === 1 ? <CalendarDays size={12} /> : <Utensils size={12} />}</i>
                <div><strong>{place}</strong><small>{detail}</small></div><button type="button" aria-label={`Save ${place}`} onClick={() => toggleSaved(place)}><Bookmark size={12} fill={saved.includes(place) ? "currentColor" : "none"} /></button>
              </div>
            ))}
          </div>
          <aside className="plan-summary">
            <span><Route size={13} /> Day {activeDay} route</span>
            <div className="mini-route"><i /><i /><i /><b /></div>
            <dl><div><dt>Walking</dt><dd>3.8 km</dd></div><div><dt>Activities</dt><dd>3</dd></div><div><dt>Estimated</dt><dd>${activeDay === 1 ? "74" : activeDay === 2 ? "57" : "68"}</dd></div></dl>
          </aside>
        </div>
      </div>
    );
  }

  const places = [
    { name: "Trastevere", type: "Food", rating: "4.9", detail: "Lively lanes · 12 min" },
    { name: "Galleria Doria", type: "Culture", rating: "4.8", detail: "Palazzo art · 8 min" },
    { name: "Aventine Keyhole", type: "Hidden gems", rating: "4.7", detail: "City view · 18 min" },
  ];
  return (
    <div className="product-experience map-experience">
      <div className="experience-bar"><span className="experience-brand"><Compass size={13} /> Roamly</span><span>Explore Rome</span><b>{saved.length} saved</b></div>
      <div className="map-filters" aria-label="Place categories">{["Culture", "Food", "Hidden gems"].map((item) => <button type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item === "Food" ? <Utensils size={11} /> : item === "Culture" ? <CalendarDays size={11} /> : <Sparkles size={11} />}{item}</button>)}</div>
      <div className="map-workspace">
        <div className="abstract-map">
          <span className="river" /><i className="road r1" /><i className="road r2" /><i className="road r3" />
          {places.map((place, index) => <button type="button" className={`map-pin pin-${index + 1} ${place.type === filter ? "active" : ""}`} aria-label={`View ${place.name}`} onClick={() => toggleSaved(place.name)} key={place.name}><MapPin size={13} fill="currentColor" /></button>)}
          <div className="map-area-label">CENTRO STORICO</div><div className="map-area-label south">TRASTEVERE</div>
        </div>
        <aside className="place-results">
          <div className="results-heading"><span><strong>{filter}</strong><small>Curated for your trip</small></span><b>24 places</b></div>
          {places.filter((place) => place.type === filter || filter === "Culture").slice(0, 2).map((place) => (
            <div className="place-card" key={place.name}>
              <div className={`place-image place-${place.type.toLowerCase().replace(" ", "-")}`}><span>{place.type}</span></div>
              <div><strong>{place.name}</strong><span><Star size={10} fill="currentColor" /> {place.rating}</span><small>{place.detail}</small></div>
              <button type="button" aria-label={`Save ${place.name}`} onClick={() => toggleSaved(place.name)}><Bookmark size={12} fill={saved.includes(place.name) ? "currentColor" : "none"} /></button>
            </div>
          ))}
          <button type="button" className="build-trip"><Route size={12} /> Build route from saved places</button>
        </aside>
      </div>
    </div>
  );
}

export function Participant({ experiment, settings, onAdminAccess }: ParticipantProps) {
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
    return settings.randomizeVariations && Math.random() > 0.5 ? copy.reverse() : copy;
  }, [experiment.variations, settings.randomizeVariations]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!settings.studyActive) {
    return <div className="participant-page"><header className="participant-header"><Logo /><button className="text-button admin-entry" onClick={onAdminAccess}><LockKeyhole size={15} /> Admin login</button></header><main className="study-paused"><span><Clock3 size={24} /></span><p className="eyebrow">STUDY PAUSED</p><h1>This experiment is not accepting responses right now.</h1><p>Please check back later. Existing responses remain available to the ChoiceLab administrator.</p></main></div>;
  }

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
        <header className="participant-header"><Logo /><button className="text-button" onClick={onAdminAccess}><LockKeyhole size={15} /> Admin login</button></header>
        <section className="success-card">
          <div className="success-icon"><Check size={30} /></div>
          <p className="eyebrow">RESPONSE RECORDED</p>
          <h1>Thanks for sharing your perspective.</h1>
          <p>Your anonymous response is now part of the live ChoiceLab dataset.</p>
          <div className="receipt">
            <span>Your choice <strong>Variation {selected?.label}</strong></span>
            <span>Decision time <strong>{((selectionLatency ?? 0) / 1000).toFixed(1)} seconds</strong></span>
          </div>
          <button className="button primary" onClick={() => window.location.reload()}>Try the experiment again <ArrowRight size={17} /></button>
        </section>
      </div>
    );
  }

  return (
    <div className="participant-page">
      <header className="participant-header"><Logo /><button className="text-button admin-entry" onClick={onAdminAccess}><LockKeyhole size={15} /> Admin login</button></header>
      <main className="experiment-main">
        <div className="experiment-intro">
          <span className="step-label">INTERACTIVE PRODUCT STUDY · 1 OF 1</span>
          <h1>{experiment.title}</h1>
          <p>{experiment.description}</p>
          <div className="privacy-note"><ShieldCheck size={15} /> Anonymous · explore both concepts before choosing</div>
        </div>

        <section className="variation-grid">
          {variations.map((variation) => (
            <article key={variation.id} className={`variation-card ${selected?.id === variation.id ? "selected" : ""}`}>
              <div className="variation-top"><span>VARIATION {variation.label}</span>{selected?.id === variation.id && <i><Check size={14} /></i>}</div>
              <ProductMockup variation={variation} />
              <h2>{variation.title}</h2>
              <p>{variation.description}</p>
              <div className="variation-meta"><span><Clock3 size={12} /> Explore the controls above</span><span>{variation.label === "A" ? "Timeline · Budget · Route" : "Map · Filters · Saved places"}</span></div>
              <button type="button" className={`choose-variation ${selected?.id === variation.id ? "selected" : ""}`} onClick={() => choose(variation)}>{selected?.id === variation.id ? <><Check size={15} /> Variation {variation.label} selected</> : <>Choose variation {variation.label} <ArrowRight size={15} /></>}</button>
            </article>
          ))}
        </section>

        <section className={`follow-up ${selected ? "visible" : ""}`} aria-hidden={!selected}>
          <div className="follow-up-heading"><Sparkles size={19} /><div><h2>Tell us about your choice</h2><p>This helps explain the behavior behind the result.</p></div></div>
          <div className="field-grid">
            {settings.collectConfidence && <label>How confident are you?<span className="rating-row">{[1,2,3,4,5].map((value) => <button key={value} className={confidence === value ? "active" : ""} onClick={() => setConfidence(value)}>{value}</button>)}</span><small>Not sure <i /> Very confident</small></label>}
            {settings.collectDemographics && <><label>Your product-design experience<select value={experience} onChange={(event) => setExperience(event.target.value as ResponsePayload["experience_level"])}><option value="new">New to product design</option><option value="intermediate">Some experience</option><option value="expert">Expert</option></select></label><label>Your age range<select value={ageRange} onChange={(event) => setAgeRange(event.target.value as ResponsePayload["age_range"])}><option value="18-24">18–24</option><option value="25-34">25–34</option><option value="35-44">35–44</option><option value="45+">45+</option><option value="prefer-not-to-say">Prefer not to say</option></select></label></>}
            {settings.collectFeedback && <label className="feedback-label">What influenced your choice? <em>Optional</em><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="The option I chose felt clearer because…" maxLength={2000} /></label>}
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="button primary submit-button" onClick={submit} disabled={!selected || submitting}>{submitting ? "Saving…" : "Submit response"} <ArrowRight size={17} /></button>
        </section>
      </main>
    </div>
  );
}
