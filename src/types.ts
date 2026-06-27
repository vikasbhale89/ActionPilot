export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type CategoryType = "Work" | "Study" | "Health" | "Finance" | "Personal";
export type ImportanceType = "Low" | "Medium" | "High" | "Critical";

export interface Task {
  id: string;
  title: string;
  description: string;
  category: CategoryType;
  deadline: string; // ISO string or simple date string
  importance: ImportanceType;
  estimatedEffort: number; // in hours
  progress: number; // 0 to 100
  completed: boolean;
  priorityScore?: number; // Calculated by AI, 0-100
  delayRisk?: number; // Predicted by AI, 0-100%
  delayRiskReason?: string; // Short explanation
  subtasks: Subtask[];
  actionabilityScore?: number; // 0-100
  actionabilityFeedback?: string;
  isEvaluating?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  category: string;
  hoursSpent: number;
  completed: boolean;
  timelinePlan?: {
    day: number;
    title: string;
    tasks: string[];
  }[];
  isGeneratingPlan?: boolean;
}

export interface ProductivityStats {
  averageProcrastination: number; // 1-10
  morningVelocity: number; // 1-10
  eveningVelocity: number; // 1-10
  dailyStreak: number;
  weeklyHoursStudied: number;
  xp?: number;
  level?: number;
  unlockedBadges?: string[];
  dailyCompletedCount?: number;
  dailyPostponedCount?: number;
  dailyLeftCount?: number;
  onTimeCompletionsCount?: number;
  earlyCompletionsCount?: number;
}

export interface CoachInsight {
  type: "timing" | "focus" | "alert" | "motivation";
  text: string;
  actionableTip: string;
}

export interface CoachData {
  greeting: string;
  insights: CoachInsight[];
}

export interface ContextTrigger {
  id: string;
  title: string;
  icon: string;
  location?: string;
  timeSlot?: string;
  prompt: string;
  description: string;
}

export interface UserSession {
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

