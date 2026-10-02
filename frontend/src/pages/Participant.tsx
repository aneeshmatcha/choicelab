import { ArrowRight, Bookmark, CalendarDays, Check, Clock3, Coffee, Compass, CreditCard, LockKeyhole, MapPin, PackageCheck, Route, ShieldCheck, ShoppingBag, Sparkles, Star, Utensils, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { Experiment, ResponsePayload, StudySettings, Variation } from "../types";
import { Logo } from "../components/Logo";

interface ParticipantProps {
  experiment: Experiment;
  experiments: Experiment[];
  settings: StudySettings;
  onSelectExperiment: (experiment: Experiment) => void;
  onAdminAccess: () => void;
}

function detectDevice(): ResponsePayload["device_type"] {
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

function CheckoutMockup({ variation, onInteraction }: { variation: Variation; onInteraction: () => void }) {
  const [shipping, setShipping] = useState("standard");
  const [step, setStep] = useState(1);
  if (variation.label === "A") return <div className="product-experience commerce-experience" onClickCapture={onInteraction}><div className="experience-bar"><span className="experience-brand"><Compass size={13} /> Roamly</span><span>Rome booking</span><b>2 travelers</b></div><div className="checkout-layout"><div className="checkout-form"><strong>Traveler details</strong><div className="mock-input">Aneesh Matcha</div><div className="mock-input">2 travelers · May 14–17</div><strong>Trip protection</strong>{[["standard", "Essential · Included"], ["express", "Flexible · $42"]].map(([value,label]) => <button className={`shipping-row ${shipping === value ? "active" : ""}`} onClick={() => setShipping(value)} key={value}><i />{label}<small>{value === "standard" ? "Basic coverage" : "Cancel anytime"}</small></button>)}<strong>Payment</strong><div className="mock-input"><CreditCard size={12} /> •••• 4242</div></div><aside className="order-card"><span className="mock-product"><Compass size={20} /></span><strong>Rome escape</strong><small>3 nights · 2 travelers</small><dl><div><dt>Trip</dt><dd>$1,284</dd></div><div><dt>Protection</dt><dd>{shipping === "express" ? "$42" : "Included"}</dd></div><div><dt>Total</dt><dd>${shipping === "express" ? "1,326" : "1,284"}</dd></div></dl><button>Book trip <ArrowRight size={11} /></button></aside></div></div>;
  return <div className="product-experience commerce-experience" onClickCapture={onInteraction}><div className="experience-bar"><span className="experience-brand"><Compass size={13} /> Roamly</span><span>Rome booking</span><b>Step {step} of 3</b></div><div className="guided-checkout"><div className="checkout-progress">{[1,2,3].map((value) => <button className={step >= value ? "active" : ""} onClick={() => setStep(value)} key={value}><i>{step > value ? <Check size={9} /> : value}</i><span>{value === 1 ? "Travelers" : value === 2 ? "Protect" : "Review"}</span></button>)}</div><section><span className="guided-icon">{step === 1 ? <PackageCheck size={22} /> : step === 2 ? <ShieldCheck size={22} /> : <Compass size={22} />}</span><small>STEP {step} OF 3</small><strong>{step === 1 ? "Who is traveling?" : step === 2 ? "Protect this trip?" : "Ready for Rome?"}</strong><p>{step === 1 ? "Confirm the two travelers on this booking." : step === 2 ? "Choose flexible protection or continue with essentials." : "3 nights · 2 travelers · $1,284"}</p><div className="guided-options"><button className="active">{step === 1 ? "Aneesh + 1 traveler" : step === 2 ? "Essential · Included" : "Visa •••• 4242"}<Check size={11} /></button><button>{step === 1 ? "Edit travelers" : step === 2 ? "Flexible · $42" : "Edit booking"}</button></div><button className="guided-next" onClick={() => setStep(Math.min(3, step + 1))}>{step === 3 ? "Book trip" : "Continue"} <ArrowRight size={11} /></button></section></div></div>;
}

function PricingMockup({ variation, onInteraction }: { variation: Variation; onInteraction: () => void }) {
  const [annual, setAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("Team");
  const price = (monthly: number) => annual ? Math.round(monthly * .8) : monthly;
  if (variation.label === "A") return <div className="product-experience pricing-experience" onClickCapture={onInteraction}><div className="experience-bar"><span className="experience-brand"><Compass size={13} /> Roamly</span><span>Memberships</span><b>{annual ? "Annual" : "Monthly"}</b></div><div className="pricing-head"><strong>Compare every travel benefit</strong><button onClick={() => setAnnual(!annual)}>{annual ? "Annual · save 20%" : "Monthly billing"}</button></div><div className="plan-table"><div className="plan-row table-title"><span>Benefits</span>{["Free", "Plus", "Explorer"].map((plan) => <button className={selectedPlan === plan ? "active" : ""} onClick={() => setSelectedPlan(plan)} key={plan}><strong>{plan}</strong><small>${price(plan === "Free" ? 0 : plan === "Plus" ? 12 : 24)}/mo</small></button>)}</div>{[["Saved trips","3","Unlimited","Unlimited"],["Price alerts","—","✓","✓"],["Shared trips","—","✓","✓"],["Concierge","—","—","✓"]].map((row) => <div className="plan-row" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div></div>;
  return <div className="product-experience pricing-experience" onClickCapture={onInteraction}><div className="experience-bar"><span className="experience-brand"><Compass size={13} /> Roamly</span><span>Memberships</span><b>{annual ? "Save 20%" : "Flexible"}</b></div><div className="pricing-head"><strong>How do you like to travel?</strong><button onClick={() => setAnnual(!annual)}>{annual ? "Annual billing" : "Monthly billing"}</button></div><div className="recommendation-plans">{[["Free","For an occasional escape",0],["Plus","Price alerts + shared trips",12],["Explorer","For frequent travelers",24]].map(([plan,detail,monthly]) => <button className={`${selectedPlan === plan ? "active" : ""} ${plan === "Plus" ? "recommended" : ""}`} onClick={() => setSelectedPlan(String(plan))} key={String(plan)}>{plan === "Plus" && <i>BEST MATCH</i>}<strong>{plan}</strong><small>{detail}</small><b>${price(Number(monthly))}<em>/mo</em></b><span>{selectedPlan === plan ? "Selected" : "Choose plan"}</span></button>)}</div><p className="pricing-footnote">Change or cancel any time · Benefits apply to every trip</p></div>;
}

function OnboardingMockup({ variation, onInteraction }: { variation: Variation; onInteraction: () => void }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(["Food"]);
  const toggle = (item: string) => setSelected((items) => items.includes(item) ? items.filter((value) => value !== item) : [...items, item]);
  if (variation.label === "A") return <div className="product-experience onboarding-experience" onClickCapture={onInteraction}><div className="experience-bar"><span className="experience-brand"><Compass size={13} /> Roamly</span><span>Personalize Roamly</span><b>{selected.length + 1}/4 complete</b></div><div className="onboarding-shell"><aside><small>YOUR PROFILE</small><strong>Make every trip yours</strong><p>Complete these in any order.</p>{["Travel style", "Interests", "Budget", "Home airport"].map((item,index) => <button className={index < selected.length ? "done" : ""} onClick={() => setStep(index + 1)} key={item}><i>{index < selected.length ? <Check size={9} /> : index + 1}</i><span>{item}<small>{index < selected.length ? "Saved" : "2 min"}</small></span></button>)}</aside><section><span className="guided-icon"><Sparkles size={22} /></span><small>INTERESTS</small><strong>What makes a trip memorable?</strong><p>Choose as many as you like.</p><div className="interest-grid">{["Food", "Culture", "Nature", "Nightlife"].map((item) => <button className={selected.includes(item) ? "active" : ""} onClick={() => toggle(item)} key={item}>{item}{selected.includes(item) && <Check size={10} />}</button>)}</div></section></div></div>;
  return <div className="product-experience onboarding-experience" onClickCapture={onInteraction}><div className="experience-bar"><span className="experience-brand"><Compass size={13} /> Roamly</span><span>Let’s get to know you</span><b>{step} of 4</b></div><div className="guided-onboarding"><div className="onboarding-progress"><i style={{ width: `${step * 25}%` }} /></div><small>QUESTION {step} OF 4</small><strong>{step === 1 ? "What do you travel for?" : step === 2 ? "What is your trip style?" : step === 3 ? "What feels comfortable?" : "You’re ready to explore"}</strong><p>{step === 4 ? "Roamly found 18 trips that match your profile." : "Your answers shape the recommendations you see."}</p>{step < 4 ? <div className="onboarding-choices">{(step === 1 ? ["Food", "Culture", "Nature"] : step === 2 ? ["Slow & local", "See it all", "A bit of both"] : ["Budget", "Mid-range", "Premium"]).map((item) => <button className={selected.includes(item) ? "active" : ""} onClick={() => toggle(item)} key={item}>{item}</button>)}</div> : <div className="recommendation-result"><MapPin size={18} /><span><strong>Rome, Italy</strong><small>94% match · Food + culture</small></span></div>}<button className="guided-next" onClick={() => setStep(Math.min(4, step + 1))}>{step === 4 ? "Explore Rome" : "Continue"} <ArrowRight size={11} /></button></div></div>;
}

function ProductMockup({ variation, experiment, onInteraction }: { variation: Variation; experiment: Experiment; onInteraction: () => void }) {
  if (experiment.template_key === "checkout") return <CheckoutMockup variation={variation} onInteraction={onInteraction} />;
  if (experiment.template_key === "pricing") return <PricingMockup variation={variation} onInteraction={onInteraction} />;
  if (experiment.template_key === "onboarding") return <OnboardingMockup variation={variation} onInteraction={onInteraction} />;
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
      <div className="product-experience itinerary-experience" onClickCapture={onInteraction}>
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
    <div className="product-experience map-experience" onClickCapture={onInteraction}>
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

export function Participant({ experiment, experiments, settings, onSelectExperiment, onAdminAccess }: ParticipantProps) {
  const [startedAt] = useState(() => performance.now());
  const [selected, setSelected] = useState<Variation | null>(null);
  const [confidence, setConfidence] = useState(4);
  const [taskCompleted, setTaskCompleted] = useState(true);
  const [easeScore, setEaseScore] = useState(4);
  const [interactionCount, setInteractionCount] = useState(0);
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
        task_completed: taskCompleted,
        ease_score: easeScore,
        interaction_count: interactionCount,
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
    const currentIndex = experiments.findIndex((item) => item.id === experiment.id);
    const nextExperiment = experiments[currentIndex + 1];
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
            <span>Task outcome <strong>{taskCompleted ? "Completed" : "Not completed"}</strong></span>
            <span>Interactions <strong>{interactionCount}</strong></span>
          </div>
          <button className="button primary" onClick={() => nextExperiment ? onSelectExperiment(nextExperiment) : window.location.reload()}>{nextExperiment ? "Continue to the next study" : "Try the experiment again"} <ArrowRight size={17} /></button>
        </section>
      </div>
    );
  }

  return (
    <div className="participant-page">
      <header className="participant-header"><Logo /><div className="participant-header-actions"><label>Study<select value={experiment.id} onChange={(event) => { const next = experiments.find((item) => item.id === Number(event.target.value)); if (next) onSelectExperiment(next); }}>{experiments.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><button className="text-button admin-entry" onClick={onAdminAccess}><LockKeyhole size={15} /> Admin login</button></div></header>
      <main className="experiment-main">
        <div className="experiment-intro">
          <span className="step-label">{experiment.test_type.replace("-", " ").toUpperCase()} STUDY · {experiments.findIndex((item) => item.id === experiment.id) + 1} OF {experiments.length}</span>
          <h1>{experiment.title}</h1>
          <p>{experiment.description}</p>
          <div className="task-prompt"><Sparkles size={14} /><span><b>Your task</b>{experiment.task_prompt}</span></div>
          <div className="privacy-note"><ShieldCheck size={15} /> Anonymous · explore both concepts before choosing</div>
        </div>

        <section className="variation-grid">
          {variations.map((variation) => (
            <article key={variation.id} className={`variation-card ${selected?.id === variation.id ? "selected" : ""}`}>
              <div className="variation-top"><span>VARIATION {variation.label}</span>{selected?.id === variation.id && <i><Check size={14} /></i>}</div>
              <ProductMockup variation={variation} experiment={experiment} onInteraction={() => setInteractionCount((count) => count + 1)} />
              <h2>{variation.title}</h2>
              <p>{variation.description}</p>
              <div className="variation-meta"><span><Clock3 size={12} /> Explore the controls above</span><span>{experiment.template_key === "checkout" ? (variation.label === "A" ? "Form · Protection · Summary" : "Steps · Progress · Review") : experiment.template_key === "pricing" ? (variation.label === "A" ? "Table · Benefits · Billing" : "Cards · Match · Trial") : experiment.template_key === "onboarding" ? (variation.label === "A" ? "Checklist · Flexible order" : "Questions · Recommendation") : (variation.label === "A" ? "Timeline · Budget · Route" : "Map · Filters · Saved places")}</span></div>
              <button type="button" className={`choose-variation ${selected?.id === variation.id ? "selected" : ""}`} onClick={() => choose(variation)}>{selected?.id === variation.id ? <><Check size={15} /> Variation {variation.label} selected</> : <>Choose variation {variation.label} <ArrowRight size={15} /></>}</button>
            </article>
          ))}
        </section>

        <section className={`follow-up ${selected ? "visible" : ""}`} aria-hidden={!selected}>
          <div className="follow-up-heading"><Sparkles size={19} /><div><h2>Tell us about your choice</h2><p>This helps explain the behavior behind the result.</p></div></div>
          <div className="field-grid">
            <label>Did you complete the task?<span className="binary-choice"><button className={taskCompleted ? "active" : ""} onClick={() => setTaskCompleted(true)}><Check size={13} /> Yes</button><button className={!taskCompleted ? "active" : ""} onClick={() => setTaskCompleted(false)}>Not quite</button></span></label>
            <label>How easy was the task?<span className="rating-row">{[1,2,3,4,5].map((value) => <button key={value} className={easeScore === value ? "active" : ""} onClick={() => setEaseScore(value)}>{value}</button>)}</span><small>Difficult <i /> Effortless</small></label>
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
