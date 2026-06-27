import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Task, Subtask, Goal, ProductivityStats, UserSession } from "./types";
import TaskCard from "./components/TaskCard";
import FocusTimer from "./components/FocusTimer";
import GoalPlanner from "./components/GoalPlanner";
import VoiceAssistant from "./components/VoiceAssistant";
import CoachInsights from "./components/CoachInsights";
import ContextTriggers from "./components/ContextTriggers";
import HomeDashboard from "./components/HomeDashboard";
import TaskFlashDeck from "./components/TaskFlashDeck";
import LoginPage from "./components/LoginPage";
import { 
  Sparkles, 
  BrainCircuit, 
  ListTodo, 
  Compass, 
  Clock, 
  Trophy,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  HelpCircle,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

// Initial template tasks to show off premium visual systems immediately
const INITIAL_TASKS: Task[] = [
  {
    id: "task-ml-prep",
    title: "Prepare Machine Learning Exam Assignment",
    description: "Write notes on Neural Network backpropagation and solve sample gradient descent formulas.",
    category: "Study",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    importance: "High",
    estimatedEffort: 3.0,
    progress: 0,
    completed: false,
    subtasks: [
      { id: "sub-ml-1", title: "Review lecture slides on cost optimization", completed: false },
      { id: "sub-ml-2", title: "Derive partial derivative formulas manually", completed: false },
    ],
  },
  {
    id: "task-elec-bill",
    title: "Pay Electricity Bill",
    description: "Submit pending monthly commercial utility charge via bank portal to avoid penalty fee.",
    category: "Finance",
    deadline: new Date().toISOString().split("T")[0],
    importance: "Critical",
    estimatedEffort: 0.5,
    progress: 100,
    completed: true,
    priorityScore: 95,
    delayRisk: 5,
    actionabilityScore: 98,
    actionabilityFeedback: "This task is highly actionable, clear, and includes immediate banking credentials in description.",
    subtasks: [
      { id: "sub-eb-1", title: "Verify transaction confirmation email", completed: true },
    ],
  },
  {
    id: "task-resume",
    title: "Build Resume & Portfolio",
    description: "Gather old project details and compile everything into a cohesive summary format.",
    category: "Work",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    importance: "Medium",
    estimatedEffort: 2.5,
    progress: 0,
    completed: false,
    actionabilityScore: 40,
    actionabilityFeedback: "This task is too vague. 'Gather details' and 'compile everything' trigger procrastination. Deconstruct this into a clean 4-step actionable list.",
    subtasks: [],
  },
];

const INITIAL_GOALS: Goal[] = [
  {
    id: "goal-internship",
    title: "Secure High-Growth Technical Internship",
    category: "Study",
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    hoursSpent: 4.5,
    completed: false,
    timelinePlan: [
      {
        day: 1,
        title: "Curate Portfolio Assets",
        tasks: [
          "Format resume document styling",
          "Upload top 3 projects to public GitHub profiles",
          "Draft personalized cover letter template",
        ],
      },
      {
        day: 2,
        title: "Core DSA Revision",
        tasks: [
          "Practice 3 HashMap algorithm problems",
          "Revise Space Complexity fundamentals",
          "Solve 1 Linked List traversal challenge",
        ],
      },
      {
        day: 3,
        title: "System Design and Application Submissions",
        tasks: [
          "Review basic Horizontal Scaling definitions",
          "Submit applications to top 5 selected companies",
        ],
      },
    ],
  },
];

const INITIAL_STATS: ProductivityStats = {
  averageProcrastination: 5,
  morningVelocity: 7,
  eveningVelocity: 4,
  dailyStreak: 3,
  weeklyHoursStudied: 4.5,
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("actionpilot_tasks");
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem("actionpilot_goals");
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [stats, setStats] = useState<ProductivityStats>(() => {
    const saved = localStorage.getItem("actionpilot_stats");
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });

  const [activeTask, setActiveTask] = useState<Task | undefined>(undefined);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>("All");
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [isPrioritizingAll, setIsPrioritizingAll] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"list" | "flashcard">("list");
  const [dashboardTab, setDashboardTab] = useState<"overview" | "tasks" | "goals" | "coach" | "focus">("overview");
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);

  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("actionpilot_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem("actionpilot_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("actionpilot_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("actionpilot_stats", JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("actionpilot_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("actionpilot_user");
    }
  }, [user]);

  // TASK OPERATIONS
  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newCompleted = !t.completed;
          // When completing a task, check off all its subtasks too
          const updatedSubtasks = t.subtasks.map((s) => ({ ...s, completed: newCompleted }));
          return {
            ...t,
            completed: newCompleted,
            progress: newCompleted ? 100 : 0,
            subtasks: updatedSubtasks,
          };
        }
        return t;
      })
    );
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          );
          const completedCount = updatedSubtasks.filter((s) => s.completed).length;
          const totalCount = updatedSubtasks.length;
          const newProgress = Math.round((completedCount / totalCount) * 100);
          const isNowCompleted = newProgress === 100;

          return {
            ...t,
            subtasks: updatedSubtasks,
            progress: newProgress,
            completed: isNowCompleted,
          };
        }
        return t;
      })
    );
  };

  const handleAddSubtask = (taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newSubtask: Subtask = {
            id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            title,
            completed: false,
          };
          const updatedSubtasks = [...t.subtasks, newSubtask];
          const completedCount = updatedSubtasks.filter((s) => s.completed).length;
          const newProgress = Math.round((completedCount / updatedSubtasks.length) * 100);

          return {
            ...t,
            subtasks: updatedSubtasks,
            progress: newProgress,
            completed: false, // adding a pending task re-opens completeness
          };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTask?.id === id) {
      setActiveTask(undefined);
    }
  };

  const handleSelectForFocus = (task: Task) => {
    setActiveTask(task);
    // Scroll smoothly to active focus timer section
    const element = document.getElementById("focus-section-container");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // AI CORE ACTIONABILITY DECONSTRUCTOR
  const handleEvaluateActionability = async (taskId: string) => {
    // Set loading indicator
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, isEvaluating: true } : t)));

    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    try {
      const response = await fetch("/api/evaluate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: targetTask.title,
          description: targetTask.description,
          category: targetTask.category,
        }),
      });

      if (!response.ok) throw new Error("Failed evaluating task actionability");
      const result = await response.json();

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            // Map string subtasks from AI to full Subtask objects
            const newSubtasks: Subtask[] = result.suggestedSubtasks.map((subTitle: string, idx: number) => ({
              id: `sub-ai-${Date.now()}-${idx}`,
              title: subTitle,
              completed: false,
            }));

            return {
              ...t,
              actionabilityScore: result.score,
              actionabilityFeedback: result.explanation,
              subtasks: newSubtasks.length > 0 ? newSubtasks : t.subtasks,
              isEvaluating: false,
            };
          }
          return t;
        })
      );
    } catch (err) {
      console.error(err);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, isEvaluating: false } : t)));
    }
  };

  // AI ALL TASKS BULK PRIORITIZER
  const handlePrioritizeAllActiveTasks = async () => {
    const incompleteTasks = tasks.filter((t) => !t.completed);
    if (incompleteTasks.length === 0) {
      alert("No active incomplete tasks found to prioritize!");
      return;
    }

    setIsPrioritizingAll(true);
    try {
      const response = await fetch("/api/prioritize-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: incompleteTasks.map((t) => ({
            id: t.id,
            title: t.title,
            category: t.category,
            deadline: t.deadline,
            importance: t.importance,
            estimatedEffort: t.estimatedEffort,
          })),
          userDelayRiskFactor: stats.averageProcrastination,
        }),
      });

      if (!response.ok) throw new Error("Prioritization request failed");
      const results = await response.json();

      // Update tasks with prioritization data
      setTasks((prev) =>
        prev.map((t) => {
          const match = results.find((r: any) => r.id === t.id);
          if (match) {
            return {
              ...t,
              priorityScore: match.priorityScore,
              delayRisk: match.delayRisk,
              delayRiskReason: match.reason,
            };
          }
          return t;
        })
      );
    } catch (err) {
      console.error(err);
      alert("Complications arose prioritizing tasks via AI. Please check server connectivity.");
    } finally {
      setIsPrioritizingAll(false);
    }
  };

  // ADD GOAL AND AI PLAN
  const handleAddGoal = (title: string, timeframeDays: number, planData?: any) => {
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title,
      category: "Study",
      targetDate: new Date(Date.now() + timeframeDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      hoursSpent: 0,
      completed: false,
      timelinePlan: planData?.timeline || [],
    };

    setGoals((prev) => [newGoal, ...prev]);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  // EXTRACT TIMELINE TASKS AND DEPLOY TO ACTIVE TASKS BOARD
  const handleDeployTimelineTasks = (timelineTasks: string[], category: string) => {
    const newlyCreatedTasks: Task[] = timelineTasks.map((taskTitle, idx) => ({
      id: `task-deployed-${Date.now()}-${idx}`,
      title: taskTitle,
      description: `Timeline task extracted automatically from your active masterplan.`,
      category: category as any,
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // default tomorrow
      importance: "Medium",
      estimatedEffort: 1.5,
      progress: 0,
      completed: false,
      subtasks: [],
    }));

    setTasks((prev) => [...newlyCreatedTasks, ...prev]);
    alert(`⚡ ${timelineTasks.length} plan tasks successfully deployed to your Active Task Board! Scroll down to see them.`);
  };

  // ADD TASK FROM VOICE COMMAND PARSER
  const handleAddTaskFromVoice = (parsedTask: any) => {
    const formatSubtasks: Subtask[] = parsedTask.subtasks.map((subTitle: string, idx: number) => ({
      id: `sub-voice-${Date.now()}-${idx}`,
      title: subTitle,
      completed: false,
    }));

    const newTask: Task = {
      id: `task-voice-${Date.now()}`,
      title: parsedTask.title,
      description: `Command scheduled on Autopilot.`,
      category: parsedTask.category as any,
      deadline: parsedTask.deadline,
      importance: parsedTask.importance as any,
      estimatedEffort: parsedTask.estimatedEffort || 1.5,
      progress: 0,
      completed: false,
      subtasks: formatSubtasks,
    };

    setTasks((prev) => [newTask, ...prev]);
  };

  // FOCUS SESSION TRACKING SPENT HOURS
  const handleAccumulateWorkTime = (hours: number) => {
    setStats((prev) => ({
      ...prev,
      weeklyHoursStudied: prev.weeklyHoursStudied + hours,
    }));

    // Also distribute spent hours to first active goal if any
    setGoals((prev) =>
      prev.map((g, idx) => (idx === 0 ? { ...g, hoursSpent: g.hoursSpent + hours } : g))
    );
  };

  const handleSessionComplete = (taskId?: string, type?: "work" | "break") => {
    if (taskId && type === "work") {
      // Advance active task progress slightly or prompt completion
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            const currentProgress = t.progress;
            const updatedProgress = Math.min(100, currentProgress + 25);
            return {
              ...t,
              progress: updatedProgress,
              completed: updatedProgress === 100,
            };
          }
          return t;
        })
      );
    }
  };

  // FILTERED TASKS CALCULATIONS
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = taskCategoryFilter === "All" || task.category === taskCategoryFilter;
    const matchesCompletion = showCompleted ? task.completed : !task.completed;
    return matchesCategory && matchesCompletion;
  });

  const evaluatedActionable = tasks.filter((t) => t.actionabilityScore !== undefined);
  const averageActionability = evaluatedActionable.length > 0 
    ? Math.round(evaluatedActionable.reduce((acc, t) => acc + (t.actionabilityScore || 0), 0) / evaluatedActionable.length)
    : 78;

  const categoriesList = ["All", "Work", "Study", "Health", "Finance", "Personal"];

  if (!user) {
    return <LoginPage onLoginSuccess={(session) => setUser(session)} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans antialiased pb-24">
      
      {/* 1. HERO BRAND BANNER & TOP STATS BAR */}
      <header className="relative overflow-hidden pt-12 pb-8 border-b border-white/10">
        {/* Abstract design geometry in background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-transparent opacity-80" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-[0.2em] text-blue-500 uppercase font-mono">ActionPilot v1.2</span>
              <h2 className="text-xl font-black tracking-tight text-white mt-1 uppercase">Autonomous AI Companion</h2>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-xs font-semibold uppercase opacity-40 block tracking-widest font-mono">Pilot: {user.displayName}</span>
              <button
                onClick={() => setUser(null)}
                className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 uppercase tracking-widest mt-1.5 hover:underline cursor-pointer border border-red-500/20 bg-red-950/10 px-2.5 py-0.5 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* MASSIVE HERO HEADLINE FOR THE BOLD TYPOGRAPHY STYLE */}
          <main className="my-10">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-[0.3em] mb-3">Recommendation Engine Output</p>
            <h1 className="text-4xl md:text-[5.5rem] leading-[0.95] font-black tracking-tighter uppercase text-white">
              <span className="opacity-40">YOU HAVE</span> {tasks.filter(t => !t.completed).length} ACTIVE PLANS <br/> FOR DEEP IMMERSION.
            </h1>
            <div className="flex items-baseline gap-6 mt-6">
              <div className="h-[2px] w-24 bg-blue-600"></div>
              <p className="text-lg md:text-xl font-light opacity-80 max-w-2xl">
                Ready to optimize your mental performance? I've indexed your backlog and adjusted priority scores.
              </p>
            </div>
          </main>

          {/* THREE HIGH-IMPACT BOLD THEME PANELS */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            
            {/* Panel 1: Procrastination Risk */}
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-36">
              <header className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 font-mono">Deadline Risk</span>
                <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-[10px] font-bold rounded">CRITICAL</span>
              </header>
              <div className="flex flex-col">
                <span className="text-5xl font-black text-red-400">{(stats.averageProcrastination || 5) * 10}%</span>
                <span className="text-xs opacity-60 mt-1 uppercase tracking-tight font-mono">Procrastination rate adjusted dynamically.</span>
              </div>
            </div>

            {/* Panel 2: Actionability Score */}
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-36 border-blue-500/30">
              <header className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 font-mono">Actionability Score</span>
                <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-[10px] font-bold rounded font-mono">PRIME</span>
              </header>
              <div className="flex flex-col">
                <span className="text-5xl font-black text-blue-500">{averageActionability}/100</span>
                <span className="text-xs opacity-60 mt-1 uppercase tracking-tight font-mono">Average precision score for active tasks.</span>
              </div>
            </div>

            {/* Panel 3: Dynamic Habit Status */}
            <div className="bg-white text-black p-6 rounded-2xl flex flex-col justify-between h-36">
              <header className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 font-mono">Autonomous Status</span>
              </header>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center border-b border-black/10 pb-0.5">
                  <span className="text-xs font-bold uppercase">Consistency Streak</span>
                  <span className="text-[11px] font-mono font-black">{stats.dailyStreak} Days</span>
                </div>
                <div className="flex justify-between items-center border-b border-black/10 pb-0.5">
                  <span className="text-xs font-bold uppercase">Hours Focused</span>
                  <span className="text-[11px] font-mono font-black">{stats.weeklyHoursStudied.toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between items-center pb-0.5">
                  <span className="text-xs font-bold uppercase">Completions</span>
                  <span className="text-[11px] font-mono font-black">{tasks.filter(t => t.completed).length} items</span>
                </div>
              </div>
            </div>

          </section>
        </div>
      </header>

      {/* STICKY TAB NAVIGATION BAR */}
      <div className="sticky top-0 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 z-40 py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-2xl border border-white/5">
            <button
              onClick={() => setDashboardTab("overview")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                dashboardTab === "overview"
                  ? "bg-white text-black shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setDashboardTab("tasks")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                dashboardTab === "tasks"
                  ? "bg-white text-black shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Daily Tasks
            </button>
            <button
              onClick={() => setDashboardTab("goals")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                dashboardTab === "goals"
                  ? "bg-white text-black shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Goals Planner
            </button>
            <button
              onClick={() => setDashboardTab("coach")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                dashboardTab === "coach"
                  ? "bg-white text-black shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              AI Insights
            </button>
          </nav>
          
          <div className="flex items-center gap-3">
            {activeTask && (
              <button
                onClick={() => setDashboardTab("focus")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 cursor-pointer transition-all animate-pulse"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                Active Focus Room
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN BENTO GRID DASHBOARD */}
      <main className="max-w-7xl mx-auto px-6 mt-12 space-y-8">
        <AnimatePresence mode="wait">
          {dashboardTab === "overview" && (
            <motion.div
              key="overview-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* HOME DASHBOARD (FIRST SCREEN) */}
              <HomeDashboard
                tasks={tasks}
                stats={stats}
                onUpdateStats={setStats}
                onToggleComplete={handleToggleComplete}
                onSelectForFocus={handleSelectForFocus}
                onAddTaskFromVoice={handleAddTaskFromVoice}
              />
            </motion.div>
          )}

          {dashboardTab === "tasks" && (
            <motion.div
              key="tasks-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* LEFT 7-COLUMNS: VOICE AUTOPILOT + TASK LIST */}
              <section className="lg:col-span-12 space-y-8">
                {/* Task Board Container */}
                <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-sans font-black uppercase text-white text-lg flex items-center gap-2">
                        <ListTodo className="w-5 h-5 text-indigo-500" />
                        Active Action Board
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Your immediate task load. Let AI run predictions on urgency and delay risk.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setIsFlashcardOpen(true)}
                        disabled={tasks.filter((t) => !t.completed).length === 0}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-white/10 disabled:text-white/30 transition-all duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        Quick Review Deck
                      </button>

                      <button
                        onClick={handlePrioritizeAllActiveTasks}
                        disabled={isPrioritizingAll || tasks.filter((t) => !t.completed).length === 0}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-black bg-white hover:bg-blue-500 hover:text-white disabled:bg-white/10 disabled:text-white/30 transition-all duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <SlidersHorizontal className={`w-3.5 h-3.5 ${isPrioritizingAll ? "animate-spin" : ""}`} />
                        {isPrioritizingAll ? "Calculating Risks..." : "Predict Priority & Risks"}
                      </button>
                    </div>
                  </div>

                  {/* FILTER CONTROLS */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-2 bg-white/[0.03] rounded-2xl border border-white/10">
                    <div className="flex flex-wrap items-center gap-1">
                      {categoriesList.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setTaskCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                            taskCategoryFilter === cat
                              ? "bg-white text-black shadow-lg"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="h-4 w-px bg-white/10 hidden sm:block" />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                      >
                        <Filter className="w-3.5 h-3.5" />
                        <span>Showing: <strong>{showCompleted ? "Completed" : "Active"}</strong></span>
                      </button>
                    </div>
                  </div>

                  {/* RENDERED TASK CARDS LIST */}
                  {filteredTasks.length > 0 ? (
                    <div className="space-y-4">
                      {filteredTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onToggleSubtask={handleToggleSubtask}
                          onAddSubtask={handleAddSubtask}
                          onEvaluateActionability={(id) => { handleEvaluateActionability(id); }}
                          onDeleteTask={handleDeleteTask}
                          onSelectForFocus={handleSelectForFocus}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                      <AlertCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-white/80">No matching tasks found</p>
                      <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto px-4">
                        {showCompleted 
                          ? "Complete some active tasks using the check circles to populate your completed backlog." 
                          : "Type a command in the Voice Assistant or generate an masterplan to schedule new items."}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {dashboardTab === "focus" && (
            <motion.div
              key="focus-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <FocusTimer
                activeTask={activeTask}
                onAccumulateWorkTime={handleAccumulateWorkTime}
                onSessionComplete={handleSessionComplete}
                onClearActiveTask={() => setActiveTask(undefined)}
              />
            </motion.div>
          )}

          {dashboardTab === "goals" && (
            <motion.div
              key="goals-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <GoalPlanner
                goals={goals}
                onAddGoal={handleAddGoal}
                onGeneratePlan={() => {}}
                onDeployTimelineTasks={handleDeployTimelineTasks}
                onDeleteGoal={handleDeleteGoal}
              />
            </motion.div>
          )}

          {dashboardTab === "coach" && (
            <motion.div
              key="coach-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <section className="lg:col-span-6 space-y-8">
                <CoachInsights
                  tasks={tasks}
                  completedCount={tasks.filter((t) => t.completed).length}
                  stats={stats}
                  onUpdateStats={setStats}
                />
              </section>
              <section className="lg:col-span-6 space-y-8">
                <ContextTriggers
                  tasks={tasks}
                  onSelectActiveTask={handleSelectForFocus}
                />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FLOATING OVERLAY AI CHAT ASSISTANT & VOICE AUTOPILOT */}
      <VoiceAssistant onAddTaskFromVoice={handleAddTaskFromVoice} />

      {/* FULLSCREEN POP-UP QUICK REVIEW PLAYROOM MODAL */}
      <AnimatePresence>
        {isFlashcardOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[100] overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[500px] bg-[#0c0d12]/98 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative"
            >
              <TaskFlashDeck
                tasks={tasks}
                onToggleComplete={handleToggleComplete}
                onPostponeTask={(id) => {
                  setTasks((prev) => prev.map((t) => {
                    if (t.id === id) {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return { ...t, deadline: tomorrow.toISOString().split("T")[0] };
                    }
                    return t;
                  }));
                }}
                onLeaveTask={handleDeleteTask}
                onSelectForFocus={(task) => {
                  handleSelectForFocus(task);
                  setIsFlashcardOpen(false); // Close modal when task selected for focus
                }}
                onClose={() => setIsFlashcardOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
