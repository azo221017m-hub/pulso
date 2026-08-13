export interface DashboardMetrics {
  /** "🧠 PULSO TE ANTICIPÓ": risk detected + intervention sent + user interacted. Framed as insight, not competition. */
  pulsoAnticipatedCount: number;
  /** "🏆 MOMENTOS QUE SUPERASTE": main emotional metric — moments overcome without smoking. */
  momentsOvercomeCount: number;
  currentStreakDays: number;
}

export interface InsightsResponse {
  /** Template-generated "PULSO te conoce" sentences derived only from real computed data. */
  insights: string[];
}
