import React, { useState, useEffect } from "react";
import { Task } from "../types";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "motion/react";
import { 
  Check, 
  X, 
  Hourglass, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Clock, 
  ListTodo, 
  AlertTriangle, 
  RefreshCw, 
  HelpCircle,
  Award,
  Play
} from "lucide-react";

interface TaskFlashDeckProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onPostponeTask?: (id: string, option: string) => void;
  onLeaveTask?: (id: string, reason: string) => void;
  onSelectForFocus?: (task: Task) => void;
  onClose?: () => void;
}

export default function TaskFlashDeck({
  tasks,
  onToggleComplete,
  onPostponeTask,
  onLeaveTask,
  onSelectForFocus,
  onClose
}: TaskFlashDeckProps) {
  const activeTasks = tasks.filter(t => !t.completed);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null);
  const [feedbackContent, setFeedbackContent] = useState<string | null>(null);

  // Motion animation hooks
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);
  const leftIndicatorOpacity = useTransform(x, [-120, -40], [1, 0]);
  const rightIndicatorOpacity = useTransform(x, [40, 120], [0, 1]);
  const controls = useAnimation();

  // Keep index within bounds if tasks list changes
  useEffect(() => {
    if (currentIndex >= activeTasks.length && activeTasks.length > 0) {
      setCurrentIndex(activeTasks.length - 1);
    }
  }, [activeTasks.length, currentIndex]);

  const currentTask = activeTasks[currentIndex];

  const handleNext = () => {
    if (currentIndex < activeTasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // Loop back
    }
    setSwipeDirection(null);
    setShowFeedbackModal(null);
    setFeedbackContent(null);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(activeTasks.length - 1); // Loop to end
    }
    setSwipeDirection(null);
    setShowFeedbackModal(null);
    setFeedbackContent(null);
  };

  const executeComplete = async () => {
    if (!currentTask) return;
    setSwipeDirection("right");
    
    // Swipe animation
    await controls.start({ x: 300, opacity: 0, transition: { duration: 0.2 } });
    
    // Perform completeness
    onToggleComplete(currentTask.id);
    
    // Reset card position
    x.set(0);
    controls.set({ x: 0, opacity: 1 });
    
    // Advance index gracefully
    if (currentIndex >= activeTasks.length - 1) {
      setCurrentIndex(0);
    }
    setSwipeDirection(null);
  };

  const executePostpone = async () => {
    if (!currentTask) return;
    setSwipeDirection("left");

    // Propose deconstruction
    const option = "Tomorrow";
    if (onPostponeTask) {
      onPostponeTask(currentTask.id, option);
    }

    await controls.start({ x: -300, opacity: 0, transition: { duration: 0.2 } });
    
    // Reset card position
    x.set(0);
    controls.set({ x: 0, opacity: 1 });
    
    if (currentIndex >= activeTasks.length - 1) {
      setCurrentIndex(0);
    }
    setSwipeDirection(null);
  };

  const executeLeave = async (reason: string) => {
    if (!currentTask) return;
    
    let advice = "";
    if (reason === "Too tired") {
      advice = `🤖 Vikas, fatigue detected. Procrastination risk increases by 33% when tackling heavy study blocks while exhausted. Proposing reschedule to tomorrow before 10 AM.`;
    } else if (reason === "No motivation") {
      advice = `💡 Motivation block detected. Committing to a 10-minute Focus block is 85% effective at breaking blank-canvas inertia! Let's start with a short timer.`;
    } else {
      advice = `✍️ Left task noted. Rescheduling to a future calendar block with lower density.`;
    }

    setFeedbackContent(advice);
    setShowFeedbackModal(reason);
  };

  const finalizeLeaveChoice = async (action: "reschedule" | "focus" | "cancel") => {
    if (!currentTask) return;

    if (action === "focus" && onSelectForFocus) {
      onSelectForFocus(currentTask);
    } else if (action === "reschedule" && onLeaveTask) {
      onLeaveTask(currentTask.id, "Postponed via swipe");
    }

    // Swiping animation out
    setSwipeDirection("left");
    await controls.start({ x: -300, opacity: 0, transition: { duration: 0.2 } });
    
    // Reset position
    x.set(0);
    controls.set({ x: 0, opacity: 1 });
    
    setShowFeedbackModal(null);
    setFeedbackContent(null);
    setSwipeDirection(null);

    if (currentIndex >= activeTasks.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleDragEnd = async (event: any, info: any) => {
    const offset = info.offset.x;
    if (offset > 120) {
      // Swipe Right -> Complete
      await executeComplete();
    } else if (offset < -120) {
      // Swipe Left -> Options Menu for Leaving
      executeLeave("Swipe Action");
    } else {
      // Snap back
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  if (activeTasks.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
        <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-black text-white uppercase tracking-wider font-mono">Deck Completed!</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          You don't have any pending tasks right now. Create a new task or study plan using the Voice Assistant to populate your active action cards!
        </p>
      </div>
    );
  }

  const importanceColors = {
    Critical: "border-rose-500/30 bg-rose-950/10 text-rose-400",
    High: "border-amber-500/25 bg-amber-950/10 text-amber-400",
    Medium: "border-blue-500/20 bg-blue-950/10 text-blue-400",
    Low: "border-white/10 bg-white/[0.02] text-slate-300",
  };

  return (
    <div className="space-y-4">
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono">Tactile Swiping Engine</span>
          <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" /> Task Flash Cards Playroom
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
            <span className="text-white font-bold">{currentIndex + 1}</span>
            <span>/</span>
            <span>{activeTasks.length} Cards</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Close playroom"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SWIPE CARD CONTAINER */}
      <div className="relative w-full h-[360px] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {currentTask && (
            <motion.div
              key={currentTask.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              animate={controls}
              style={{ x, rotate, opacity }}
              whileDrag={{ scale: 1.02 }}
              className={`absolute w-full h-full border rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing select-none transition-colors duration-200 ${
                swipeDirection === "right"
                  ? "border-emerald-500/40 bg-emerald-950/20"
                  : swipeDirection === "left"
                  ? "border-rose-500/40 bg-rose-950/20"
                  : "border-white/10 bg-[#0e1017]"
              }`}
              id={`flashcard-${currentTask.id}`}
            >
              {/* SWIPE VISUAL FEEDBACK LAYERS */}
              <motion.div 
                style={{ opacity: rightIndicatorOpacity }}
                className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-500/20 pointer-events-none flex items-center justify-center z-10"
              >
                <div className="border-4 border-emerald-400 px-6 py-2 rounded-2xl rotate-[-12deg] transform scale-110">
                  <span className="text-xl font-black text-emerald-400 uppercase tracking-widest font-mono">COMPLETE ✅</span>
                </div>
              </motion.div>

              <motion.div 
                style={{ opacity: leftIndicatorOpacity }}
                className="absolute inset-0 bg-gradient-to-l from-rose-500/10 to-rose-500/20 pointer-events-none flex items-center justify-center z-10"
              >
                <div className="border-4 border-rose-400 px-6 py-2 rounded-2xl rotate-[12deg] transform scale-110">
                  <span className="text-xl font-black text-rose-400 uppercase tracking-widest font-mono">LEAVE / SNOOZE ❌</span>
                </div>
              </motion.div>

              {/* CARD TOP info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-[8px] font-black tracking-widest bg-white/5 border border-white/10 rounded-full text-slate-300 font-mono uppercase">
                    {currentTask.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono border ${importanceColors[currentTask.importance]}`}>
                    {currentTask.importance} Priority
                  </span>
                </div>

                <div className="space-y-1 mt-1">
                  <h3 className="text-base font-black text-white uppercase tracking-tight line-clamp-1">
                    {currentTask.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {currentTask.description || "No further details listed for this task. Set a plan or use subtasks below."}
                  </p>
                </div>
              </div>

              {/* STATS MIDDLE SECTION */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 font-mono text-[10px] text-slate-400">
                <div>
                  <span className="text-[8px] uppercase tracking-wider block opacity-50">⏰ Deadline</span>
                  <span className="text-white font-bold">{currentTask.deadline}</span>
                </div>
                <div className="border-x border-white/5 px-2">
                  <span className="text-[8px] uppercase tracking-wider block opacity-50">⏳ Effort</span>
                  <span className="text-white font-bold">{currentTask.estimatedEffort}h</span>
                </div>
                <div className="pl-1">
                  <span className="text-[8px] uppercase tracking-wider block opacity-50">⚡ Risk</span>
                  <span className={`font-bold ${currentTask.delayRisk && currentTask.delayRisk > 40 ? "text-rose-400" : "text-emerald-400"}`}>
                    {currentTask.delayRisk || 15}% Risk
                  </span>
                </div>
              </div>

              {/* COGNITIVE AI SUGGESTIONS TIP */}
              <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/10 rounded-xl flex gap-1.5 items-start">
                <span className="text-xs mt-0.5 shrink-0">💡</span>
                <p className="text-[10px] text-indigo-300 leading-relaxed font-mono">
                  {currentTask.category === "Study" 
                    ? "Tackle first! Studies indicate technical topics are retained 25% better before 12 PM." 
                    : "Procrastination risk rises if postponed. Committing 5 minutes dissolves action friction."}
                </p>
              </div>

              {/* FOOTER ACTION CONTROL PANEL */}
              <div className="grid grid-cols-4 gap-2 pt-2 z-20">
                <button
                  onClick={executeComplete}
                  className="py-2.5 px-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Done
                </button>

                <button
                  onClick={() => executeLeave("No motivation")}
                  className="py-2.5 px-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <X className="w-3 h-3" />
                  Leave
                </button>

                <button
                  onClick={executePostpone}
                  className="py-2.5 px-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Hourglass className="w-3 h-3" />
                  Snooze
                </button>

                {onSelectForFocus && (
                  <button
                    onClick={() => onSelectForFocus(currentTask)}
                    className="py-2.5 px-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    Focus
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SWIPE DECK FOOTER NAVIGATION */}
      <div className="flex items-center justify-between px-2 pt-1 font-mono text-[10px] text-slate-500">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer py-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Previous Card
        </button>

        <span className="text-[9px] uppercase tracking-widest text-slate-400 text-center select-none animate-pulse">
          Drag Card Left/Right to Swipe!
        </span>

        <button
          onClick={handleNext}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer py-1"
        >
          Next Card <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* DETAILED INTERACTIVE INTERIORS ADVICE CARD MODAL */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 bg-slate-900 border border-white/10 rounded-2xl space-y-3 mt-3 shadow-2xl relative z-30"
          >
            <div className="flex items-start justify-between">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" /> Procrastination Prevention Engine
              </h5>
              <button 
                onClick={() => setShowFeedbackModal(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {feedbackContent}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => finalizeLeaveChoice("reschedule")}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-[10px] font-black uppercase text-white transition-all cursor-pointer"
              >
                Reschedule Session
              </button>
              {onSelectForFocus && (
                <button
                  onClick={() => finalizeLeaveChoice("focus")}
                  className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-blue-600 hover:text-white text-[10px] font-black uppercase transition-all cursor-pointer"
                >
                  Start 10-Min Micro Block
                </button>
              )}
              <button
                onClick={() => setShowFeedbackModal(null)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase text-slate-300 transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
