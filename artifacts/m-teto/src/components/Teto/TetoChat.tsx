import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles } from "lucide-react";
import { TetoAvatar } from "./TetoAvatar";
import { getGapSummaryForTeto, getTopicsSummaryForTeto } from "@/lib/adaptiveLearning";

interface Message {
  role: "user" | "teto";
  content: string;
  timestamp: Date;
}

interface Props {
  gradeLevel?: string;
  userName?: string;
}

const QUICK_QUESTIONS: Record<string, string[]> = {
  grade_1_2: [
    "I feel scared at school",
    "Someone hurt me",
    "What are my rights?",
    "I need help now",
  ],
  grade_3_5: [
    "What is SRGBV?",
    "Someone is bullying me",
    "How do I get help?",
    "What are my rights at school?",
  ],
  grade_6_7: [
    "What is consent?",
    "How do I report abuse?",
    "What is a J88 form?",
    "I'm in a scary relationship",
  ],
  grade_8_12: [
    "What are my legal rights?",
    "How do I get a protection order?",
    "What happens after I report?",
    "LGBTQIA+ rights in SA",
  ],
};

const TETO_GREETINGS: Record<string, string> = {
  grade_1_2: "Hi! 🔥 I'm TETO the phoenix — your justice companion and friend! Ask me anything and I'll help you!",
  grade_3_5: "Hey friend! 🔥 I'm TETO the phoenix, your justice companion here to help you learn, grow and become the ultimate human rights defender! What would you like to know?",
  grade_6_7: "Hey! I'm TETO 🔥 — your justice companion and friend at M-TETO. I know all about your rights, staying safe, and getting help. What's on your mind?",
  grade_8_12: "Hello! I'm TETO 🔥 — your justice companion and friend at M-TETO. I'm here to help you learn, grow and become the ultimate human rights defender. Ask me anything.",
};

export function TetoChat({ gradeLevel = "grade_3_5", userName }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [talking, setTalking] = useState(false);
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const talkStopTimer = useRef<ReturnType<typeof setTimeout>>();

  const quickQuestions = QUICK_QUESTIONS[gradeLevel] || QUICK_QUESTIONS.grade_3_5;
  const greeting = TETO_GREETINGS[gradeLevel] || TETO_GREETINGS.grade_3_5;

  // Show welcome bubble on first load after 2 seconds
  useEffect(() => {
    const shown = sessionStorage.getItem("teto_welcomed");
    if (!shown) {
      const timer = setTimeout(() => {
        setShowWelcomeBubble(true);
        sessionStorage.setItem("teto_welcomed", "1");
        setTimeout(() => setShowWelcomeBubble(false), 5000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Initialize with greeting when chat opens
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "teto",
          content: greeting,
          timestamp: new Date(),
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      setTalking(true);
      try {
        const history = messages
          .slice(-6) // last 6 messages for context
          .map((m) => ({ role: m.role === "teto" ? "assistant" as const : "user" as const, content: m.content }));

        const res = await fetch("/api/teto/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            message: text,
            gradeLevel,
            knowledgeContext: [getGapSummaryForTeto(), getTopicsSummaryForTeto()].filter(Boolean).join(" ") || undefined,
            conversationHistory: history,
          }),
        });

        const data = await res.json();
        const reply = data.reply || "Tweet tweet! I didn't quite catch that! 🐣";
        setMessages((prev) => [
          ...prev,
          { role: "teto", content: reply, timestamp: new Date() },
        ]);
        // Keep TETO talking for approx time it takes to read the reply
        clearTimeout(talkStopTimer.current);
        talkStopTimer.current = setTimeout(() => setTalking(false), Math.min(reply.length * 40, 5000));
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "teto", content: "Oops! I had a little hiccup. Please try again! 🐣", timestamp: new Date() },
        ]);
        setTalking(false);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, gradeLevel]
  );

  const gradeColors: Record<string, { bg: string; accent: string; bubble: string }> = {
    grade_1_2: { bg: "#FFF8E1", accent: "#F59E0B", bubble: "#FFE566" },
    grade_3_5: { bg: "#FFF3E0", accent: "#F97316", bubble: "#FDBA74" },
    grade_6_7: { bg: "#F5F3FF", accent: "#7C3AED", bubble: "#C4B5FD" },
    grade_8_12: { bg: "#FEF3C7", accent: "#92400E", bubble: "#FCD34D" },
  };
  const colors = gradeColors[gradeLevel] || gradeColors.grade_3_5;

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-20 right-4 z-[150] flex flex-col items-end gap-2">
        {/* Welcome speech bubble */}
        <AnimatePresence>
          {showWelcomeBubble && !open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="bg-white rounded-2xl shadow-lg px-3 py-2 max-w-[180px] text-center border-2"
              style={{ borderColor: colors.accent }}
            >
              <p className="text-xs font-bold" style={{ color: colors.accent }}>
                {gradeLevel === "grade_1_2" ? "Tweet tweet! Need help? 🐣" : "Hi! I'm TETO. Ask me anything! 🐦"}
              </p>
              {/* Tail */}
              <div
                className="absolute -bottom-2 right-6 w-0 h-0"
                style={{
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: `8px solid ${colors.accent}`,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main button */}
        <motion.button
          onClick={() => {
            setOpen(true);
            setShowWelcomeBubble(false);
          }}
          className="rounded-full shadow-xl flex items-center justify-center overflow-hidden border-4 border-white transition-all"
          style={{
            width: 62,
            height: 62,
            background: `radial-gradient(circle, ${colors.bg}, white)`,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Ask TETO"
        >
          <TetoAvatar grade={gradeLevel} size={52} animated={!open} />
        </motion.button>

        {/* TETO label */}
        <div
          className="text-[10px] font-black tracking-wide px-2 py-0.5 rounded-full text-white shadow-sm"
          style={{ background: colors.accent }}
        >
          TETO
        </div>
      </div>

      {/* Chat Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-[160] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Chat panel */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[170] bg-white rounded-t-3xl shadow-2xl flex flex-col"
              style={{ height: "78vh", maxWidth: 480, margin: "0 auto" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 px-5 py-4 rounded-t-3xl flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${colors.bg}, white)` }}
              >
                <TetoAvatar grade={gradeLevel} size={44} animated={true} talking={talking || loading} />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-black text-base" style={{ color: colors.accent }}>
                      TETO
                    </h3>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                  </div>
                  <p className="text-xs text-muted-foreground">Your M-TETO guide • Always here for you</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {msg.role === "teto" && (
                      <div className="flex-shrink-0 mb-1">
                        <TetoAvatar grade={gradeLevel} size={30} animated={false} />
                      </div>
                    )}
                    <div
                      className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={
                        msg.role === "teto"
                          ? { background: colors.bg, color: "#1F2937" }
                          : {
                              background: `linear-gradient(135deg, #E8215D, #F4826C)`,
                              color: "white",
                            }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-end gap-2">
                    <TetoAvatar grade={gradeLevel} size={30} animated={true} />
                    <div
                      className="px-4 py-3 rounded-2xl flex gap-1.5 items-center"
                      style={{ background: colors.bg }}
                    >
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: colors.accent,
                            animation: `pulse 1.2s ease-in-out ${delay}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick questions */}
              {messages.length <= 1 && (
                <div className="flex-shrink-0 px-4 pb-2 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="flex-shrink-0 text-xs px-3 py-2 rounded-full font-semibold border-2 transition-all hover:scale-105 active:scale-95"
                        style={{ borderColor: colors.accent, color: colors.accent, background: colors.bg }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="flex-shrink-0 px-4 pb-5 pt-2 border-t border-gray-100 bg-white rounded-b-0">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                  className="flex gap-2 items-center"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={gradeLevel === "grade_1_2" ? "Tweet me! 🐣" : "Ask TETO anything..."}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    maxLength={500}
                  />
                  <motion.button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
                    style={{ background: `linear-gradient(135deg, #E8215D, #F4826C)` }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
