import React, { useState, useEffect, useRef } from "react";
import { Task } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Coffee, 
  CheckCircle, 
  Target, 
  HelpCircle 
} from "lucide-react";

interface FocusTimerProps {
  activeTask?: Task;
  onAccumulateWorkTime: (hours: number) => void;
  onSessionComplete: (taskId?: string, type?: "work" | "break") => void;
  onClearActiveTask: () => void;
}

export default function FocusTimer({
  activeTask,
  onAccumulateWorkTime,
  onSessionComplete,
  onClearActiveTask,
}: FocusTimerProps) {
  const [sessionType, setSessionType] = useState<"work" | "break">("work");
  const [durationPreset, setDurationPreset] = useState<number>(25); // in minutes
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeLeft = durationPreset * 60;

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 8000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Sync timeLeft when preset duration changes, only if not running
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(durationPreset * 60);
    }
  }, [durationPreset, isRunning]);

  // Handle active task association
  useEffect(() => {
    if (activeTask) {
      setSessionType("work");
      setDurationPreset(25);
      setTimeLeft(25 * 60);
      setIsRunning(true);
    }
  }, [activeTask]);

  // Timer countdown hook
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleTimerFinish = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Accumulate actual focused hours (convert seconds focused to hours)
    const focusedSeconds = durationPreset * 60;
    const focusedHours = focusedSeconds / 3600;

    if (sessionType === "work") {
      onAccumulateWorkTime(focusedHours);
      setCompletedSessionsCount((prev) => prev + 1);
      setToastMessage(`🎉 Focus session completed! You've logged ${durationPreset} minutes of deep focus velocity.`);
      onSessionComplete(activeTask?.id, "work");

      // Suggest break
      setSessionType("break");
      setDurationPreset(5);
    } else {
      setToastMessage(`☕ Break session finished! Ready to lock back in?`);
      onSessionComplete(activeTask?.id, "break");

      // Suggest work
      setSessionType("work");
      setDurationPreset(25);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durationPreset * 60);
  };

  const changePreset = (minutes: number, type: "work" | "break") => {
    setIsRunning(false);
    setSessionType(type);
    setDurationPreset(minutes);
    setTimeLeft(minutes * 60);
  };

  // Helper formats
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = ((initialTimeLeft - timeLeft) / initialTimeLeft) * 100;

  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      
      {/* Visual background ambient accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-8 -mt-8 opacity-20 transition-all duration-500 ${
        sessionType === "work" ? "bg-amber-500" : "bg-blue-500"
      }`} />

      <div className="flex items-center justify-between gap-2 mb-6 relative z-10">
        <h3 className="font-sans font-black uppercase text-white text-lg flex items-center gap-2">
          {sessionType === "work" ? (
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500/10" />
          ) : (
            <Coffee className="w-5 h-5 text-blue-500 fill-blue-500/10" />
          )}
          {sessionType === "work" ? "Smart Focus Block" : "Recovery Break"}
        </h3>
        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-full">
          Done: {completedSessionsCount} today
        </span>
      </div>

      {/* TARGETED TASK IF ANY */}
      <div className="mb-6 relative z-10">
        {activeTask ? (
          <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Target className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400 font-mono">Active Focus Target</p>
                <p className="text-xs font-semibold text-white truncate">{activeTask.title}</p>
              </div>
            </div>
            <button
              onClick={onClearActiveTask}
              className="text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer"
            >
              Deselect
            </button>
          </div>
        ) : (
          <div className="p-3.5 border border-dashed border-white/10 bg-white/[0.01] rounded-2xl text-center">
            <p className="text-xs text-slate-400">
              💡 No active focus target. Click the play icon on any task card to lock deep focus!
            </p>
          </div>
        )}
      </div>

      {/* BREATHING TIMER CIRCLE */}
      <div className="flex flex-col items-center justify-center mb-6 relative z-10">
        <div className="relative w-48 h-48 flex items-center justify-center">
          
          {/* Pulsing Breathing Ring */}
          <AnimatePresence>
            {isRunning && (
              <motion.div
                className={`absolute inset-0 rounded-full border-4 opacity-15 ${
                  sessionType === "work" ? "border-amber-400" : "border-blue-400"
                }`}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>

          {/* Svg Circle Progress */}
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="84"
              className="stroke-white/5 stroke-[6px] fill-transparent"
            />
            <circle
              cx="96"
              cy="96"
              r="84"
              className={`stroke-[8px] fill-transparent transition-all duration-300 ${
                sessionType === "work" ? "stroke-amber-400" : "stroke-blue-400"
              }`}
              strokeDasharray={527}
              strokeDashoffset={527 - (527 * progressPercent) / 100}
              strokeLinecap="round"
            />
          </svg>

          {/* Time text */}
          <div className="text-center z-10">
            <span className="text-4xl font-mono font-black text-white tracking-tight block">
              {formatTime(timeLeft)}
            </span>
            <p className="text-[9px] font-bold tracking-wider uppercase text-slate-400 mt-1 font-mono">
              {isRunning ? "Deeply Immersed" : "Ready"}
            </p>
          </div>
        </div>
      </div>

      {/* TIMER CONTROLS */}
      <div className="flex items-center justify-center gap-4 mb-6 relative z-10">
        <button
          onClick={resetTimer}
          className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={toggleTimer}
          className={`px-8 py-3.5 rounded-full font-black uppercase text-xs tracking-widest text-black bg-white hover:bg-blue-500 hover:text-white shadow-lg transition-all duration-200 cursor-pointer`}
        >
          <div className="flex items-center gap-2">
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isRunning ? "Pause" : "Start Focus"}</span>
          </div>
        </button>
      </div>

      {/* QUICK PRESETS ROW */}
      <div className="pt-5 border-t border-white/10 relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center font-mono">
          Work & Break Presets
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => changePreset(25, "work")}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              sessionType === "work" && durationPreset === 25
                ? "bg-amber-400 text-black border-amber-400 font-bold"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            🍅 25m Pomodoro
          </button>
          <button
            onClick={() => changePreset(50, "work")}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              sessionType === "work" && durationPreset === 50
                ? "bg-amber-400 text-black border-amber-400 font-bold"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            ⚡ 50m Deep Work
          </button>
          <button
            onClick={() => changePreset(5, "break")}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              sessionType === "break" && durationPreset === 5
                ? "bg-blue-400 text-black border-blue-400 font-bold"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            ☕ 5m Short Break
          </button>
          <button
            onClick={() => changePreset(15, "break")}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              sessionType === "break" && durationPreset === 15
                ? "bg-blue-400 text-black border-blue-400 font-bold"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            🧘 15m Long Break
          </button>
        </div>
      </div>

      {/* TOAST NOTIFICATION CONTAINER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-4 left-4 right-4 p-3.5 bg-blue-950 border border-blue-500/30 text-blue-300 text-xs rounded-xl flex items-center justify-between gap-3 shadow-2xl z-20"
          >
            <span className="font-medium leading-relaxed">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)} 
              className="text-[9px] uppercase font-bold text-white bg-white/10 px-2 py-1 rounded shrink-0"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
