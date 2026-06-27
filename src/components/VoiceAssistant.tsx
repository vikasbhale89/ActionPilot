import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  X, 
  Bot, 
  User, 
  ListPlus,
  Loader2,
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface VoiceAssistantProps {
  onAddTaskFromVoice: (parsedTask: any) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
}

export default function VoiceAssistant({ onAddTaskFromVoice }: VoiceAssistantProps) {
  // Floating Window States
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "voice">("chat");

  // Conversational Chat States
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      content: "Hello Vikas! I'm your ActionPilot AI assistant. I can help you break down heavy DBMS assignments, plan your study blocks, provide behavioral coaching to fight procrastination, or schedule tasks directly using voice autopilot. What are we focused on today?",
      timestamp: new Date()
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Voice Assistant States
  const [commandText, setCommandText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [parsedFeedback, setParsedFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const presets = [
    "Schedule my machine learning exam study block tomorrow morning",
    "Remind me to pay electricity bill today high importance",
    "Organize internship preparation with 3 subtasks starting next Monday",
  ];

  // Auto-scroll chat history to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatLoading, isOpen]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setParsedFeedback(null);
        setCommandText(""); // Clear only when real voice recognition successfully starts!
      };

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCommandText(transcript);
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setParsedFeedback("Microphone permission denied. Enter commands via keyboard or select presets.");
        } else {
          setParsedFeedback(`Microphone issue: ${event.error}. Enter text or try again.`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;

      return () => {
        try {
          rec.abort();
        } catch (e) {}
      };
    }
  }, []);

  // Handle Conversational Chat Submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = chatInput.trim();
    setChatInput("");
    setIsChatLoading(true);
    setChatError(null);

    try {
      const historyPayload = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          history: historyPayload
        })
      });

      if (!response.ok) throw new Error("Connection limits reached");
      const data = await response.json();

      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        role: "model",
        content: data.response || "I am here. Let's make continuous progress on your goals!",
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error(err);
      setChatError("High-demand fallback activated: Could not establish a stream. Please retry.");
      // Add local robust fallback reply directly to conversational list
      setMessages((prev) => [...prev, {
        id: `ai-fallback-${Date.now()}`,
        role: "model",
        content: "I am experiencing heavy server loads, but I'm still online! Remember that productivity is built on micro-victories. Let's focus on the absolute smallest step we can complete right now. You can also schedule items directly in the 'Voice Pilot' tab!",
        timestamp: new Date()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle Voice / Task Command Submission
  const handleVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText.trim() || isVoiceProcessing) return;

    setIsVoiceProcessing(true);
    setParsedFeedback(null);

    try {
      const response = await fetch("/api/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: commandText.trim() }),
      });

      if (!response.ok) throw new Error("Failed to parse voice command");
      const result = await response.json();

      if (result.success && result.task) {
        onAddTaskFromVoice(result.task);
        setParsedFeedback(result.explanation || "Task parsed and added successfully!");
        setCommandText("");
        
        // Also feed a confirmation directly to chat messages so they see it there too
        setMessages((prev) => [...prev, {
          id: `ai-sync-${Date.now()}`,
          role: "model",
          content: `⚡ **Autopilot Sync Success**: I've successfully scheduled a new task for you! **"${result.task.title}"** has been added to your Active Action Board with **${result.task.importance}** importance and **${result.task.estimatedEffort}h** estimated effort.`,
          timestamp: new Date()
        }]);
      } else {
        setParsedFeedback("AI could not extract a clear task. Try specifying a clear action verb.");
      }
    } catch (err) {
      console.error(err);
      setParsedFeedback("Failed to contact the voice comprehension server. Loading local parser fallback...");
      // Client-side fallback task parsing for high resilience
      const fallbackTask = {
        id: `fallback-${Date.now()}`,
        title: commandText,
        category: "Study",
        importance: "Medium",
        estimatedEffort: 1.5,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        completed: false,
        subtasks: [
          { id: `sub-f-1`, title: "Breakdown core objectives", completed: false },
          { id: `sub-f-2`, title: "Review requirements", completed: false }
        ]
      };
      onAddTaskFromVoice(fallbackTask);
      setParsedFeedback(`Auto-scheduled: "${commandText}" via resilient client fallback engine.`);
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  const triggerSimulation = () => {
    setIsListening(true);
    setCommandText("");
    let currentWordIndex = 0;
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    const words = randomPreset.split(" ");
    const interval = setInterval(() => {
      setCommandText((prev) => (prev ? prev + " " + words[currentWordIndex] : words[currentWordIndex]));
      currentWordIndex++;
      if (currentWordIndex >= words.length) {
        setIsListening(false);
        clearInterval(interval);
      }
    }, 250);
  };

  const startVoiceCapture = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Error stopping speech recognition:", e);
        }
      }
      setIsListening(false);
    } else {
      setParsedFeedback(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn("Speech recognition start failed:", err);
          setParsedFeedback("Microphone activation failed. Please try typing your command directly instead.");
        }
      } else {
        setParsedFeedback("Microphone API is not supported or permitted in this browser frame. Please type your command or use one of the presets.");
      }
    }
  };

  return (
    <>
      {/* FLOATING TOGGLE TRIGGER BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 p-4 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer relative overflow-hidden group ${
            isOpen 
              ? "bg-slate-900 border border-white/20 text-white" 
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white border border-white/10"
          }`}
          style={{ boxShadow: isOpen ? "0 10px 25px -5px rgba(0,0,0,0.5)" : "0 12px 30px -5px rgba(99, 102, 241, 0.4)" }}
          id="ai-assistant-toggle"
        >
          {/* Subtle glowing animated background circle when closed */}
          {!isOpen && (
            <span className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
          )}
          
          <div className="relative flex items-center gap-2">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close-icon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="open-icon"
                  className="flex items-center gap-1"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="relative">
                    <Sparkles className="w-5 h-5 animate-pulse text-yellow-300 fill-yellow-300/10" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-950 animate-ping" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-950" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!isOpen && <span className="font-extrabold tracking-wider pr-1">Ask AI Assistant</span>}
          </div>
        </button>
      </div>

      {/* FLOATING OVERLAY CHAT WIDGET */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="fixed bottom-24 right-4 sm:right-6 w-[430px] max-w-[calc(100vw-2rem)] h-[500px] sm:h-[600px] max-h-[calc(100vh-7.5rem)] min-h-[360px] bg-[#0c0d12]/98 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl z-50"
            style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)" }}
            id="ai-assistant-overlay"
          >
            {/* WIDGET HEADER */}
            <div className="p-4 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                    ActionPilot Companion
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                      Active Pilot Online
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB SELECTORS */}
            <div className="p-2 bg-white/[0.01] border-b border-white/5 flex gap-1">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "chat"
                    ? "bg-white/10 text-white border border-white/10 shadow-inner"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                AI Learning Chat
              </button>
              <button
                onClick={() => setActiveTab("voice")}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "voice"
                    ? "bg-white/10 text-white border border-white/10 shadow-inner"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-blue-400" />
                Voice Pilot
              </button>
            </div>

            {/* WIDGET CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              
              {/* TAB 1: CONVERSATIONAL CHAT */}
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col justify-between h-full min-h-0">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 max-w-[85%] ${
                          msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            msg.role === "user"
                              ? "bg-white/10 text-slate-200"
                              : "bg-indigo-950 border border-indigo-500/30 text-indigo-300"
                          }`}
                        >
                          {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            msg.role === "user"
                              ? "bg-gradient-to-br from-indigo-600/80 to-violet-600/80 text-white border border-indigo-500/30 rounded-tr-none"
                              : "bg-white/[0.03] border border-white/10 text-slate-100 rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <span className="block text-[8px] font-mono text-slate-500 text-right mt-1.5">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Chat error notice */}
                    {chatError && (
                      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-red-300 leading-normal">{chatError}</p>
                      </div>
                    )}

                    {/* AI Thinking indicator */}
                    {isChatLoading && (
                      <div className="flex gap-2.5 max-w-[80%] mr-auto items-center">
                        <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                          <span className="text-[10px] text-slate-400 font-mono font-bold animate-pulse uppercase tracking-wider">
                            Composing reply...
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* CHAT INPUT FORM */}
                  <form onSubmit={handleChatSubmit} className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask advice on studying, task block design..."
                      disabled={isChatLoading}
                      className="flex-1 bg-white/5 text-white placeholder-white/30 text-xs px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim()}
                      className="p-2.5 bg-white text-black hover:bg-indigo-500 hover:text-white rounded-xl transition-all disabled:opacity-30 disabled:bg-white/10 disabled:text-white/30 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: VOICE AUTOPILOT / COMMAND PARSER */}
              {activeTab === "voice" && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                        Speak or type natural sentences. ActionPilot will decompose deadlines, estimate project loads, outline required subtasks, and schedule them directly onto your Board.
                      </p>
                    </div>

                    {/* COMMAND TEXTAREA & MIC */}
                    <form onSubmit={handleVoiceSubmit} className="space-y-3">
                      <div className="relative">
                        <textarea
                          rows={3}
                          value={commandText}
                          onChange={(e) => setCommandText(e.target.value)}
                          placeholder='Say: "Schedule machine learning study block tomorrow..." or click the mic to dictate...'
                          disabled={isVoiceProcessing}
                          className="w-full text-xs pl-4 pr-12 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 leading-relaxed resize-none"
                        />

                        <button
                          type="button"
                          onClick={startVoiceCapture}
                          disabled={isVoiceProcessing}
                          className={`absolute right-3 top-3 p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                            isListening 
                              ? "bg-rose-500 text-white animate-pulse" 
                              : "bg-white/10 hover:bg-white/20 text-slate-300"
                          }`}
                          title="Simulate Dictation"
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isVoiceProcessing || isListening || !commandText.trim()}
                        className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-black bg-white hover:bg-blue-500 hover:text-white disabled:bg-white/10 disabled:text-white/30 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isVoiceProcessing ? "AI Comprehending..." : "Submit Pilot Order"}
                      </button>
                    </form>

                    {/* DETAILED AI INTERPRETATION SUCCESS CONTAINER */}
                    {parsedFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                            Pilot Sync Confirmed
                          </p>
                          <p className="text-xs text-emerald-300 leading-normal mt-1 font-medium">
                            {parsedFeedback}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* DETAILED INTERACTIVE DICTATION PRESETS */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Quick presets & simulation options:
                      </p>
                      <button
                        type="button"
                        onClick={triggerSimulation}
                        disabled={isVoiceProcessing || isListening}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 font-mono font-bold uppercase tracking-wider underline cursor-pointer"
                      >
                        Run Dictation Demo
                      </button>
                    </div>
                    <div className="space-y-2">
                      {presets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCommandText(preset);
                            setParsedFeedback(null);
                          }}
                          disabled={isVoiceProcessing || isListening}
                          className="w-full text-left p-2.5 rounded-xl text-xs bg-white/[0.01] hover:bg-white/5 text-slate-300 border border-white/5 hover:border-white/10 transition-all truncate cursor-pointer"
                        >
                          "{preset}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
