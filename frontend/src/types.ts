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
  test_type: "preference" | "first-click" | "task-completion";
  template_key: "travel" | "checkout" | "pricing" | "onboarding";
  task_prompt: string;
  created_at: string;
  variations: Variation[];
  response_count: number;
}

export interface ExperimentCreate {
  title: string;
  description: string;
  status: "draft" | "active";
  test_type: Experiment["test_type"];
  template_key: Experiment["template_key"];
  task_prompt: string;
  variations: Array<Omit<Variation, "id">>;
}

export interface ChoiceMetric {
  label: "A" | "B";
  count: number;
  percentage: number;
  average_latency_ms: number;
  task_success_rate: number;
  average_ease_score: number;
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
  task_completed: boolean;
  ease_score: number;
  interaction_count: number;
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
  task_success_rate: number;
  average_ease_score: number;
  average_interactions: number;
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
  task_completed: boolean;
  ease_score: number;
  interaction_count: number;
  qualitative_feedback: string;
  device_type: "desktop" | "mobile" | "tablet";
  experience_level: "new" | "intermediate" | "expert";
  age_range: "18-24" | "25-34" | "35-44" | "45+" | "prefer-not-to-say";
}

export interface ProgramExperimentMetric {
  experiment_id: number;
  title: string;
  template_key: Experiment["template_key"];
  status: string;
  total_responses: number;
  winning_label: "A" | "B";
  winning_percentage: number;
  task_success_rate: number;
  average_ease_score: number;
  average_latency_ms: number;
  is_significant: boolean;
}

export interface ProgramSummary {
  total_experiments: number;
  total_responses: number;
  overall_success_rate: number;
  average_ease_score: number;
  evidence_ready: number;
  experiments: ProgramExperimentMetric[];
}

export interface StudySettings {
  studyActive: boolean;
  randomizeVariations: boolean;
  collectConfidence: boolean;
  collectFeedback: boolean;
  collectDemographics: boolean;
  workspaceLabel: string;
}
