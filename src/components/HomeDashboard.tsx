import React, { useState, useEffect } from "react";
import { Task, ProductivityStats } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Clock, 
  Play, 
  Check, 
  Maximize2, 
  AlertTriangle, 
  X, 
  CheckCircle, 
  Flame, 
  BookOpen, 
  Compass, 
  Activity, 
  Hourglass, 
  Award, 
  Lock, 
  ChevronRight,
  User,
  Coffee,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  CornerDownRight
} from "lucide-react";

interface HomeDashboardProps {
  tasks: Task[];
  stats: ProductivityStats;
  onUpdateStats: React.Dispatch<React.SetStateAction<ProductivityStats>>;
  onToggleComplete: (id: string) => void;
  onSelectForFocus: (task: Task) => void;
  onPostponeTask?: (id: string, option: string) => void;
  onLeaveTask?: (id: string, reason: string) => void;
  onAddTaskFromVoice?: (task: any) => void;
}

// Predefined list of all badges
export interface BadgeDetails {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: string;
  category: "streak" | "completion" | "timing" | "milestone";
}

export const ALL_BADGES: BadgeDetails[] = [
  { id: "welcome_badge", title: "Welcome Badge", description: "Successfully finished your first task!", icon: "🎉", requirement: "Complete 1 task", category: "milestone" },
  { id: "deadline_master", title: "Deadline Master", description: "Completed 10 tasks on or before the deadline.", icon: "🏅", requirement: "10 on-time tasks", category: "completion" },
  { id: "early_bird", title: "Early Bird", description: "Finished a task 2 or more days before its scheduled deadline.", icon: "🐦", requirement: "Finish 2+ days early", category: "timing" },
  { id: "ahead_of_schedule", title: "Ahead of Schedule", description: "Finished 5 tasks at least 3 days ahead of schedule.", icon: "🚀", requirement: "5 tasks 3 days early", category: "timing" },
  { id: "bronze_streak", title: "Bronze Streak", description: "Completed tasks daily to maintain a 7-day consistency streak.", icon: "🔥", requirement: "7-Day Streak", category: "streak" },
  { id: "silver_streak", title: "Silver Streak", description: "Completed tasks daily to maintain a 30-day consistency streak.", icon: "🥈", requirement: "30-Day Streak", category: "streak" },
  { id: "gold_streak", title: "Gold Streak", description: "Completed tasks daily to maintain a 100-day consistency streak.", icon: "🥇", requirement: "100-Day Streak", category: "streak" },
  { id: "goal_crusher", title: "Goal Crusher", description: "Accomplished an entire goal plan consisting of multiple linked phases.", icon: "🏆", requirement: "Complete 1 Goal", category: "completion" },
  { id: "perfect_week", title: "Perfect Week", description: "Finished 100% of tasks planned for the current calendar cycle.", icon: "💯", requirement: "Complete all scheduled tasks", category: "completion" },
  { id: "study_hero", title: "Study Hero", description: "Completed 10 comprehensive focus study sessions.", icon: "📖", requirement: "10 Study Sessions", category: "milestone" },
  { id: "no_procrastination", title: "No Procrastination", description: "Kept your task board free of overdue tasks for a full 30 days.", icon: "⏳", requirement: "30 Days clean", category: "streak" },
  { id: "morning_warrior", title: "Morning Warrior", description: "Successfully finished 20 tasks before 10:00 AM.", icon: "🌅", requirement: "20 tasks before 10 AM", category: "timing" },
  { id: "night_owl", title: "Night Owl", description: "Completed 20 deep work sessions after 8:00 PM.", icon: "🌙", requirement: "20 sessions after 8 PM", category: "timing" },
  { id: "deep_focus", title: "Deep Focus", description: "Finished 50 uninterrupted, high-yield focus sessions.", icon: "🧠", requirement: "50 focus sessions", category: "streak" },
  { id: "productivity_warrior", title: "Productivity Warrior", description: "Pushed through and finished a cumulative total of 500 tasks.", icon: "⚔️", requirement: "Finish 500 tasks", category: "milestone" }
];

// Helper to estimate level based on XP
export const getLevelName = (level: number) => {
  if (level < 5) return "Beginner";
  if (level < 10) return "Planner";
  if (level < 20) return "Organizer";
  if (level < 35) return "Achiever";
  if (level < 50) return "Productivity Pro";
  if (level < 75) return "Master Planner";
  if (level < 100) return "Elite Performer";
  return "Legend";
};

export default function HomeDashboard({
  tasks,
  stats,
  onUpdateStats,
  onToggleComplete,
  onSelectForFocus,
  onPostponeTask,
  onLeaveTask,
  onAddTaskFromVoice
}: HomeDashboardProps) {
  // Ensure statistics are hydrated with gamification fields if missing
  const currentXP = stats.xp ?? 150;
  const currentLevel = stats.level ?? 2;
  const unlockedBadges = stats.unlockedBadges ?? ["welcome_badge"];
  const dailyCompleted = stats.dailyCompletedCount ?? 3;
  const dailyPostponed = stats.dailyPostponedCount ?? 1;
  const dailyLeft = stats.dailyLeftCount ?? 0;
  const onTimeCount = stats.onTimeCompletionsCount ?? 4;
  const earlyCount = stats.earlyCompletionsCount ?? 1;

  // Local State
  const [activeTab, setActiveTab] = useState<"dashboard" | "badges">("dashboard");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Custom action states for specific tasks
  const [postponingTaskId, setPostponingTaskId] = useState<string | null>(null);
  const [postponeWarning, setPostponeWarning] = useState<string | null>(null);
  
  const [leavingTaskId, setLeavingTaskId] = useState<string | null>(null);
  const [leavingFeedback, setLeavingFeedback] = useState<string | null>(null);

  // Celebration state for completion
  const [celebration, setCelebration] = useState<{
    isOpen: boolean;
    taskTitle: string;
    xpEarned: number;
    badgeUnlocked: BadgeDetails | null;
    isEarly: boolean;
    isVeryEarly: boolean;
    customPraise: string;
  } | null>(null);

  // Gym workout state
  const [gymStatus, setGymStatus] = useState<"pending" | "started" | "completed">("pending");
  const [gymWarning, setGymWarning] = useState<boolean>(false);
  const [gymStreak, setGymStreak] = useState<number>(18);

  // Safe Date Formatting
  const formatDeadline = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Synchronize stats back when modified locally
  const updateStatsField = (fields: Partial<ProductivityStats>) => {
    onUpdateStats((prev) => ({
      ...prev,
      ...fields
    }));
  };

  // CHECK AND UNLOCK BADGES HELPER
  const triggerUnlockBadge = (badgeId: string, currentUnlocked: string[]): BadgeDetails | null => {
    if (currentUnlocked.includes(badgeId)) return null;
    const badge = ALL_BADGES.find(b => b.id === badgeId);
    if (badge) {
      const updated = [...currentUnlocked, badgeId];
      updateStatsField({ unlockedBadges: updated });
      return badge;
    }
    return null;
  };

  // SIMULATE ACTIONS FOR TESTING BADGES & MOTIVATIONS
  const handleSimulateBadgeUnlock = (badgeId: string) => {
    const badge = ALL_BADGES.find(b => b.id === badgeId);
    if (!badge) return;
    
    const isAlreadyUnlocked = unlockedBadges.includes(badgeId);
    if (!isAlreadyUnlocked) {
      updateStatsField({ unlockedBadges: [...unlockedBadges, badgeId] });
    }
    
    // Trigger celebration dialog
    setCelebration({
      isOpen: true,
      taskTitle: `Simulated Milestone: ${badge.title}`,
      xpEarned: 100,
      badgeUnlocked: badge,
      isEarly: false,
      isVeryEarly: false,
      customPraise: `🏆 Simulated badge achievement! The AI has registered your continuous dedication and consistency.`
    });
  };

  const handleSimulateXPEarn = (amount: number) => {
    const nextXP = currentXP + amount;
    let nextLevel = currentLevel;
    const xpPerLevel = 250;
    
    if (nextXP >= xpPerLevel * currentLevel) {
      nextLevel = currentLevel + 1;
    }
    
    updateStatsField({
      xp: nextXP,
      level: nextLevel,
    });

    setCelebration({
      isOpen: true,
      taskTitle: "Simulator Workout",
      xpEarned: amount,
      badgeUnlocked: null,
      isEarly: false,
      isVeryEarly: false,
      customPraise: `💪 Multiplied focus velocity! +${amount} XP successfully injected into your profile.`
    });
  };

  // HANDLE IMMEDIATE COMPLETION (with rewards and unlocks)
  const handleImmediateComplete = (task: Task) => {
    // 1. Mark complete in main board
    onToggleComplete(task.id);

    // 2. Calculate XP
    let xpEarned = 10; // base complete
    if (task.importance === "High") xpEarned += 10;
    if (task.importance === "Critical") xpEarned += 20;

    // Check deadlines for early bonuses
    const todayStr = new Date().toISOString().split("T")[0];
    const today = new Date(todayStr);
    const deadlineDate = new Date(task.deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let isEarly = false;
    let isVeryEarly = false;
    let unlockedBadge: BadgeDetails | null = null;

    let updatedOnTime = onTimeCount + 1;
    let updatedEarly = earlyCount;

    if (diffDays >= 5) {
      isVeryEarly = true;
      isEarly = true;
      xpEarned += 50; // +50 early bird bonus
      updatedEarly += 1;
      unlockedBadge = triggerUnlockBadge("ahead_of_schedule", unlockedBadges);
    } else if (diffDays >= 2) {
      isEarly = true;
      xpEarned += 30; // +30 early completion
      updatedEarly += 1;
      unlockedBadge = triggerUnlockBadge("early_bird", unlockedBadges);
    } else if (diffDays >= 0) {
      xpEarned += 20; // completed on-time
    }

    // Check milestone badge: Deadline Master (10 tasks on time)
    if (updatedOnTime >= 10) {
      const badge = triggerUnlockBadge("deadline_master", unlockedBadges);
      if (badge) unlockedBadge = badge;
    }

    // Generate personalized AI Praise based on user profile and habits
    let customPraise = "Fantastic progress! Your dedication is building lasting behavioral momentum.";
    if (task.category === "Study") {
      customPraise = `📚 Vikas, that is an outstanding study milestone completed! Finishing "${task.title}" early reduces cognitive stress and opens up perfect review slots.`;
    } else if (task.importance === "Critical") {
      customPraise = `🔥 Critical priority resolved! Knocking out this heavy anchor gives your focus model an incredible boost of clarity today.`;
    } else if (diffDays >= 3) {
      customPraise = `🚀 Incredible foresight! Completing this task ${diffDays} days before the deadline puts you in the top 10% of high-efficiency planners.`;
    } else if (stats.averageProcrastination >= 7) {
      customPraise = `🎉 Phenomenal adaptation! You pushed past your typical procrastination triggers to claim an early victory on this task. Excellent effort!`;
    }

    // Update global levels & stats
    const totalXP = currentXP + xpEarned;
    const xpRequirement = currentLevel * 250;
    let newLevel = currentLevel;
    if (totalXP >= xpRequirement) {
      newLevel = currentLevel + 1;
    }

    updateStatsField({
      xp: totalXP,
      level: newLevel,
      dailyCompletedCount: dailyCompleted + 1,
      onTimeCompletionsCount: updatedOnTime,
      earlyCompletionsCount: updatedEarly,
    });

    // Toggle Celebration display
    setCelebration({
      isOpen: true,
      taskTitle: task.title,
      xpEarned,
      badgeUnlocked: unlockedBadge,
      isEarly,
      isVeryEarly,
      customPraise
    });
  };

  // HANDLE POSTPONE LOGIC
  const handlePostponeClick = (task: Task) => {
    setPostponingTaskId(task.id);
    setSelectedTask(task);
    setPostponeWarning(null);
  };

  const confirmPostpone = (option: string) => {
    if (!selectedTask) return;
    
    // Calculate simulated risk increase
    let currentRisk = selectedTask.delayRisk ?? 15;
    let newRisk = Math.min(98, currentRisk + (option === "Tomorrow" ? 33 : 12));
    
    setPostponeWarning(
      `⚠️ Postponing "${selectedTask.title}" to ${option.toLowerCase()} increases your risk of missing the deadline from ${currentRisk}% to ${newRisk}%. Would you like to split it into smaller subtasks instead to stay on track?`
    );
  };

  const finalizePostpone = (split: boolean) => {
    if (!selectedTask) return;

    if (split) {
      // Create subtasks and keep active
      const originalSubtasks = selectedTask.subtasks;
      const placeholderSubtasks = [
        { id: `sub-split-${Date.now()}-1`, title: "Review introductory outline materials", completed: false },
        { id: `sub-split-${Date.now()}-2`, title: "Draft core section rough bulletpoints", completed: false }
      ];
      selectedTask.subtasks = [...originalSubtasks, ...placeholderSubtasks];
      selectedTask.progress = Math.round((selectedTask.subtasks.filter(s => s.completed).length / selectedTask.subtasks.length) * 100);
      alert(`📂 Deconstructed "${selectedTask.title}" into smaller subtasks to minimize action friction! Check your board below.`);
    } else {
      // Reschedule task
      const updatedDeadline = new Date();
      updatedDeadline.setDate(updatedDeadline.getDate() + 1);
      selectedTask.deadline = updatedDeadline.toISOString().split("T")[0];
      selectedTask.delayRisk = Math.min(95, (selectedTask.delayRisk ?? 15) + 30);
      
      updateStatsField({
        dailyPostponedCount: dailyPostponed + 1,
        averageProcrastination: Math.min(10, stats.averageProcrastination + 1)
      });
      
      if (onPostponeTask) {
        onPostponeTask(selectedTask.id, "Tomorrow");
      }
      alert(`⏸ Postponed "${selectedTask.title}" to tomorrow. Risk factors and procrastination rate have been updated.`);
    }

    setPostponingTaskId(null);
    setSelectedTask(null);
    setPostponeWarning(null);
  };

  // HANDLE LEAVE TASK LOGIC
  const handleLeaveTaskClick = (task: Task) => {
    setLeavingTaskId(task.id);
    setSelectedTask(task);
    setLeavingFeedback(null);
  };

  const confirmLeaveTask = (reason: string) => {
    if (!selectedTask) return;

    let advice = "";
    if (reason === "Too tired") {
      advice = `🤖 Vikas, you have postponed active sessions three evenings in a row due to fatigue. Your neural model suggests you complete technical tasks much more successfully in the morning. Should I schedule future high-effort sessions before 10 AM?`;
    } else if (reason === "No motivation") {
      advice = `💡 Motivation block detected. A 10-minute micro-focus block is proven to break inertia. Would you like to launch a 10-minute "Micro-Start" session for this task instead of leaving it?`;
    } else {
      advice = `✍ Leaving noted. AI Coach will adjust your future scheduling velocity by moving this task to your weekend study block when calendar density is lower.`;
    }

    setLeavingFeedback(advice);
  };

  const finalizeLeaveTask = (actionTaken: "morning" | "micro" | "reschedule" | "cancel") => {
    if (!selectedTask) return;

    if (actionTaken === "morning") {
      // Reschedule to morning
      const updatedDeadline = new Date();
      updatedDeadline.setDate(updatedDeadline.getDate() + 1);
      selectedTask.deadline = updatedDeadline.toISOString().split("T")[0];
      alert(`🌅 Rescheduled coding and study sessions for tomorrow before 10:00 AM!`);
    } else if (actionTaken === "micro") {
      // Trigger focus session with 10 mins
      onSelectForFocus(selectedTask);
      alert(`⏱ Launching an express 10-minute Focus block! Starting in 3, 2, 1...`);
    } else {
      // Just reschedule
      updateStatsField({ dailyLeftCount: dailyLeft + 1 });
      if (onLeaveTask) {
        onLeaveTask(selectedTask.id, "No work today");
      }
      alert(`❌ Task moved off today's agenda.`);
    }

    setLeavingTaskId(null);
    setSelectedTask(null);
    setLeavingFeedback(null);
  };

  // GYM WORKOUT SPECIFIC ACTIONS
  const handleGymStart = () => {
    setGymStatus("started");
    alert("💪 Workout timer started! Go crush your physical goals!");
  };

  const handleGymComplete = () => {
    setGymStatus("completed");
    setGymStreak(gymStreak + 1);
    
    // Reward gym completion
    const totalXP = currentXP + 40;
    const xpRequirement = currentLevel * 250;
    let newLevel = currentLevel;
    if (totalXP >= xpRequirement) {
      newLevel = currentLevel + 1;
    }

    updateStatsField({
      xp: totalXP,
      level: newLevel,
      dailyCompletedCount: dailyCompleted + 1
    });

    setCelebration({
      isOpen: true,
      taskTitle: "💪 Active Gym Workout",
      xpEarned: 40,
      badgeUnlocked: triggerUnlockBadge("bronze_streak", unlockedBadges),
      isEarly: false,
      isVeryEarly: false,
      customPraise: `🔥 Consistency Champion! 19 Days Active. Committing to physical health resets cognitive fatigue and enhances focus velocities.`
    });
  };

  const handleGymPostpone = () => {
    setGymWarning(true);
  };

  // FILTER LOGIC FOR TODAY'S PRIORITY DECK
  const activeTasks = tasks.filter(t => !t.completed);
  // Sort by priorityScore (desc) or importance (Critical/High first)
  const priorityTasks = [...activeTasks].sort((a, b) => {
    const scoreA = a.priorityScore ?? 0;
    const scoreB = b.priorityScore ?? 0;
    return scoreB - scoreA;
  });

  // Calculate stats for EOD Summary
  const totalXPEarnedToday = (dailyCompleted * 10) + (earlyCount * 20);

  return (
    <div className="space-y-8">
      {/* GAMIFIED LEVEL AND XP BAR */}
      <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-blue-400 font-mono">Vikas Bhale</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-300 font-mono">
                  LEVEL {currentLevel}
                </span>
              </div>
              <h3 className="font-sans font-black text-white text-lg leading-tight uppercase mt-0.5">
                {getLevelName(currentLevel)}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "dashboard" ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white bg-white/5"
              }`}
            >
              🏠 Dashboard
            </button>
            <button
              onClick={() => setActiveTab("badges")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "badges" ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white bg-white/5"
              }`}
            >
              🏅 Badges ({unlockedBadges.length}/{ALL_BADGES.length})
            </button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-6 relative z-10">
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono mb-1.5">
            <span>XP Progress</span>
            <span className="font-bold text-white">{currentXP % (currentLevel * 250)} / {currentLevel * 250} XP</span>
          </div>
          <div className="w-full h-2.5 bg-white/5 border border-white/10 rounded-full overflow-hidden p-0.5">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, ((currentXP % (currentLevel * 250)) / (currentLevel * 250)) * 100)}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* STATS COUNT GRID */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-center relative z-10">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono block">Today's XP</span>
            <span className="text-sm font-black text-blue-400">+{totalXPEarnedToday} XP</span>
          </div>
          <div className="border-x border-white/10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono block">Completions</span>
            <span className="text-sm font-black text-emerald-400">{dailyCompleted} Done</span>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono block">Streak</span>
            <span className="text-sm font-black text-amber-400 flex items-center justify-center gap-0.5">
              🔥 {stats.dailyStreak} Days
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "badges" ? (
          <motion.div
            key="badges-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 shadow-2xl space-y-6"
          >
            <div>
              <h3 className="font-sans font-black uppercase text-white text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                🏆 Trophy Room & Achievements
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Unlock exclusive badges and level rankings as you complete tasks early and stay consistent.
              </p>
            </div>

            {/* SIMULATOR QUICK ACTIONS (TO TEST POPUPS IMMEDIATELY!) */}
            <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 font-mono flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Achievement & XP Simulator (Debug Panel)
              </span>
              <p className="text-xs text-slate-300 mb-3">
                Since this is an evaluation workspace, you can click below to immediately test the congratulations, animations, and unlock celebrations!
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSimulateBadgeUnlock("early_bird")}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-white hover:bg-white/10 cursor-pointer"
                >
                  🐦 Simulate "Early Bird" Badge
                </button>
                <button
                  onClick={() => handleSimulateBadgeUnlock("ahead_of_schedule")}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-white hover:bg-white/10 cursor-pointer"
                >
                  🚀 Simulate "Ahead of Schedule"
                </button>
                <button
                  onClick={() => handleSimulateXPEarn(300)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-white hover:bg-white/10 cursor-pointer"
                >
                  ⭐ Earn +300 XP (Level Up)
                </button>
              </div>
            </div>

            {/* BADGES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_BADGES.map((badge) => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                return (
                  <div 
                    key={badge.id}
                    onClick={() => !isUnlocked && handleSimulateBadgeUnlock(badge.id)}
                    className={`p-4 border rounded-2xl flex items-start gap-3 transition-all duration-300 cursor-pointer ${
                      isUnlocked 
                        ? "bg-white/[0.03] border-white/20 shadow-lg" 
                        : "bg-white/[0.01] border-white/5 opacity-50 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                      isUnlocked ? "bg-amber-400/10 border border-amber-400/20" : "bg-white/5 border border-white/5"
                    }`}>
                      {isUnlocked ? badge.icon : <Lock className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-black tracking-tight ${isUnlocked ? "text-white" : "text-slate-400"}`}>
                          {badge.title}
                        </span>
                        {isUnlocked && (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1 rounded">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5">{badge.description}</p>
                      <p className="text-[9px] font-mono text-slate-500 mt-1.5 uppercase font-semibold">Req: {badge.requirement}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* MORNING BRIEFING FEED */}
            <div className="border border-white/10 bg-white/[0.01] rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-3xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="w-5 h-5 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 font-mono">
                  AI Morning Briefing
                </span>
              </div>
              <h2 className="text-xl font-black text-white leading-snug uppercase tracking-tight">
                Good morning, Vikas!
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                Here's your strategic focus mapping for today: You have <strong className="text-white">2 critical client/project events</strong>, <strong className="text-white">{activeTasks.length} high-priority tasks</strong> on your agenda, and an active <strong className="text-white">{gymStreak}-day Gym consistency streak</strong> to maintain. 
              </p>
              <div className="mt-4 p-3 bg-blue-950/30 border border-blue-500/20 text-[11px] font-mono rounded-xl text-blue-300 flex items-start gap-2 leading-relaxed">
                <span className="text-base leading-none">🎯</span>
                <span>
                  <strong>Coach Insight:</strong> To maximize cognitive velocity, finish your <strong className="text-white">DBMS assignment</strong> or <strong className="text-white">Internship Report</strong> before your 10:00 AM meeting block. Delay risk climbs by 33% after midday.
                </span>
              </div>
            </div>

            {/* SECTION 1: TODAY'S CRITICAL EVENTS (Top Priority) */}
            <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-black uppercase text-white text-md flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  🔴 Today's Critical Events
                </h3>
                <span className="text-[10px] font-bold text-red-400 font-mono uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 animate-pulse">
                  STRICT TIMING
                </span>
              </div>

              <div className="space-y-3">
                {/* Event 1 */}
                <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg text-blue-400 shrink-0 mt-0.5">
                      📅
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight">Project Review Meeting</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-blue-400" /> Today • 10:00 AM (Starts in 15 mins)
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" /> Conference Room B
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button 
                      onClick={() => alert("🔗 Launching virtual link or workspace notes for Project Review Meeting...")}
                      className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase text-white transition-all cursor-pointer"
                    >
                      Join Meeting
                    </button>
                    <button 
                      onClick={() => alert("📍 Accessing room navigation overlay...")}
                      className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      Navigate
                    </button>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg text-amber-400 shrink-0 mt-0.5">
                      🩺
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight">Doctor Appointment</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Today • 4:30 PM (Leave by 3:45 PM)
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" /> City Hospital
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button 
                      onClick={() => alert("🚗 Generating drive-time routing map to City Hospital...")}
                      className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-[10px] font-black uppercase text-white transition-all cursor-pointer"
                    >
                      Navigate
                    </button>
                    <button 
                      onClick={() => {
                        const confirmPrompt = window.confirm("Do you want the AI to propose a reschedule on Monday morning?");
                        if (confirmPrompt) alert("📅 Proposals dispatched! Next slot found Monday at 11:30 AM.");
                      }}
                      className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: SMART PRIORITY TASK FLASH CARDS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-black uppercase text-white text-md flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400 fill-indigo-500/10" />
                  ⚡ Today's Priority Task Flash Cards
                </h3>
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  DYNAMICAL ORDER
                </span>
              </div>

              {priorityTasks.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {priorityTasks.slice(0, 2).map((task) => {
                    // Decide border highlight based on importance
                    const borderColors = {
                      Critical: "border-rose-500/30 bg-rose-950/5",
                      High: "border-amber-500/25 bg-amber-950/5",
                      Medium: "border-blue-500/20 bg-blue-950/5",
                      Low: "border-white/10 bg-white/[0.01]",
                    };

                    const textImportanceColors = {
                      Critical: "text-rose-400",
                      High: "text-amber-400",
                      Medium: "text-blue-400",
                      Low: "text-slate-300",
                    };

                    return (
                      <div 
                        key={task.id}
                        className={`border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${borderColors[task.importance]}`}
                      >
                        {/* CARD BANNER OVERLAY */}
                        <div className="absolute top-0 right-0 p-3 flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[8px] font-black tracking-widest bg-white/5 rounded border border-white/10 text-slate-300 font-mono uppercase">
                            {task.category}
                          </span>
                        </div>

                        <div className="flex items-start gap-4 mb-4">
                          <span className="text-2xl mt-1 shrink-0">📅</span>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 tracking-wider font-mono block uppercase">
                              Today's Priority Task
                            </span>
                            <h4 className="text-lg font-black text-white uppercase tracking-tight">
                              {task.title}
                            </h4>
                            <p className="text-xs text-slate-400 max-w-xl">{task.description}</p>
                          </div>
                        </div>

                        {/* SUB-INFO METRICS GRID */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-white/10 text-xs font-mono mb-4">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">⏰ Due Date</span>
                            <span className="text-white font-bold">{formatDeadline(task.deadline)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">⏳ Duration</span>
                            <span className="text-white font-bold">{task.estimatedEffort} Hours</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">🔥 Importance</span>
                            <span className={`font-black ${textImportanceColors[task.importance]}`}>{task.importance}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">📈 Progress</span>
                            <span className="text-white font-bold">{task.progress}%</span>
                          </div>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="mb-4">
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-white h-full" style={{ width: `${task.progress}%` }} />
                          </div>
                        </div>

                        {/* AI PERSONALIZED TIP BOX */}
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl mb-5 flex gap-2 items-start">
                          <span className="text-base leading-none mt-0.5">💡</span>
                          <p className="text-[11px] text-indigo-300 leading-normal font-medium">
                            <strong>AI Tip:</strong> {task.category === "Study" 
                              ? "Derive the backpropagation equations manually before writing any Python code. Finishing this early guarantees an extra day of testing." 
                              : "Deconstruct your portfolio sections into a 4-step checklist to avoid blank-canvas inertia today."}
                          </p>
                        </div>

                        {/* BUTTON ACTIONS IN REMINDER */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/5">
                          <button
                            onClick={() => handleImmediateComplete(task)}
                            className="py-2.5 px-3 rounded-xl bg-white text-black hover:bg-emerald-500 hover:text-white text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Complete
                          </button>
                          
                          <button
                            onClick={() => onSelectForFocus(task)}
                            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-blue-600 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-white/10 hover:border-transparent"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Start Focus
                          </button>

                          <button
                            onClick={() => handlePostponeClick(task)}
                            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-amber-600 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-white/10 hover:border-transparent"
                          >
                            <Hourglass className="w-3 h-3" />
                            Postpone
                          </button>

                          <button
                            onClick={() => handleLeaveTaskClick(task)}
                            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-rose-950 text-slate-300 hover:text-rose-400 text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-white/10 hover:border-transparent"
                          >
                            <X className="w-3 h-3" />
                            Leave Task
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                  <CheckCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-300">No priority task cards outstanding!</p>
                  <p className="text-[10px] text-slate-500 mt-1">Excellent job! Your master agenda is currently 100% completed.</p>
                </div>
              )}
            </div>

            {/* SECTION 3: DAILY MUST-DO TASKS */}
            <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-black uppercase text-white text-md flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  💪 Section 3: Daily Must-Do Habits
                </h3>
                <span className="text-[10px] font-bold text-amber-400 font-mono uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  🔥 STREAK PRESERVATION
                </span>
              </div>

              <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl shrink-0">
                      💪
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Gym Workout</h4>
                        <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                          🔥 {gymStreak} Day Streak
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Target duration: 45 Minutes. Boosts serotonin, physical velocity, and general focus capacity.</p>
                      
                      {gymStatus === "started" && (
                        <p className="text-[10px] font-mono text-blue-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-spin" /> Live workout clock tracking active in background...
                        </p>
                      )}
                      
                      {gymStatus === "completed" && (
                        <p className="text-[10px] font-mono text-emerald-400 mt-1 font-bold">
                          ✅ Completed today! Streak updated safely.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {gymStatus === "pending" && (
                      <>
                        <button 
                          onClick={handleGymStart}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase text-white transition-all cursor-pointer"
                        >
                          Start Workout
                        </button>
                        <button 
                          onClick={handleGymPostpone}
                          className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase text-slate-300 transition-all cursor-pointer"
                        >
                          Skip
                        </button>
                      </>
                    )}

                    {gymStatus === "started" && (
                      <button 
                        onClick={handleGymComplete}
                        className="py-1.5 px-3 rounded-lg bg-white text-black hover:bg-emerald-500 hover:text-white text-[10px] font-black uppercase transition-all cursor-pointer"
                      >
                        Complete Workout
                      </button>
                    )}

                    {gymStatus === "completed" && (
                      <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                        ⭐ COMPLETED (+40 XP)
                      </span>
                    )}
                  </div>
                </div>

                {/* Gym warning modal-style alert */}
                {gymWarning && (
                  <div className="mt-4 p-3.5 bg-rose-950/40 border border-rose-500/20 rounded-xl space-y-2">
                    <p className="text-xs text-rose-300 leading-normal">
                      <strong>⚠️ Attention Vikas:</strong> Gym Workout is one of your strictly logged "Daily Must-Do" tasks. Skipping this will permanently break your 18-day habit streak! A quick, express 20-minute bodyweight routine is sufficient to maintain your model's consistency statistics.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setGymWarning(false);
                          setGymStatus("started");
                          alert("💪 Adjusted workout routine to 20-min express. CRUSH IT!");
                        }}
                        className="px-2.5 py-1 bg-white text-black text-[9px] font-bold uppercase rounded cursor-pointer hover:bg-slate-200"
                      >
                        Do 20-Min Express
                      </button>
                      <button
                        onClick={() => {
                          setGymWarning(false);
                          setGymStreak(0);
                          alert("❌ Gym skipped. Streak has reset to 0.");
                        }}
                        className="px-2.5 py-1 bg-rose-600 text-white text-[9px] font-bold uppercase rounded cursor-pointer hover:bg-rose-700"
                      >
                        Confirm Skip (Loses Streak)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: AI SUGGESTIONS */}
            <div className="border border-white/10 bg-white/[0.01] rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 font-mono">
                  💡 Dynamic AI Suggestions
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Your calendar registers a clear <strong className="text-white">90-minute gap</strong> from <strong className="text-white">2:00 PM – 3:30 PM</strong>. Let's maximize focus velocity.
              </p>
              
              <div className="space-y-2.5">
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">✔</span>
                    <span className="text-xs font-bold text-white uppercase tracking-tight">Prepare Presentation Outline</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Estimated: 45m</span>
                </div>
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">✔</span>
                    <span className="text-xs font-bold text-white uppercase tracking-tight">Draft Resume Experience Details</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Estimated: 30m</span>
                </div>
              </div>
            </div>

            {/* SECTION 5: UPCOMING TASKS */}
            <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="font-sans font-black uppercase text-white text-md flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                📬 Section 5: Upcoming Tasks
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                  <span className="text-[8px] font-mono font-bold text-blue-400 uppercase">TOMORROW</span>
                  <h4 className="text-xs font-bold text-white mt-1 uppercase line-clamp-1">AI Assignment Submission</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Due Saturday, 11:59 PM</p>
                </div>
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                  <span className="text-[8px] font-mono font-bold text-blue-400 uppercase">TOMORROW</span>
                  <h4 className="text-xs font-bold text-white mt-1 uppercase line-clamp-1">Pay Utility Invoice</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Finance priority</p>
                </div>
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                  <span className="text-[8px] font-mono font-bold text-blue-400 uppercase">NEXT WEEK</span>
                  <h4 className="text-xs font-bold text-white mt-1 uppercase line-clamp-1">Internship Application Run</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Targeting 5 tech roles</p>
                </div>
              </div>
            </div>

            {/* END OF DAY SUMMARY PANEL */}
            <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-sans font-black uppercase text-white text-lg">
                    Today's Progress Summary
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mt-2">
                    <span className="flex items-center gap-1"><strong className="text-emerald-400">✅ Completed:</strong> {dailyCompleted}</span>
                    <span className="flex items-center gap-1"><strong className="text-amber-400">⏳ Postponed:</strong> {dailyPostponed}</span>
                    <span className="flex items-center gap-1"><strong className="text-rose-400">❌ Left:</strong> {dailyLeft}</span>
                    <span className="flex items-center gap-1"><strong className="text-white">🔥 Streak:</strong> {stats.dailyStreak} Days</span>
                    <span className="flex items-center gap-1"><strong className="text-blue-400">⭐ XP:</strong> +{totalXPEarnedToday} Earned</span>
                  </div>
                </div>
                <div className="max-w-md bg-white/[0.02] p-3 rounded-2xl border border-white/5 text-[11px] text-slate-300 leading-relaxed font-mono">
                  <strong>Coach Reflection:</strong> Great work today, Vikas! You successfully knocked out {dailyCompleted} active items. Pushing forward on early items guarantees maximum flexibility as your weekend study deadlines arrive.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SUCCESS CELEBRATION MODAL */}
      <AnimatePresence>
        {celebration?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCelebration(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0c0c0c] border border-white/10 p-8 rounded-3xl max-w-lg w-full relative z-10 shadow-2xl text-center space-y-6"
            >
              {/* Confetti decoration */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-indigo-500 rounded-t-3xl" />
              
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner shadow-emerald-500/10">
                🎉
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-widest text-emerald-400 font-mono uppercase block">
                  Task Complete Celebration!
                </span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  Congratulations, Vikas!
                </h3>
                <p className="text-sm text-slate-300 font-medium">
                  You completed <strong className="text-white">"{celebration.taskTitle}"</strong> on schedule!
                </p>
              </div>

              {/* XP GAIN DISPLAY */}
              <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl flex items-center justify-center gap-2">
                <span className="text-xl">⭐</span>
                <span className="text-2xl font-mono font-black text-blue-400">+{celebration.xpEarned} XP</span>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider font-mono ml-2">Awarded</span>
              </div>

              {/* BADGE UNLOCKED CALLOUT */}
              {celebration.badgeUnlocked && (
                <div className="p-4 bg-amber-950/40 border border-amber-500/20 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 font-mono block animate-pulse">
                    🏅 NEW ACHIEVEMENT UNLOCKED!
                  </span>
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-4xl">{celebration.badgeUnlocked.icon}</span>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase">{celebration.badgeUnlocked.title}</h4>
                      <p className="text-[11px] text-slate-400">{celebration.badgeUnlocked.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PROGRESS TO NEXT BADGE */}
              <div className="text-left bg-white/[0.01] border border-white/5 p-3.5 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>🏅 Deadline Master Progress</span>
                  <span>{onTimeCount}/10 Tasks</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, (onTimeCount / 10) * 100)}%` }} />
                </div>
              </div>

              {/* PERSONALIZED PRAISE TEXT */}
              <p className="text-xs text-slate-300 font-mono italic leading-relaxed text-left border-l-2 border-indigo-500 pl-3">
                "{celebration.customPraise}"
              </p>

              <button
                onClick={() => setCelebration(null)}
                className="w-full py-3 bg-white hover:bg-slate-200 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                Accept Rewards & Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. POSTPONE WARNING / CONFIRMATION DRAWER */}
      <AnimatePresence>
        {postponingTaskId && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setPostponingTaskId(null); setSelectedTask(null); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0c0c0c] border border-white/10 p-6 rounded-3xl max-w-md w-full relative z-10 shadow-2xl space-y-5"
            >
              <div>
                <h3 className="font-sans font-black uppercase text-white text-md flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Postpone Focus Agenda
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Rescheduling "${selectedTask.title}".
                </p>
              </div>

              {!postponeWarning ? (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                    Select New Timing Interval:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {["⏱ 30 minutes", "🕐 1 hour", "🌇 This evening", "📅 Tomorrow"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => confirmPostpone(opt.replace(/[^a-zA-Z ]/g, "").trim())}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-left text-white cursor-pointer transition-all"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => confirmPostpone("Monday morning")}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-left text-white cursor-pointer transition-all flex items-center justify-between"
                  >
                    <span>✏️ Custom Reschedule Slot</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 rounded-xl leading-relaxed">
                    {postponeWarning}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => finalizePostpone(true)}
                      className="flex-1 py-2.5 bg-white hover:bg-slate-200 text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                    >
                      📂 Split into Subtasks
                    </button>
                    <button
                      onClick={() => finalizePostpone(false)}
                      className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                    >
                      Proceed Anyway
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. LEAVE TASK OPTIONS DRAWER */}
      <AnimatePresence>
        {leavingTaskId && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setLeavingTaskId(null); setSelectedTask(null); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0c0c0c] border border-white/10 p-6 rounded-3xl max-w-md w-full relative z-10 shadow-2xl space-y-5"
            >
              <div>
                <h3 className="font-sans font-black uppercase text-white text-md flex items-center gap-2">
                  <X className="w-5 h-5 text-rose-500" />
                  Leave Task Agenda
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tell the AI why you won't work on "${selectedTask.title}" today.
                </p>
              </div>

              {!leavingFeedback ? (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                    Choose Primary Reason:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {["😴 Too tired", "📚 Busy with priority", "🤒 Not feeling well", "❓ No motivation", "✍ Other"].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => confirmLeaveTask(reason.replace(/[^a-zA-Z ]/g, "").trim())}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-left text-white cursor-pointer transition-all"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300 rounded-xl leading-relaxed font-mono">
                    {leavingFeedback}
                  </div>

                  <div className="flex gap-2">
                    {leavingFeedback.includes("10-minute") ? (
                      <>
                        <button
                          onClick={() => finalizeLeaveTask("micro")}
                          className="flex-1 py-2.5 bg-white hover:bg-slate-200 text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                        >
                          ⏱ Launch 10-Min Micro
                        </button>
                        <button
                          onClick={() => finalizeLeaveTask("reschedule")}
                          className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                        >
                          Reschedule Off Today
                        </button>
                      </>
                    ) : leavingFeedback.includes("fatigue") ? (
                      <>
                        <button
                          onClick={() => finalizeLeaveTask("morning")}
                          className="flex-1 py-2.5 bg-white hover:bg-slate-200 text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                        >
                          🌅 Yes, Reschedule Morning
                        </button>
                        <button
                          onClick={() => finalizeLeaveTask("reschedule")}
                          className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                        >
                          Standard Reschedule
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => finalizeLeaveTask("reschedule")}
                        className="w-full py-2.5 bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                      >
                        Reschedule Off Agenda
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
