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

export interface LungProgressWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  cigarettesSmoked: number;
  relapses: number;
  /** True when zero cigarettes were logged during this week. */
  completed: boolean;
}

export interface LungProgressMilestone {
  days: number;
  emoji: string;
  label: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface LungProgressResponse {
  /** Resets to 0 on relapse — "racha actual". */
  daysSmokeFree: number;
  /** Days since quitDate/createdAt, does NOT reset on relapse — drives cumulative stats. */
  journeyDays: number;
  currentWeek: number;
  weekMessage: string;
  cigarettesAvoided: number;
  totalCigarettesSmoked: number;
  relapseCount: number;
  progressRatio: number;
  weeklyTimeline: LungProgressWeek[];
  milestones: LungProgressMilestone[];
  medicalDisclaimer: string;
}
