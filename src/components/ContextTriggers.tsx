import React, { useState } from "react";
import { Task, ContextTrigger } from "../types";
import { 
  MapPin, 
  Clock, 
  Laptop, 
  Moon, 
  Sparkles, 
  Play, 
  HelpCircle 
} from "lucide-react";

interface ContextTriggersProps {
  tasks: Task[];
  onSelectActiveTask: (task: Task) => void;
}

export default function ContextTriggers({
  tasks,
  onSelectActiveTask,
}: ContextTriggersProps) {
  const [activeTriggerId, setActiveTriggerId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    task: Task;
    explanation: string;
  } | null>(null);

  const triggers: ContextTrigger[] = [
    {
      id: "library",
      title: "Arrived at University Library",
      icon: "MapPin",
      location: "Central Library, Zone B",
      prompt: "This is the best place to continue your heavy study tasks.",
      description: "Low-distraction academic zone. Ideal for research and analytical study.",
    },
    {
      id: "free_slot",
      title: "Detected 45-Minute Free Calendar Slot",
      icon: "Clock",
      timeSlot: "11:15 AM - 12:00 PM",
      prompt: "You have 45 free minutes before your next meeting. Work on a quick item?",
      description: "Short gap. Ideal for minor admin tasks or completing high-priority subtasks.",
    },
    {
      id: "home_desk",
      title: "Settled at Home Desk Workspace",
      icon: "Laptop",
      location: "Home Office",
      prompt: "Perfect environmental context for deep development and coding focus.",
      description: "High-comfort, full setup zone. Ideal for complex programming or project reports.",
    },
    {
      id: "evening_reflection",
      title: "Evening Wind-down Reflection",
      icon: "Moon",
      timeSlot: "8:00 PM onwards",
      prompt: "Review achievements and schedule tomorrow's path to lower start anxiety.",
      description: "Relaxed headspace. Ideal for organizing, planning, and goal tracking.",
    },
  ];

  const [successLocked, setSuccessLocked] = useState(false);

  const handleTriggerClick = (trigger: ContextTrigger) => {
    setActiveTriggerId(trigger.id);
    setAnalyzing(true);
    setRecommendation(null);
    setSuccessLocked(false);

    // Simulate smart AI analysis filtering our current tasks
    setTimeout(() => {
      let matchedTask: Task | undefined;

      if (trigger.id === "library") {
        // Look for any study task or high importance task
        matchedTask = tasks.find(t => !t.completed && (t.category === "Study" || t.importance === "Critical" || t.importance === "High"));
      } else if (trigger.id === "free_slot") {
        // Look for any task with lower estimated effort (< 2 hours)
        matchedTask = tasks.find(t => !t.completed && t.estimatedEffort <= 1.5);
      } else if (trigger.id === "home_desk") {
        // Look for work or personal tasks with higher effort
        matchedTask = tasks.find(t => !t.completed && (t.category === "Work" || t.category === "Personal" || t.estimatedEffort > 1.5));
      } else if (trigger.id === "evening_reflection") {
        // Look for personal tasks or any task with low progress
        matchedTask = tasks.find(t => !t.completed && t.progress < 50);
      }

      // Fallback to any incomplete task if no perfect match
      if (!matchedTask) {
        matchedTask = tasks.find(t => !t.completed);
      }

      if (matchedTask) {
        let explanation = "";
        if (trigger.id === "library") {
          explanation = `You have reached a quiet study zone. Since you have "${matchedTask.title}" pending, this is your optimal peak learning environment to conquer this study task.`;
        } else if (trigger.id === "free_slot") {
          explanation = `You have a quick 45-minute window. "${matchedTask.title}" is estimated at ${matchedTask.estimatedEffort} hours and has low start friction. Finishing it now frees up your afternoon.`;
        } else if (trigger.id === "home_desk") {
          explanation = `Settled at your main setup. "${matchedTask.title}" requires full monitors and deep dev focus. Now is the ideal moment to lock in.`;
        } else {
          explanation = `During evening reflection, organizing "${matchedTask.title}" and tackling 1 quick subtask sets a massive momentum for tomorrow.`;
        }

        setRecommendation({
          task: matchedTask,
          explanation
        });
      }

      setAnalyzing(false);
    }, 1200);
  };

  const getTriggerIcon = (iconName: string, isSelected: boolean) => {
    switch (iconName) {
      case "MapPin": return <MapPin className={`w-5 h-5 ${isSelected ? "text-emerald-600" : "text-emerald-400"}`} />;
      case "Clock": return <Clock className={`w-5 h-5 ${isSelected ? "text-amber-600" : "text-amber-400"}`} />;
      case "Laptop": return <Laptop className={`w-5 h-5 ${isSelected ? "text-indigo-600" : "text-indigo-400"}`} />;
      default: return <Moon className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-blue-400"}`} />;
    }
  };

  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 shadow-2xl">
      <div className="mb-5">
        <h3 className="font-sans font-black uppercase text-white text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-400" />
          Context-Aware Autopilot
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Simulate arriving at a location or a calendar gap to let the AI scan your task board and suggest the perfect focus target.
        </p>
      </div>

      {/* TRIGGERS GRID */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {triggers.map((trigger) => {
          const isSelected = activeTriggerId === trigger.id;
          return (
            <button
              key={trigger.id}
              onClick={() => handleTriggerClick(trigger)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-white text-black border-white shadow-2xl"
                  : "bg-white/[0.01] text-slate-300 border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-black/5" : "bg-white/5"}`}>
                  {getTriggerIcon(trigger.icon, isSelected)}
                </div>
                <span className="text-xs font-black leading-tight font-sans line-clamp-1">{trigger.title}</span>
              </div>
              <p className={`text-[10px] line-clamp-2 leading-relaxed ${isSelected ? "text-slate-700" : "text-slate-400"}`}>
                {trigger.description}
              </p>
              {trigger.location && (
                <p className={`text-[9px] font-mono mt-2 flex items-center gap-1 ${isSelected ? "text-emerald-700" : "text-emerald-400"}`}>
                  <span>📍</span> {trigger.location}
                </p>
              )}
              {trigger.timeSlot && (
                <p className={`text-[9px] font-mono mt-2 flex items-center gap-1 ${isSelected ? "text-amber-700" : "text-amber-400"}`}>
                  <span>⏰</span> {trigger.timeSlot}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* ANALYSIS POPUP / PANEL */}
      {activeTriggerId && (
        <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl transition-all duration-300">
          {analyzing ? (
            <div className="text-center py-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-[11px] text-slate-400 font-mono">ActionPilot scanning task loads, urgency weightings, and effort times...</p>
            </div>
          ) : recommendation ? (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-500/10" />
                <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">
                  Pilot Smart Match Found
                </span>
              </div>
              
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 shadow-2xs mb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-black text-white line-clamp-1">
                    {recommendation.task.title}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-500/20 uppercase shrink-0">
                    {recommendation.task.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {recommendation.explanation}
                </p>
              </div>

              {/* LOCK FOCUS BUTTON */}
              <button
                onClick={() => {
                  onSelectActiveTask(recommendation.task);
                  setSuccessLocked(true);
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-widest text-black bg-white hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Lock Focus and Open Timer
              </button>

              {successLocked && (
                <div className="mt-2.5 p-3 bg-emerald-950/50 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-1.5 font-mono">
                  <span>🔒 Target Locked! Scroll up to the Smart Focus timer block to begin deep velocity tracking.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-xs text-slate-400 leading-normal">
                No active matching tasks. Generate or create some study/work tasks on your board first, then simulate contexts!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
