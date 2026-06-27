import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize the GoogleGenAI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});
console.log(
    "Gemini Key:",
    process.env.GEMINI_API_KEY ? "Loaded" : "Missing"
);

// --- Graceful Local Heuristic Fallbacks ---
function fallbackEvaluateTask(title: string, description: string, category: string) {
  const words = title.split(/\s+/).length;
  let score = 50;
  if (words > 4) score += 20;
  if (description && description.length > 20) score += 15;
  score = Math.min(95, Math.max(15, score));

  let explanation = `Your task "${title}" is moderately defined. Providing additional context or breaking it down into smaller increments helps lower behavioral inertia.`;
  if (score < 50) {
    explanation = `The task "${title}" is highly vague or too large. Vague targets trigger cognitive avoidance; we recommend immediate decomposition into small checklist items.`;
  } else if (score > 80) {
    explanation = `Your task "${title}" is sharp and actionable! Clear verbs make starting straightforward.`;
  }

  const suggestedSubtasks = [
    `Set up environment and gather initial reference materials for "${title}"`,
    `Identify the absolute smallest next step to make progress today`,
    `Draft a skeleton outline or rough bullet points of the deliverables`,
    `Review, refine, and perform final self-checks on the ${category || "personal"} outputs`
  ];

  return { score, explanation, suggestedSubtasks };
}

function fallbackChat(message: string, history: any[] = []) {
  const text = (message || "").toLowerCase();
  
  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return {
      response: "Hello Vikas! I'm your ActionPilot AI assistant. I'm here to help you breakdown complex assignments, defeat procrastination, and stay focused. You can chat with me, or click the Microphone icon to schedule tasks instantly with voice commands!"
    };
  }
  
  if (text.includes("study") || text.includes("exam") || text.includes("dbms") || text.includes("assignment") || text.includes("learn")) {
    return {
      response: "To optimize study sessions for technical subjects like DBMS, I recommend the **Spaced Repetition + Active Recall** method. Try breaking down your study guide into small, concrete cards, and schedule a 25-minute Pomodoro timer in the app to avoid mental fatigue. Would you like me to formulate a study plan for your next assignment?"
    };
  }
  
  if (text.includes("procrastinate") || text.includes("stuck") || text.includes("lazy") || text.includes("focus") || text.includes("avoid")) {
    return {
      response: "Procrastination is not a lack of discipline; it's a way of coping with challenging emotions like overwhelm or fear of failure. The best solution is to reduce the 'activation energy' required to start. Pick a single task, commit to working on it for **just 5 minutes**, and see how you feel. The momentum will carry you forward!"
    };
  }

  if (text.includes("schedule") || text.includes("add task") || text.includes("create task")) {
    return {
      response: "You can schedule any task instantly using natural speech! Switch to the **Voice Pilot** tab in this chatbox, or type your command (e.g. *'Schedule my project review for tomorrow high importance'*) to let the AI structure and add it directly to your Action Board."
    };
  }

  if (text.includes("thank") || text.includes("thanks") || text.includes("cool")) {
    return {
      response: "You are very welcome, Vikas! Let's stay consistent and keep that daily momentum streak alive today! Let me know if you need anything else."
    };
  }

  return {
    response: "I understand! To help you achieve this, I suggest defining the immediate next milestone. If this is a major goal, you can use our **Autonomous Goal Planner** to break it down into a multi-day timeline, or commit to a focused session with our built-in Pomodoro timer. What specific outcome are you targeting today, Vikas?"
  };
}

function fallbackPrioritizeTasks(tasks: any[], userDelayRiskFactor: number = 5) {
  return tasks.map(task => {
    let impWeight = 15;
    if (task.importance === "Critical") impWeight = 35;
    else if (task.importance === "High") impWeight = 25;
    else if (task.importance === "Low") impWeight = 5;

    let urgency = 10;
    try {
      const remainingTime = new Date(task.deadline).getTime() - Date.now();
      const remainingDays = remainingTime / (1000 * 60 * 60 * 24);
      if (remainingDays < 0) urgency = 45; // overdue
      else if (remainingDays <= 1) urgency = 40;
      else if (remainingDays <= 3) urgency = 25;
      else if (remainingDays <= 7) urgency = 15;
    } catch {
      urgency = 10;
    }

    const priorityScore = Math.min(100, Math.max(10, impWeight + urgency + userDelayRiskFactor * 2));
    const delayRisk = Math.min(99, Math.max(5, Math.round(30 + userDelayRiskFactor * 5 - (impWeight / 3))));

    return {
      id: task.id,
      priorityScore,
      delayRisk,
      reason: `Task priority optimized at ${priorityScore}% by factoring in your "${task.importance}" importance and estimated effort.`
    };
  });
}

function fallbackAutonomousPlan(goal: string, timeframeDays: number = 7) {
  const timeline = [];
  const phases = [
    { title: "Research & Deconstruction", tasks: ["Gather documentation", "Deconstruct goal into concrete steps", "Set up study workspace"] },
    { title: "Core Strategy & Setup", tasks: ["Establish outline & milestone definitions", "Create mockups or basic file draft", "Review previous completed notes"] },
    { title: "High-Effort Deep Execution", tasks: ["Execute the most technically demanding portion", "Dedicate a 90-minute study session block", "Track focus velocity statistics"] },
    { title: "Feature Assembly & Refinement", tasks: ["Integrate secondary details", "Perform a strict review of edge cases", "Ask peer or mentor for constructive feedback"] },
    { title: "Polishing & Quality Audits", tasks: ["Review for clean styling and spelling", "Verify requirements list is 100% matched", "Fix minor alignment details"] },
    { title: "Final Polish & Review", tasks: ["Run full test runs or review read-through", "Ensure zero missing criteria in rubric", "Formulate follow-up milestones"] },
    { title: "Goal Achievement & Celebrate", tasks: ["Deliver final work / Complete goal", "Award yourself XP and a short rest block", "Reflect on behavioral consistency wins"] }
  ];

  for (let i = 1; i <= timeframeDays; i++) {
    const phaseIdx = Math.min(phases.length - 1, Math.floor(((i - 1) / timeframeDays) * phases.length));
    const currentPhase = phases[phaseIdx];
    timeline.push({
      day: i,
      title: `Day ${i}: ${currentPhase.title}`,
      tasks: currentPhase.tasks.map(t => `${t} for "${goal}"`)
    });
  }

  return {
    goalSummary: `Decomposed your major goal "${goal}" into a progressive daily timeline to minimize cognitive overwhelm.`,
    timeline
  };
}

function fallbackVoiceCommand(command: string) {
  const clean = command.toLowerCase();
  
  let category = "Personal";
  if (clean.includes("study") || clean.includes("assignment") || clean.includes("exam") || clean.includes("class") || clean.includes("dbms")) {
    category = "Study";
  } else if (clean.includes("work") || clean.includes("internship") || clean.includes("report") || clean.includes("project") || clean.includes("meeting")) {
    category = "Work";
  } else if (clean.includes("gym") || clean.includes("workout") || clean.includes("doctor") || clean.includes("health")) {
    category = "Health";
  } else if (clean.includes("pay") || clean.includes("bill") || clean.includes("finance") || clean.includes("money")) {
    category = "Finance";
  }

  let importance = "Medium";
  if (clean.includes("critical") || clean.includes("urgent") || clean.includes("asap")) {
    importance = "Critical";
  } else if (clean.includes("high") || clean.includes("important")) {
    importance = "High";
  } else if (clean.includes("low") || clean.includes("minor")) {
    importance = "Low";
  }

  // Extract effort
  let estimatedEffort = 1.5;
  const effortMatch = clean.match(/(\d+(\.\d+)?)\s*(hour|hr|h)/);
  if (effortMatch) {
    estimatedEffort = parseFloat(effortMatch[1]);
  }

  // Strip common command phrases
  let title = command
    .replace(/(schedule|create|add|new task|remind me to|i need to)\s+/i, "")
    .trim();
  if (title.length < 3) {
    title = command;
  }
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const deadline = tomorrow.toISOString().split("T")[0];

  return {
    success: true,
    explanation: `Heuristic parser successfully identified: "${title}" mapped under ${category} category with ${importance} priority.`,
    task: {
      title,
      category,
      importance,
      estimatedEffort,
      deadline,
      subtasks: [
        `Initial preparation and scope analysis for "${title}"`,
        `Execute primary deliverables of "${title}"`,
        `Review and verify against constraints`
      ]
    }
  };
}

function fallbackCoachInsights(tasks: any[] = [], completedCount: number = 0, activeStreak: number = 0, stats: any = {}) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeStats = stats || {};
  const avgProcr = safeStats.averageProcrastination ?? 5;
  const morningVel = safeStats.morningVelocity ?? 5;
  const eveningVel = safeStats.eveningVelocity ?? 5;

  let greeting = `Welcome back, Vikas! You have a streak of ${activeStreak} active days and have completed ${completedCount} tasks. Let's make today another high-yield session!`;
  if (activeStreak > 10) {
    greeting = `🔥 Superb momentum, Vikas! Your ${activeStreak}-day consistency streak is highly elite. Let's target key priorities to maintain your high focus velocity today!`;
  } else if (completedCount > 5) {
    greeting = `⚡ Outstanding job today! With ${completedCount} completed milestones under your belt, you're building massive cognitive momentum.`;
  }

  const insights = [];

  // Insight 1: timing based on velocity
  if (morningVel >= eveningVel) {
    insights.push({
      type: "timing",
      text: `Your morning focus velocity is high (${morningVel}/10). You usually process technical concepts with 25% lower effort before 12:00 PM.`,
      actionableTip: "Tackle your DBMS or technical assignments during your morning focus hours."
    });
  } else {
    insights.push({
      type: "timing",
      text: `Your evening focus velocity is high (${eveningVel}/10). Your model registers deep concentration spikes after 6:00 PM.`,
      actionableTip: "Reserve creative or drafting tasks for late-afternoon, and tackle complex study notes this evening."
    });
  }

  // Insight 2: procrastination warning
  if (avgProcr >= 7) {
    insights.push({
      type: "alert",
      text: `Base procrastination rate is currently elevated at ${avgProcr}/10. This is typically triggered by vague task definitions or missing outlines.`,
      actionableTip: "Select your top priority task and split it into 3 microscopic steps right now."
    });
  } else {
    insights.push({
      type: "focus",
      text: "Your procrastination resistance is excellent today! Clear task milestones are keeping active avoidance extremely low.",
      actionableTip: "Capitalize on this high willpower state to launch a 50-minute Pomodoro session on your biggest project."
    });
  }

  // Insight 3: motivation / general habit
  const incompleteStudy = safeTasks.filter((t: any) => t && !t.completed && (t.category === "Study" || (t.title && /study|exam|learn|class|course|assignment/i.test(t.title)))).length;
  if (incompleteStudy > 0) {
    insights.push({
      type: "motivation",
      text: `Vikas, you have ${incompleteStudy} study goals pending on your board. Finishing them early unlocks custom XP rewards.`,
      actionableTip: "Open the focus timer block and commit to just 15 minutes of uninterrupted work to spark momentum."
    });
  } else {
    insights.push({
      type: "motivation",
      text: "Consistency is built on micro-victories. Every checked box primes your brain for long-term project achievements.",
      actionableTip: "Keep your daily streak alive by completing today's Gym workout habit!"
    });
  }

  return { greeting, insights };
}

// Caching layer for coach insights to respect free tier quotas
let cachedCoachInsights: {
  timestamp: number;
  completedCount: number;
  activeStreak: number;
  data: any;
} | null = null;

// 1. Evaluate Task Actionability & Procrastination Score
app.post("/api/evaluate-task", async (req, res) => {
  const { title, description, category } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const prompt = `
      Evaluate the actionability of the following task.
      Task Title: "${title}"
      Description: "${description || "None provided"}"
      Category: "${category || "Personal"}"

      Vague tasks trigger high procrastination. Score the task from 0 to 100:
      - 80-100: Extremely actionable, clear next step, measurable, low barrier to start.
      - 50-79: Moderate, could be broken down further or clarified.
      - 0-49: Vague or too large. Needs immediate breakdown.

      If the score is below 90, provide concrete, actionable subtasks (3-5 items) to replace this vague task and explain briefly why it was scored this way.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: "Actionability score from 0 to 100",
            },
            explanation: {
              type: Type.STRING,
              description: "Brief human explanation of why the task is scored this way and what makes it vague/clear.",
            },
            suggestedSubtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3 to 5 clear, concrete, actionable steps to finish this task.",
            },
          },
          required: ["score", "explanation", "suggestedSubtasks"],
        },
      },
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || (error?.message && error.message.includes("quota"));
    const isUnavailableError = error?.status === 503 || (error?.message && (error.message.includes("high demand") || error.message.includes("UNAVAILABLE")));

    if (isQuotaError) {
      console.warn("Gemini API daily quota limit exceeded (429) during task evaluation. Serving offline evaluation fallback.");
    } else if (isUnavailableError) {
      console.warn("Gemini API temporarily unavailable (503) during task evaluation. Serving offline evaluation fallback.");
    } else {
      console.warn("Error evaluating task with Gemini API, triggering local heuristic fallback:", error);
    }

    try {
      res.json(fallbackEvaluateTask(title, description || "", category || ""));
    } catch (fallbackError: any) {
      res.status(500).json({ error: fallbackError.message || "Failed to evaluate task" });
    }
  }
});

// 2. Prioritize Multiple Tasks & Estimate Delay Risk
app.post("/api/prioritize-tasks", async (req, res) => {
  const { tasks, userDelayRiskFactor } = req.body;
  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "A list of tasks is required" });
  }

  try {
    const prompt = `
      You are an expert AI productivity priority engine.
      Analyze the following tasks and calculate:
      1. Priority Score (0-100) based on: Deadline Urgency + Importance Weight + Estimated Effort + User's inherent procrastination risk (${userDelayRiskFactor || 5}/10).
      2. Delay Risk % (0-100) indicating how likely the user is to miss the deadline due to procrastination, estimated effort, and remaining time.

      Tasks to process:
      ${JSON.stringify(tasks, null, 2)}
      
      Current Date & Time: ${new Date().toISOString()}

      Provide the calculated priorityScore and delayRisk percentage for each task. Maintain the exact task ID.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "The task ID" },
              priorityScore: { type: Type.INTEGER, description: "Calculated Priority score (0-100)" },
              delayRisk: { type: Type.INTEGER, description: "Calculated delay/procrastination risk percentage (0-100)" },
              reason: { type: Type.STRING, description: "A one-sentence explanation of the priority score and risk." },
            },
            required: ["id", "priorityScore", "delayRisk", "reason"],
          },
        },
      },
    });

    const resultText = response.text || "[]";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || (error?.message && error.message.includes("quota"));
    const isUnavailableError = error?.status === 503 || (error?.message && (error.message.includes("high demand") || error.message.includes("UNAVAILABLE")));

    if (isQuotaError) {
      console.warn("Gemini API daily quota limit exceeded (429) during task prioritization. Serving offline prioritization fallback.");
    } else if (isUnavailableError) {
      console.warn("Gemini API temporarily unavailable (503) during task prioritization. Serving offline prioritization fallback.");
    } else {
      console.warn("Error prioritizing tasks with Gemini API, triggering local heuristic fallback:", error);
    }

    try {
      res.json(fallbackPrioritizeTasks(tasks, userDelayRiskFactor));
    } catch (fallbackError: any) {
      res.status(500).json({ error: fallbackError.message || "Failed to prioritize tasks" });
    }
  }
});

// 3. Autonomous Planning (Vague Goal Breakdown)
app.post("/api/autonomous-plan", async (req, res) => {
  const { goal, timeframeDays } = req.body;
  if (!goal) {
    return res.status(400).json({ error: "Goal is required" });
  }

  const days = timeframeDays || 7;

  try {
    const prompt = `
      Create a step-by-step day-by-day autonomous masterplan for the goal: "${goal}".
      Timeframe: ${days} days.
      Divide the work intelligently so that the user submits or finishes it successfully on Day ${days}.
      Avoid overwhelming chunks. Provide a title and description for each day.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goalSummary: { type: Type.STRING, description: "High-level summary of the breakdown strategy." },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER, description: "Day number (1, 2, ...)" },
                  title: { type: Type.STRING, description: "Core focus or title for this day." },
                  tasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Specific concrete items/tasks to complete on this day.",
                  },
                },
                required: ["day", "title", "tasks"],
              },
            },
          },
          required: ["goalSummary", "timeline"],
        },
      },
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.warn("Error creating autonomous plan with Gemini API, triggering local heuristic fallback:", error);
    try {
      res.json(fallbackAutonomousPlan(goal, days));
    } catch (fallbackError: any) {
      res.status(500).json({ error: fallbackError.message || "Failed to create autonomous plan" });
    }
  }
});

// 4. Voice / Command Parsing Assistant
app.post("/api/voice-command", async (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }

  try {
    const prompt = `
      You are ActionPilot's smart voice and natural language command parser.
      Translate the user's input command into structured task creation payloads.
      Input Command: "${command}"

      Extract:
      1. Task title (concise but actionable)
      2. Category: Work, Study, Health, Finance, or Personal (default to Personal)
      3. Importance: Low, Medium, High, or Critical (default to Medium)
      4. Estimated effort in hours (default to 1.5)
      5. Approximate deadline: ISO date string based on context (Current date is: ${new Date().toISOString()}). If no deadline mentioned, default to tomorrow.
      6. Suggested subtasks: 2-4 subtasks to jumpstart this task.

      Format the output strictly as JSON matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN, description: "Whether a valid task could be parsed" },
            explanation: { type: Type.STRING, description: "What was understood and scheduled." },
            task: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                importance: { type: Type.STRING },
                estimatedEffort: { type: Type.NUMBER },
                deadline: { type: Type.STRING },
                subtasks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["title", "category", "importance", "estimatedEffort", "deadline", "subtasks"],
            },
          },
          required: ["success", "explanation"],
        },
      },
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.warn("Error parsing voice command with Gemini API, triggering local heuristic fallback:", error);
    try {
      res.json(fallbackVoiceCommand(command));
    } catch (fallbackError: any) {
      res.status(500).json({ error: fallbackError.message || "Failed to parse command" });
    }
  }
});

// 5. Coach Insights Generator
app.post("/api/coach-insights", async (req, res) => {
  const { tasks, completedCount, activeStreak, stats } = req.body;
  const now = Date.now();

  // If we have a cache that is less than 5 minutes old AND the completedCount and activeStreak are unchanged,
  // serve it immediately to avoid hitting Gemini API rate limits.
  if (
    cachedCoachInsights &&
    now - cachedCoachInsights.timestamp < 300000 &&
    cachedCoachInsights.completedCount === completedCount &&
    cachedCoachInsights.activeStreak === activeStreak
  ) {
    return res.json(cachedCoachInsights.data);
  }

  try {
    const prompt = `
      You are ActionPilot's AI Productivity Coach.
      Analyze the current user profile, tasks, and state:
      - Active Tasks: ${JSON.stringify(tasks || [])}
      - Completed Tasks Count: ${completedCount || 0}
      - Daily Streak: ${activeStreak || 0} days
      - Procrastination self-assessment: ${stats?.averageProcrastination || 5}/10
      - Work velocity: Morning is ${stats?.morningVelocity || 5}/10, Evening is ${stats?.eveningVelocity || 5}/10

      Generate 3 highly personalized, ultra-actionable, supportive productivity insights or quotes to show on their dashboard.
      Focus on timing (e.g. studying in morning vs evening based on velocities), risk of procrastinating based on vague tasks, and motivation.
      Keep them short, powerful, and specific to their data. No generic self-help slop.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            greeting: { type: Type.STRING, description: "A tailored friendly motivational coach greeting based on streak/completes." },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Type: 'timing', 'focus', 'alert', or 'motivation'" },
                  text: { type: Type.STRING, description: "The direct coaching feedback text." },
                  actionableTip: { type: Type.STRING, description: "One simple immediate action they can take." },
                },
                required: ["type", "text", "actionableTip"],
              },
            },
          },
          required: ["greeting", "insights"],
        },
      },
    });

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText);

    // Store in cache
    cachedCoachInsights = {
      timestamp: now,
      completedCount,
      activeStreak,
      data: parsedData,
    };

    res.json(parsedData);
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || (error?.message && error.message.includes("quota"));
    const isUnavailableError = error?.status === 503 || (error?.message && (error.message.includes("high demand") || error.message.includes("UNAVAILABLE")));

    if (isQuotaError) {
      console.warn("Gemini API daily quota limit exceeded (429). Serving offline hybrid coach insights.");
    } else if (isUnavailableError) {
      console.warn("Gemini API temporarily unavailable (503). Serving offline hybrid coach insights.");
    } else {
      console.warn("Error generating coach insights with Gemini API, triggering local fallback:", error);
    }

    try {
      const fallback = fallbackCoachInsights(tasks, completedCount, activeStreak, stats);
      // Even on failure, cache the fallback for 1 minute to avoid spamming a rate-limited API
      cachedCoachInsights = {
        timestamp: now - 240000, // Expires in 1 minute
        completedCount,
        activeStreak,
        data: fallback,
      };
      res.json(fallback);
    } catch (fallbackError: any) {
      res.status(500).json({ error: fallbackError.message || "Failed to generate coach insights" });
    }
  }
});

// 6. Conversational Chat Assistant
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Format conversation history for Gemini API
    const formattedContents = [];
    if (Array.isArray(history)) {
      history.forEach((msg: any) => {
        formattedContents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content || "" }]
        });
      });
    }
    
    // Add current user message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const systemInstruction = `
      You are ActionPilot's ambient AI Productivity Companion.
      The user is Vikas, an ambitious student working on technical subjects (like DBMS, machine learning, projects, coding).
      Your tone is extremely supportive, highly structured, practical, and motivating (no generic corporate jargon).
      Use clean bullet points and markdown formatting where helpful.
      Keep responses brief and punchy so they read nicely inside a compact floating mobile-style chat widget.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    res.json({ response: response.text || "I'm processing your request. Let's make progress!" });
  } catch (error: any) {
    console.warn("Error running AI chat, triggering local fallback conversation:", error);
    try {
      res.json(fallbackChat(message, history));
    } catch (fallbackError: any) {
      res.status(500).json({ error: fallbackError.message || "Failed to generate chat response" });
    }
  }
});

// Mount Vite middleware or Static serving
async function startServer() {
  console.log("🚀 Starting ActionPilot server...");
  if (process.env.NODE_ENV !== "production") {
    console.log("Creating Vite server...");
    const vite = await createViteServer({
  server: {
    middlewareMode: true,
    fs: {
      allow: [process.cwd()],
    },
  },
  appType: "spa",
});
    app.use(vite.middlewares);
    console.log("✅ Vite middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  console.log("Starting Express...");

app.listen(PORT, () => {
console.log(`✅ Server running at http://localhost:${PORT}`);  });
}
startServer().catch((err) => {
  console.error("❌ Failed to start server");
  console.error(err);
  process.exit(1);
});