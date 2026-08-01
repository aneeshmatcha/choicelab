export interface Variation {
  id: number;
  label: "A" | "B";
  title: string;
  description: string;
  accent_color: string;
}

export interface Experiment {
  id: number;
  slug: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  variations: Variation[];
  response_count: number;
}

export interface ChoiceMetric {
  label: "A" | "B";
  count: number;
  percentage: number;
  average_latency_ms: number;
}

export interface SegmentMetric {
  segment: string;
  responses: number;
  variation_b_percentage: number;
  average_latency_ms: number;
}

export interface RecentResponse {
  id: number;
  selected_label: "A" | "B";
  confidence_score: number;
  decision_latency_ms: number;
  device_type: string;
  feedback: string;
  created_at: string;
}

export interface Analytics {
  experiment_id: number;
  total_responses: number;
  average_latency_ms: number;
  average_confidence: number;
  choices: ChoiceMetric[];
  p_value: number;
  confidence_interval: [number, number];
  is_significant: boolean;
  effect_summary: string;
  device_segments: SegmentMetric[];
  recent_responses: RecentResponse[];
}

export interface ResponsePayload {
  selected_variation_id: number;
  anonymous_id: string;
  decision_latency_ms: number;
  confidence_score: number;
  qualitative_feedback: string;
  device_type: "desktop" | "mobile" | "tablet";
  experience_level: "new" | "intermediate" | "expert";
  age_range: "18-24" | "25-34" | "35-44" | "45+" | "prefer-not-to-say";
}

export interface StudySettings {
  studyActive: boolean;
  randomizeVariations: boolean;
  collectConfidence: boolean;
  collectFeedback: boolean;
  collectDemographics: boolean;
  workspaceLabel: string;
}
