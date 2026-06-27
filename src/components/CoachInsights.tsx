import React, { useState, useEffect } from "react";
import { Task, ProductivityStats, CoachData } from "../types";
import { 
  Sparkles, 
  TrendingUp, 
  Sun, 
  Moon, 
  HelpCircle, 
  Zap, 
  RefreshCw, 
  Trophy 
} from "lucide-react";

interface CoachInsightsProps {
  tasks: Task[];
  completedCount: number;
  stats: ProductivityStats;
  onUpdateStats: (newStats: ProductivityStats) => void;
}

export default function CoachInsights({
  tasks,
  completedCount,
  stats,
  onUpdateStats,
}: CoachInsightsProps) {
  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCoachInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/coach-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.map(t => ({ title: t.title, completed: t.completed, deadline: t.deadline })),
          completedCount,
          activeStreak: stats.dailyStreak,
          stats,
        }),
      });

      if (!response.ok) throw new Error("Failed to load coach feedback");
      const data = await response.json();
      setCoachData(data);
    } catch (err) {
      console.error(err);
      // Fallback fallback data if API issues occur
      setCoachData({
        greeting: "Welcome back, high-achiever! Let's conquer today's agenda together.",
        insights: [
          {
            type: "timing",
            text: "Based on your focus velocities, your peak mental performance occurs before 12 PM.",
            actionableTip: "Tackle your 'Critical' urgency study task first thing today.",
          },
          {
            type: "focus",
            text: "Vague, open-ended tasks are causing mild subconscious stress.",
            actionableTip: "Select one unrated task below and click 'Analyze Actionability' to break it down.",
          },
          {
            type: "motivation",
            text: "You are holding a perfect daily streak. Maintain the rhythm!",
            actionableTip: "Complete at least one 25-minute Smart Focus session to retain the streak.",
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate advice on initial mount, or when completed count changes
  useEffect(() => {
    fetchCoachInsights();
  }, [completedCount]);

  const handleSliderChange = (key: keyof ProductivityStats, val: number) => {
    onUpdateStats({
      ...stats,
      [key]: val,
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "timing": return <Sun className="w-4 h-4 text-amber-500" />;
      case "focus": return <Zap className="w-4 h-4 text-indigo-500" />;
      case "alert": return <TrendingUp className="w-4 h-4 text-rose-500" />;
      default: return <Trophy className="w-4 h-4 text-blue-500" />;
    }
  };

  const getInsightTypeLabel = (type: string) => {
    switch (type) {
      case "timing": return "Peak Hours";
      case "focus": return "Focus Strategy";
      case "alert": return "Procrastination Hazard";
      default: return "Goal Alignment";
    }
  };

  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 shadow-2xl">
      <div className="flex justify-between items-start gap-2 mb-6">
        <div>
          <h3 className="font-sans font-black uppercase text-white text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 fill-indigo-500/10" />
            AI Productivity Coach
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Personalized behavioral guidance parsed from your metrics, streak logs, and focus velocities.
          </p>
        </div>
        <button
          onClick={fetchCoachInsights}
          disabled={isLoading}
          className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
          title="Refresh behavioral advice"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* MOTIVATIONAL GREETING CARD */}
      {coachData && (
        <div className="mb-6 p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl">
          <p className="text-xs text-indigo-300 leading-relaxed font-semibold">
            Coach: "{coachData.greeting}"
          </p>
        </div>
      )}

      {/* PERSONALIZED TIPS LIST */}
      <div className="space-y-4 mb-6">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          Daily Behavioral Optimization
        </label>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl animate-pulse flex gap-3">
                <div className="w-5 h-5 bg-white/10 rounded" />
                <div className="space-y-2 flex-grow">
                  <div className="h-3.5 bg-white/10 rounded w-1/3" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {coachData?.insights.map((insight, idx) => (
              <div 
                key={idx} 
                className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl shadow-2xs hover:border-white/20 transition-colors duration-150 flex items-start gap-3"
              >
                <div className="p-1.5 bg-white/5 rounded-lg shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {getInsightTypeLabel(insight.type)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-0.5 leading-relaxed">
                    {insight.text}
                  </p>
                  <p className="text-[11px] text-blue-400 font-medium mt-1.5 flex items-center gap-1 font-mono">
                    <span className="text-xs">🎯</span> Tip: {insight.actionableTip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INTERACTIVE MODEL CONTROLS */}
      <div className="pt-5 border-t border-white/10">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4 font-mono">
          Tweak Your Habit Model
        </h4>

        <div className="space-y-4">
          {/* Procrastination Factor Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-300">Base Procrastination Rate</span>
              <span className="text-xs font-mono text-white font-bold">{stats.averageProcrastination}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={stats.averageProcrastination}
              onChange={(e) => handleSliderChange("averageProcrastination", Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Morning & Night Focus Sliders */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Morning
                </span>
                <span className="text-xs font-mono font-bold text-white">{stats.morningVelocity}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stats.morningVelocity}
                onChange={(e) => handleSliderChange("morningVelocity", Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" /> Evening
                </span>
                <span className="text-xs font-mono font-bold text-white">{stats.eveningVelocity}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stats.eveningVelocity}
                onChange={(e) => handleSliderChange("eveningVelocity", Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>

          {/* Streak indicator */}
          <div className="flex items-center justify-between p-3 bg-white/[0.01] rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Consistency Streak</p>
                <p className="text-xs font-bold text-white">{stats.dailyStreak} Days Active</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleSliderChange("dailyStreak", stats.dailyStreak + 1)}
                className="p-1 px-2 text-[10px] font-bold text-indigo-400 bg-white/5 hover:bg-white/10 rounded border border-white/10 cursor-pointer"
              >
                +1 Day
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
