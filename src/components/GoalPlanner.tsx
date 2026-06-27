import React, { useState } from "react";
import { Goal } from "../types";
import { 
  Sparkles, 
  CalendarDays, 
  ChevronRight, 
  CheckCircle2, 
  Plus, 
  ListPlus, 
  Hourglass,
  Check
} from "lucide-react";

interface GoalPlannerProps {
  goals: Goal[];
  onAddGoal: (title: string, timeframeDays: number, planData?: any) => void;
  onGeneratePlan: (goalId: string, title: string, timeframeDays: number) => void;
  onDeployTimelineTasks: (timelineTasks: string[], category: string) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function GoalPlanner({
  goals,
  onAddGoal,
  onGeneratePlan,
  onDeployTimelineTasks,
  onDeleteGoal,
}: GoalPlannerProps) {
  const [goalTitle, setGoalTitle] = useState("");
  const [daysCount, setDaysCount] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/autonomous-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goalTitle.trim(), timeframeDays: daysCount }),
      });

      if (!response.ok) throw new Error("Failed to generate plan");
      const planData = await response.json();

      onAddGoal(goalTitle.trim(), daysCount, planData);
      setGoalTitle("");
      setDaysCount(7);
    } catch (err) {
      console.error(err);
      // Fallback: Add goal without plan if AI fails
      onAddGoal(goalTitle.trim(), daysCount);
      setGoalTitle("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 shadow-2xl">
      <div className="mb-6">
        <h3 className="font-sans font-black uppercase text-white text-lg flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-400" />
          Autonomous Masterplanner
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Turn any massive goal into an immediate, day-by-day scheduled checklist. AI maps the path so you just execute.
        </p>
      </div>

      {/* CREATE NEW GOAL FORM */}
      <form onSubmit={handleCreateGoal} className="space-y-4 mb-6 p-4 bg-white/[0.01] rounded-2xl border border-white/10">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            What's your primary objective?
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Build resume & prepare machine learning report..."
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            disabled={isSubmitting}
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Timeframe
            </label>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/20">
              {daysCount} Days
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="30"
            value={daysCount}
            onChange={(e) => setDaysCount(Number(e.target.value))}
            disabled={isSubmitting}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>3 days (Sprint)</span>
            <span>30 days (Full Month)</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !goalTitle.trim()}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-black bg-white hover:bg-blue-500 hover:text-white transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          {isSubmitting ? "AI Architecting Masterplan..." : "Generate AI Masterplan"}
        </button>

        {isSubmitting && (
          <div className="text-center">
            <span className="text-[10px] text-blue-400 font-mono animate-pulse">
              🚀 Deconstructing goal, optimizing calendar slots, structuring subtasks...
            </span>
          </div>
        )}
      </form>

      {/* GOALS SELECTOR AND VISUALIZER */}
      {goals.length > 0 ? (
        <div className="space-y-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Your Active AI Plans
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoalId(goal.id === selectedGoalId ? null : goal.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  selectedGoalId === goal.id
                    ? "bg-white text-black border-white shadow-2xl"
                    : "bg-white/[0.01] text-slate-300 border-white/10 hover:bg-white/5 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-black font-sans line-clamp-2">{goal.title}</h4>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 self-start border ${
                      selectedGoalId === goal.id 
                        ? "bg-black text-white border-black" 
                        : "bg-white/5 text-slate-300 border-white/10"
                    }`}>
                      {goal.timelinePlan?.length || 0}d
                    </span>
                  </div>
                  <p className={`text-[10px] mt-1 ${selectedGoalId === goal.id ? "text-slate-700" : "text-slate-400"}`}>
                    Logged work: {goal.hoursSpent.toFixed(1)} hrs
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between w-full">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${selectedGoalId === goal.id ? "text-blue-600" : "text-blue-400"}`}>
                    {selectedGoalId === goal.id ? "Viewing Plan" : "View Plan"}
                  </span>
                  <span className="text-[10px] opacity-70">➔</span>
                </div>
              </button>
            ))}
          </div>

          {/* ACTIVE GOAL TIMELINE DETAILS */}
          {selectedGoal && (
            <div className="mt-4 border border-white/10 bg-white/[0.01] rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  Plan Timeline Details
                </h4>
                <button
                  onClick={() => onDeleteGoal(selectedGoal.id)}
                  className="text-[10px] font-bold text-rose-400 hover:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20 cursor-pointer"
                >
                  Delete Plan
                </button>
              </div>

              {selectedGoal.timelinePlan ? (
                <div className="space-y-4 pl-1">
                  {selectedGoal.timelinePlan.map((dayItem) => (
                    <div key={dayItem.day} className="relative pl-6 border-l-2 border-white/10 last:border-transparent pb-2">
                      {/* Timeline Dot Node */}
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-white border border-white/20 shadow" />
                      
                      <div className="bg-white/[0.01] border border-white/10 rounded-xl p-3 shadow-2xs">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-black text-blue-400 font-mono">
                            DAY {dayItem.day}
                          </span>
                          <span className="text-xs font-extrabold text-white">
                            {dayItem.title}
                          </span>
                        </div>

                        <ul className="space-y-1.5 mb-3">
                          {dayItem.tasks.map((t, idx) => (
                            <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5 leading-normal">
                              <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Schedule Button */}
                        <button
                          onClick={() => onDeployTimelineTasks(dayItem.tasks, "Study")}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider text-black bg-white hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                        >
                          <ListPlus className="w-3.5 h-3.5" /> Add Day {dayItem.day} Tasks to Board
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-white/[0.01] border border-dashed border-white/10 rounded-xl">
                  <p className="text-xs text-slate-400">
                    No custom timeline found. Try generating a fresh one above.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl">
          <CalendarDays className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 px-4">
            No active schedules. Enter a big goal (e.g., "Build a full React app in 5 days") above to let the AI plan it out for you.
          </p>
        </div>
      )}
    </div>
  );
}
