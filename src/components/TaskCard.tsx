import React, { useState } from "react";
import { Task, Subtask } from "../types";
import { 
  Play, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Sparkles, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Gauge, 
  Clock, 
  Plus, 
  ListTodo,
  Check
} from "lucide-react";

interface TaskCardProps {
  key?: string | number;
  task: Task;
  onToggleComplete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onEvaluateActionability: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSelectForFocus: (task: Task) => void;
}

export default function TaskCard({
  task,
  onToggleComplete,
  onToggleSubtask,
  onAddSubtask,
  onEvaluateActionability,
  onDeleteTask,
  onSelectForFocus,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false);

  const importanceColors = {
    Low: "bg-white/5 text-slate-300 border-white/10 text-[10px] font-mono font-semibold uppercase tracking-wider",
    Medium: "bg-blue-950/40 text-blue-400 border-blue-500/20 text-[10px] font-mono font-semibold uppercase tracking-wider",
    High: "bg-amber-950/40 text-amber-400 border-amber-500/20 text-[10px] font-mono font-semibold uppercase tracking-wider",
    Critical: "bg-rose-950/40 text-rose-400 border-rose-500/20 text-[10px] font-mono font-semibold uppercase tracking-wider animate-pulse border",
  };

  const categoryColors = {
    Work: "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase tracking-wider",
    Study: "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider",
    Health: "bg-rose-600/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-bold uppercase tracking-wider",
    Finance: "bg-amber-600/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider",
    Personal: "bg-sky-600/20 text-sky-400 border border-sky-500/30 text-[10px] font-mono font-bold uppercase tracking-wider",
  };

  // Safe Date Formatting
  const formatDeadline = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  };

  const getPriorityColor = (score?: number) => {
    if (!score) return "text-slate-400 font-mono text-sm";
    if (score >= 80) return "text-rose-400 font-black text-base font-mono";
    if (score >= 50) return "text-amber-400 font-bold text-base font-mono";
    return "text-emerald-400 font-bold text-base font-mono";
  };

  const getActionabilityBadge = (score?: number) => {
    if (score === undefined) return null;
    if (score >= 85) return { text: "Actionable", color: "bg-emerald-950/40 text-emerald-400 border-emerald-500/20 font-mono text-[9px] uppercase font-bold" };
    if (score >= 60) return { text: "Moderately Vague", color: "bg-amber-950/40 text-amber-400 border-amber-500/20 font-mono text-[9px] uppercase font-bold" };
    return { text: "Procrastination Risk: Vague", color: "bg-rose-950/40 text-rose-400 border-rose-500/20 font-mono text-[9px] uppercase font-bold" };
  };

  const badgeInfo = getActionabilityBadge(task.actionabilityScore);

  return (
    <div 
      className={`border bg-white/[0.03] border-white/10 rounded-2xl shadow-2xl transition-all duration-300 ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      {/* HEADER SECTION */}
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full ${categoryColors[task.category]}`}>
              {task.category}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full border ${importanceColors[task.importance]}`}>
              {task.importance} Urgency
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onSelectForFocus(task)}
              disabled={task.completed}
              className="p-1.5 text-blue-400 hover:bg-white/5 rounded-lg transition-all disabled:opacity-40"
              title="Start Smart Focus Session"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={() => onDeleteTask(task.id)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:bg-white/5 rounded-lg transition-all"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* TITLE AND CHECKBOX */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => onToggleComplete(task.id)}
            className="mt-1 flex-shrink-0 text-slate-400 hover:text-blue-400 transition-colors duration-200"
          >
            {task.completed ? (
              <CheckCircle2 className="w-5.5 h-5.5 text-blue-500 fill-blue-500/10" />
            ) : (
              <Circle className="w-5.5 h-5.5" />
            )}
          </button>

          <div className="flex-grow">
            <h3 
              className={`font-sans font-black text-white text-base tracking-tight transition-all duration-200 ${
                task.completed ? "line-through text-slate-500" : ""
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-1 text-sm text-slate-400 font-medium">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* METRICS ROW (Deadline, Effort, AI priority score & delay risk) */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Due {formatDeadline(task.deadline)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <span>Effort: {task.estimatedEffort} hrs</span>
          </div>

          {/* AI Priority Indicator */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">AI Priority</span>
            <span className={getPriorityColor(task.priorityScore)}>
              {task.priorityScore !== undefined ? `${task.priorityScore}/100` : "Not evaluated"}
            </span>
          </div>

          {/* AI Delay Risk Indicator */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Delay Risk</span>
            <span className={`text-base font-mono font-black ${
              task.delayRisk !== undefined 
                ? task.delayRisk >= 75 ? "text-rose-400 animate-pulse" : task.delayRisk >= 40 ? "text-amber-400" : "text-emerald-400"
                : "text-slate-500"
            }`}>
              {task.delayRisk !== undefined ? `${task.delayRisk}%` : "Not evaluated"}
            </span>
          </div>
        </div>
      </div>

      {/* EXTENDED SECTION: AI DECONSTRUCTION, FEEDBACK, SUBTASKS */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 border-t border-white/5 bg-white/[0.01] rounded-b-2xl">
          
          {/* Actionability Score Panel */}
          <div className="mb-4 p-4 bg-white/[0.01] border border-white/10 rounded-xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Actionability Rating</span>
                {badgeInfo && (
                  <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full ${badgeInfo.color}`}>
                    {badgeInfo.text}
                  </span>
                )}
              </div>
              <div className="text-xl font-mono font-black text-blue-400">
                {task.actionabilityScore !== undefined ? `${task.actionabilityScore}/100` : "Unrated"}
              </div>
            </div>

            {task.actionabilityScore !== undefined ? (
              <div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {task.actionabilityFeedback || "No feedback generated."}
                </p>
                {task.actionabilityScore < 80 && task.subtasks.length === 0 && (
                  <div className="flex flex-col gap-2 p-3 bg-amber-950/30 rounded-lg border border-amber-500/20">
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-amber-300 leading-normal">
                        <strong>Vague tasks trigger procrastination.</strong> This score is low. Let ActionPilot break this task into direct subtasks.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-3">
                Actionability measures how clear and immediate your next steps are. Analyze this task to prevent delay.
              </p>
            )}

            {/* Deconstruct / Evaluate Button */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onEvaluateActionability(task.id)}
                disabled={task.isEvaluating || task.completed}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-widest text-black bg-white hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {task.isEvaluating ? "Analyzing with AI..." : task.actionabilityScore !== undefined ? "Re-evaluate Task" : "Analyze Actionability"}
              </button>
            </div>
          </div>

          {/* SUBTASKS SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 font-mono">
                <ListTodo className="w-3.5 h-3.5 text-blue-400" />
                Subtasks & Next Steps
              </h4>
              <span className="text-xs font-mono text-slate-400 font-bold">
                {task.subtasks.length > 0 
                  ? `${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length} Done`
                  : "No subtasks"}
              </span>
            </div>

            {/* Suggested subtasks auto-apply block */}
            {task.actionabilityScore !== undefined && task.actionabilityScore < 80 && task.subtasks.length === 0 && (
              <div className="mb-3 p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl">
                <p className="text-xs font-bold text-blue-400 mb-1 font-mono uppercase tracking-wide">AI Suggested Action Plan:</p>
                <ul className="space-y-1.5 mb-3">
                  <li className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <span>Deconstruct this into manageable parts to reduce task anxiety.</span>
                  </li>
                </ul>
                <button
                  onClick={() => {
                    onEvaluateActionability(task.id);
                  }}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-mono"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate and apply subtask checklist now
                </button>
              </div>
            )}

            {/* List of subtasks */}
            {task.subtasks.length > 0 && (
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                {task.subtasks.map((subtask) => (
                  <div 
                    key={subtask.id} 
                    className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/5 hover:border-white/10 transition-colors duration-150"
                  >
                    <button
                      onClick={() => onToggleSubtask(task.id, subtask.id)}
                      className="text-slate-400 hover:text-blue-400 transition-colors duration-150 flex-shrink-0"
                    >
                      {subtask.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/10" />
                      ) : (
                        <Circle className="w-4 h-4 text-white/20" />
                      )}
                    </button>
                    <span 
                      className={`text-xs text-slate-200 transition-all ${
                        subtask.completed ? "line-through text-slate-400" : ""
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add manual subtask form */}
            <form onSubmit={handleAddSubtaskSubmit} className="flex gap-1.5">
              <input
                type="text"
                placeholder="Add intermediate next step..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                disabled={task.completed}
                className="flex-grow text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={task.completed || !newSubtaskTitle.trim()}
                className="py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider bg-white hover:bg-blue-500 text-black hover:text-white disabled:bg-white/10 disabled:text-white/30 transition-all flex-shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
