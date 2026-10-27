import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Lock, Phone, Heart, Search, X } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import {
  computeResults,
  getQuestionsForGrade,
  type GradeLevel,
  type Question,
} from "./questions";
import { GAUTENG_SCHOOLS } from "./gautengSchools";
import { storeKnowledgeGaps, storeKnowledgeScore } from "@/lib/adaptiveLearning";

const GRADE_LABELS: Record<string, string> = {
  grade_1_2: "Grades 1–2",
  grade_3_5: "Grades 3–5",
  grade_6_7: "Grades 6–7",
  grade_8_12: "Grades 8–12",
};

interface Props {
  gradeLevel: GradeLevel;
  onComplete: () => void;
}

const EMERGENCY_RESOURCES = [
  { name: "Childline SA", number: "116", emoji: "📞", note: "Free, 24/7" },
  { name: "Police", number: "10111", emoji: "🚨", note: "Emergency" },
  { name: "GBV Helpline", number: "0800 428 428", emoji: "💙", note: "Free, 24/7" },
];

export function OnboardingWizard({ gradeLevel, onComplete }: Props) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [screenIndex, setScreenIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showRiskBanner, setShowRiskBanner] = useState(false);
  const { isAuthenticated, login } = useAuth();

  const allQuestions = useMemo(() => getQuestionsForGrade(gradeLevel), [gradeLevel]);

  // Build screens — filter followUpIf questions dynamically but keep stable ordering
  const screens = useMemo(() => {
    return [
      "welcome" as const,
      ...allQuestions.map((q) => ({ q })),
      "signup" as const,
      "complete" as const,
    ];
  }, [allQuestions]);

  const current = screens[screenIndex];
  const totalQuestions = screens.filter((s) => typeof s === "object").length;
  const currentQuestionNumber = useMemo(
    () => screens.slice(0, screenIndex).filter((s) => typeof s === "object").length + 1,
    [screens, screenIndex]
  );
  const progress = screenIndex / Math.max(screens.length - 1, 1);

  // Check if a question should be skipped based on followUpIf
  const shouldSkip = useCallback(
    (q: Question): boolean => {
      if (!q.followUpIf) return false;
      const { questionId, values } = q.followUpIf;
      const answer = responses[questionId];
      return !answer || !values.includes(answer);
    },
    [responses]
  );

  const advanceForward = useCallback(() => {
    setDirection(1);
    setScreenIndex((i) => {
      let next = i + 1;
      while (next < screens.length) {
        const s = screens[next];
        if (typeof s === "object" && shouldSkip(s.q)) {
          next++;
        } else {
          break;
        }
      }
      return Math.min(next, screens.length - 1);
    });
  }, [screens, shouldSkip]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setScreenIndex((i) => {
      let prev = i - 1;
      while (prev > 0) {
        const s = screens[prev];
        if (typeof s === "object" && shouldSkip(s.q)) {
          prev--;
        } else {
          break;
        }
      }
      return Math.max(prev, 0);
    });
  }, [screens, shouldSkip]);

  const handleAnswer = useCallback(
    (question: Question, value: string) => {
      setResponses((prev) => ({ ...prev, [question.id]: value }));

      const opt = question.options.find((o) => o.value === value);
      const isHighRisk = question.isRiskFlag && (opt?.riskWeight ?? 0) >= 3;

      if (isHighRisk) {
        setShowRiskBanner(true);
        setTimeout(() => {
          setShowRiskBanner(false);
          advanceForward();
        }, 3500);
      } else {
        setTimeout(() => {
          advanceForward();
        }, 250);
      }
    },
    [advanceForward]
  );

  const handleTextAnswer = useCallback(
    (question: Question, value: string) => {
      setResponses((prev) => ({ ...prev, [question.id]: value }));
    },
    []
  );

  const handleSkip = useCallback(
    (question: Question) => {
      setResponses((prev) => ({ ...prev, [question.id]: "__skipped__" }));
      advanceForward();
    },
    [advanceForward]
  );

  const handleComplete = useCallback(async () => {
    const { knowledgeScore, riskLevel, hasRiskFlags, riskFlags } = computeResults(
      gradeLevel,
      responses
    );

    const demographics = {
      province: responses["d_province"],
      areaType: responses["d_area"],
      genderIdentity: responses["d_gender"],
      racialGroup: responses["d_race"],
      schoolType: responses["d_school_type"],
      school: responses["d_school"] !== "__skipped__" ? responses["d_school"] : undefined,
      grade: responses["d_grade"],
      hasDisability: responses["d_disability_yn"],
      disabilityType: responses["d_disability_type"] !== "__skipped__" ? responses["d_disability_type"] : undefined,
    };

    let sessionId = localStorage.getItem("mteto_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("mteto_session_id", sessionId);
    }

    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          gradeLevel,
          demographics,
          knowledgeScore,
          riskLevel,
          hasRiskFlags,
          riskFlags,
          assessmentData: responses,
        }),
      });
    } catch {
      // Silent fail — data collection is best-effort
    }

    const knowledgeQuestions = getQuestionsForGrade(gradeLevel).filter(
      (q) => q.section === "knowledge"
    );
    const wrongIds = knowledgeQuestions
      .filter((q) => {
        const answer = responses[q.id];
        const correctOpt = q.options.find((o) => o.isCorrect);
        return correctOpt && answer !== correctOpt.value;
      })
      .map((q) => q.id);
    storeKnowledgeGaps(wrongIds);
    storeKnowledgeScore(knowledgeScore);

    localStorage.setItem("mteto_onboarding_done", "1");
    if (responses["d_province"]) {
      localStorage.setItem("mteto_province", responses["d_province"]);
    }
    // Save disability pref to trigger accessibility panel on first load
    if (responses["d_disability_yn"] === "yes") {
      localStorage.setItem("mteto_has_disability", "true");
    }
    onComplete();
  }, [gradeLevel, responses, onComplete]);

  const isFirstScreen = screenIndex === 0;
  const isComplete = current === "complete";

  const results = useMemo(
    () => (isComplete ? computeResults(gradeLevel, responses) : null),
    [isComplete, gradeLevel, responses]
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="M-TETO Pre-Assessment"
    >
      <div
        className="w-full max-w-[420px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 flex-shrink-0" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            className="h-full brand-gradient"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Header row */}
        <div className="flex items-center px-4 py-3 flex-shrink-0">
          {!isFirstScreen && current !== "complete" ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm font-semibold"
              aria-label="Go back to previous question"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
            </button>
          ) : (
            <div className="w-16" />
          )}

          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-1.5">
              <span className="font-display font-bold text-sm brand-gradient-text">M-TETO</span>
            </div>
          </div>

          <div className="w-16 text-right">
            {typeof current === "object" && (
              <span className="text-[11px] text-muted-foreground/60 font-mono" aria-label={`Question ${currentQuestionNumber} of ${totalQuestions}`}>
                {currentQuestionNumber}/{totalQuestions}
              </span>
            )}
          </div>
        </div>

        {/* Risk banner */}
        <AnimatePresence>
          {showRiskBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 mb-2 bg-violet-50 border border-violet-300 rounded-2xl p-4 flex-shrink-0"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0" aria-hidden="true">💙</div>
                <div>
                  <p className="font-display font-bold text-violet-800 text-sm mb-1">
                    You are not alone.
                  </p>
                  <p className="text-xs text-violet-700 mb-2 leading-relaxed">
                    What happened is not your fault. Please reach out for help if you need to.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EMERGENCY_RESOURCES.map((r) => (
                      <a
                        key={r.number}
                        href={`tel:${r.number.replace(/\s/g, "")}`}
                        className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-1 rounded-full hover:bg-violet-200 transition-colors"
                        aria-label={`Call ${r.name} at ${r.number}`}
                      >
                        <span aria-hidden="true">{r.emoji}</span> {r.name}: {r.number}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={screenIndex}
              initial={{ x: direction * 32, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -32, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="px-5 pb-6 pt-1"
            >
              {current === "welcome" && (
                <WelcomeScreen gradeLevel={gradeLevel} onStart={advanceForward} />
              )}

              {typeof current === "object" && current.q.type === "text" && (
                <TextQuestionScreen
                  question={current.q}
                  value={responses[current.q.id] === "__skipped__" ? "" : (responses[current.q.id] || "")}
                  onChange={(val) => handleTextAnswer(current.q, val)}
                  onNext={() => advanceForward()}
                  onSkip={() => handleSkip(current.q)}
                />
              )}

              {typeof current === "object" && current.q.type === "school_search" && (
                <SchoolSearchScreen
                  question={current.q}
                  value={responses[current.q.id] === "__skipped__" ? "" : (responses[current.q.id] || "")}
                  onSelect={(val) => {
                    setResponses((prev) => ({ ...prev, [current.q.id]: val }));
                    setTimeout(() => advanceForward(), 250);
                  }}
                  onSkip={() => handleSkip(current.q)}
                />
              )}

              {typeof current === "object" && !current.q.type && (
                <QuestionScreen
                  question={current.q}
                  selected={responses[current.q.id]}
                  onAnswer={(val) => handleAnswer(current.q, val)}
                  onSkip={current.q.isOptional ? () => handleSkip(current.q) : undefined}
                />
              )}

              {current === "signup" && (
                <SignupScreen
                  isAuthenticated={isAuthenticated}
                  onLogin={login}
                  onSkip={advanceForward}
                />
              )}

              {current === "complete" && results && (
                <CompleteScreen
                  knowledgeScore={results.knowledgeScore}
                  riskLevel={results.riskLevel}
                  onEnter={handleComplete}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Welcome ───────────────────────────────────────────────────────────────────

function WelcomeScreen({ gradeLevel, onStart }: { gradeLevel: GradeLevel; onStart: () => void }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, rotate: -5 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="text-6xl mb-3 mt-1"
        aria-hidden="true"
      >
        🚀
      </motion.div>
      <h2 className="font-display font-bold text-2xl brand-gradient-text mb-1.5">
        Welcome to M-TETO!
      </h2>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        Quick questions to make M-TETO{" "}
        <strong className="text-foreground">perfect for {GRADE_LABELS[gradeLevel]}</strong>.
        It only takes a few minutes! 🌟
      </p>

      <div className="flex flex-col gap-2.5 mb-5 text-left">
        {[
          { emoji: "📍", title: "Where you live & your school", desc: "So we can find helpers near you" },
          { emoji: "📚", title: "What you know", desc: "So we can fill in the gaps" },
          { emoji: "🛡️", title: "How you feel at school", desc: "So you get the right support" },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 bg-primary/5 rounded-2xl p-3">
            <span className="text-xl flex-shrink-0" aria-hidden="true">{item.emoji}</span>
            <div>
              <p className="text-sm font-bold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5 flex items-start gap-2 text-left">
        <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-amber-700">
          <strong>Private &amp; safe.</strong> Your answers are never shown to anyone — only
          used anonymously to make M-TETO better for children in your area. Some questions are optional.
        </p>
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 rounded-2xl font-display font-bold text-lg text-white brand-gradient shadow-md transition-all hover:scale-[1.02] active:scale-95"
        aria-label="Start the assessment"
      >
        Let's Go! ✨
      </button>
    </div>
  );
}

// ── Choice Question ────────────────────────────────────────────────────────────

function QuestionScreen({
  question,
  selected,
  onAnswer,
  onSkip,
}: {
  question: Question;
  selected?: string;
  onAnswer: (val: string) => void;
  onSkip?: () => void;
}) {
  const isPrivate = question.isPrivate || question.isRiskFlag;

  const sectionConfig = {
    demographics: { bg: "#f0f9ff", color: "#0284c7", label: "👤 About You" },
    knowledge: { bg: "#fef3c7", color: "#d97706", label: "📚 What Do You Know?" },
    safety: { bg: "#fdf2f8", color: "#db2777", label: "🛡️ How Do You Feel?" },
  }[question.section];

  return (
    <div>
      <div className="mb-3">
        <span
          className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: sectionConfig.bg, color: sectionConfig.color }}
        >
          {sectionConfig.label}
        </span>
        {question.isOptional && (
          <span className="ml-2 text-[10px] text-muted-foreground font-semibold italic">Optional</span>
        )}
      </div>

      {isPrivate && (
        <div className="flex items-start gap-2 mb-3 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5" role="note">
          <Lock className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-violet-700 font-semibold leading-snug">
            {question.subtext || "Private & safe — only M-TETO sees this."}
          </p>
        </div>
      )}

      {!isPrivate && question.subtext && (
        <p className="text-xs text-muted-foreground mb-3 leading-snug">{question.subtext}</p>
      )}

      <h3 className="font-display font-bold text-[1.15rem] leading-snug mb-4 text-foreground">
        {question.text}
      </h3>

      <div className="flex flex-col gap-2" role="group" aria-label={question.text}>
        {question.options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <motion.button
              key={opt.value}
              onClick={() => onAnswer(opt.value)}
              className="w-full text-left rounded-2xl border-2 px-4 py-3.5 flex items-center gap-3 transition-all duration-200"
              whileTap={{ scale: 0.97 }}
              aria-pressed={isSelected}
              style={{
                borderColor: isSelected ? "#E8215D" : "#e5e7eb",
                background: isSelected
                  ? "linear-gradient(135deg, rgba(232,33,93,0.07), rgba(244,130,108,0.05))"
                  : "white",
                cursor: "pointer",
              }}
            >
              {opt.emoji && (
                <span className="text-xl w-7 text-center flex-shrink-0" aria-hidden="true">{opt.emoji}</span>
              )}
              <span
                className="font-sans text-sm flex-1 leading-snug"
                style={{ color: isSelected ? "#E8215D" : "#374151", fontWeight: isSelected ? 700 : 500 }}
              >
                {opt.label}
              </span>
              {isSelected && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#E8215D" }}
                  aria-hidden="true"
                >
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {onSkip && (
        <button
          onClick={onSkip}
          className="w-full mt-4 py-2.5 rounded-2xl text-sm text-muted-foreground font-semibold border border-border hover:bg-muted/40 transition-all"
          aria-label="Skip this optional question"
        >
          Skip this question →
        </button>
      )}
    </div>
  );
}

// ── Text Question ─────────────────────────────────────────────────────────────

function TextQuestionScreen({
  question,
  value,
  onChange,
  onNext,
  onSkip,
}: {
  question: Question;
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const sectionConfig = {
    demographics: { bg: "#f0f9ff", color: "#0284c7", label: "👤 About You" },
    knowledge: { bg: "#fef3c7", color: "#d97706", label: "📚 What Do You Know?" },
    safety: { bg: "#fdf2f8", color: "#db2777", label: "🛡️ How Do You Feel?" },
  }[question.section];

  const inputId = `text-q-${question.id}`;

  return (
    <div>
      <div className="mb-3">
        <span
          className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: sectionConfig.bg, color: sectionConfig.color }}
        >
          {sectionConfig.label}
        </span>
        <span className="ml-2 text-[10px] text-muted-foreground font-semibold italic">Optional</span>
      </div>

      {question.subtext && (
        <p className="text-xs text-muted-foreground mb-3 leading-snug bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
          {question.subtext}
        </p>
      )}

      <label htmlFor={inputId} className="font-display font-bold text-[1.15rem] leading-snug mb-4 text-foreground block">
        {question.text}
      </label>

      <textarea
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || "Type your answer here…"}
        rows={3}
        className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary resize-none"
        aria-describedby={question.subtext ? `${inputId}-desc` : undefined}
      />

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => {
            if (value.trim()) onNext();
            else onSkip();
          }}
          className="flex-1 py-3.5 rounded-2xl font-display font-bold text-sm text-white brand-gradient shadow-md transition-all hover:scale-[1.02] active:scale-95"
        >
          {value.trim() ? "Continue →" : "Continue →"}
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-3.5 rounded-2xl font-semibold text-sm text-muted-foreground border border-border hover:bg-muted/40 transition-all"
          aria-label="Skip this question"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ── School Search Question ────────────────────────────────────────────────────

function SchoolSearchScreen({
  question,
  value,
  onSelect,
  onSkip,
}: {
  question: Question;
  value: string;
  onSelect: (val: string) => void;
  onSkip: () => void;
}) {
  const [query, setQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return GAUTENG_SCHOOLS.slice(0, 20);
    const q = query.toLowerCase();
    return GAUTENG_SCHOOLS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [query]);

  const sectionConfig = { bg: "#f0f9ff", color: "#0284c7", label: "👤 About You" };
  const inputId = `school-search-${question.id}`;

  return (
    <div>
      <div className="mb-3">
        <span
          className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: sectionConfig.bg, color: sectionConfig.color }}
        >
          {sectionConfig.label}
        </span>
        <span className="ml-2 text-[10px] text-muted-foreground font-semibold italic">Optional</span>
      </div>

      <h3 className="font-display font-bold text-[1.15rem] leading-snug mb-1 text-foreground">
        {question.text}
      </h3>
      {question.subtext && (
        <p className="text-xs text-muted-foreground mb-3 leading-snug">{question.subtext}</p>
      )}

      {/* Search input */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" aria-hidden="true" />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={question.placeholder || "Type school name or area…"}
          className="w-full pl-9 pr-9 py-3 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-primary text-sm"
          aria-label="Search for your school"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results */}
      <div
        className="overflow-y-auto flex flex-col gap-1.5"
        style={{ maxHeight: "280px" }}
        role="listbox"
        aria-label="School search results"
      >
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No schools found. Try a different search.</p>
        ) : (
          filtered.map((school) => (
            <motion.button
              key={`${school.name}-${school.area}`}
              onClick={() => onSelect(school.name)}
              whileTap={{ scale: 0.97 }}
              className="w-full text-left rounded-2xl border-2 px-4 py-3 flex items-start gap-3 transition-all duration-150"
              style={{
                borderColor: value === school.name ? "#E8215D" : "#e5e7eb",
                background: value === school.name
                  ? "linear-gradient(135deg, rgba(232,33,93,0.07), rgba(244,130,108,0.05))"
                  : "white",
              }}
              role="option"
              aria-selected={value === school.name}
            >
              <span className="text-base mt-0.5 flex-shrink-0" aria-hidden="true">
                {school.type === "special" ? "♿" : school.type === "combined" ? "🏫" : school.type === "secondary" ? "🎓" : "📚"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-snug truncate" style={{ color: value === school.name ? "#E8215D" : "#111827" }}>
                  {school.name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{school.area} · {school.district}</p>
              </div>
              {value === school.name && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#E8215D" }} aria-hidden="true">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </motion.button>
          ))
        )}
      </div>

      <button
        onClick={onSkip}
        className="w-full mt-4 py-2.5 rounded-2xl text-sm text-muted-foreground font-semibold border border-border hover:bg-muted/40 transition-all"
        aria-label="Skip school selection"
      >
        My school isn't listed / Skip →
      </button>
    </div>
  );
}

// ── Sign Up ───────────────────────────────────────────────────────────────────

function SignupScreen({
  isAuthenticated,
  onLogin,
  onSkip,
}: {
  isAuthenticated: boolean;
  onLogin: () => void;
  onSkip: () => void;
}) {
  if (isAuthenticated) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4" aria-hidden="true">✅</div>
        <h2 className="font-display font-bold text-xl brand-gradient-text mb-2">
          You're signed in!
        </h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Your profile will be saved and your points will carry over across devices.
        </p>
        <button
          onClick={onSkip}
          className="w-full py-4 rounded-2xl font-display font-bold text-lg text-white brand-gradient shadow-md"
        >
          Almost done! →
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-5xl mb-3" aria-hidden="true">🌟</div>
      <h2 className="font-display font-bold text-xl mb-1.5">
        Create your M-TETO account
      </h2>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        Sign up to save your progress, earn points, and get personalised support. It's free!
      </p>

      <div className="flex flex-col gap-2.5 mb-6">
        {[
          { emoji: "⭐", text: "Earn points for every search & lesson" },
          { emoji: "🛡️", text: "Save your case tracker across devices" },
          { emoji: "🎓", text: "Track your learning journey" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-2.5 text-left">
            <span className="text-base" aria-hidden="true">{item.emoji}</span>
            <p className="text-sm text-foreground/80">{item.text}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onLogin}
        className="w-full py-4 rounded-2xl font-display font-bold text-base text-white brand-gradient shadow-lg mb-3 transition-all hover:scale-[1.02] active:scale-95"
      >
        Sign Up with Replit 🚀
      </button>

      <button
        onClick={onSkip}
        className="w-full py-3 rounded-2xl font-semibold text-sm text-muted-foreground border border-border hover:bg-muted/40 transition-all"
      >
        Skip for now (anonymous)
      </button>
    </div>
  );
}

// ── Complete ──────────────────────────────────────────────────────────────────

const BADGES = [
  { minScore: 80, emoji: "🏆", label: "Safety Champion", color: "#D97706" },
  { minScore: 50, emoji: "📚", label: "Safety Learner", color: "#E8215D" },
  { minScore: 0, emoji: "🌟", label: "Safety Explorer", color: "#059669" },
];

function CompleteScreen({
  knowledgeScore,
  riskLevel,
  onEnter,
}: {
  knowledgeScore: number;
  riskLevel: string;
  onEnter: () => void;
}) {
  const badge = BADGES.find((b) => knowledgeScore >= b.minScore) ?? BADGES[2];
  const showResources = riskLevel === "high" || riskLevel === "medium";

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.4, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="text-6xl mb-2"
        aria-hidden="true"
      >
        {badge.emoji}
      </motion.div>

      <h2 className="font-display font-bold text-2xl mb-1" style={{ color: badge.color }}>
        {badge.label}!
      </h2>
      <p className="text-xs text-muted-foreground mb-1">
        Knowledge score: <strong>{knowledgeScore}%</strong>
      </p>

      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mb-4" role="progressbar" aria-valuenow={knowledgeScore} aria-valuemin={0} aria-valuemax={100} aria-label={`Knowledge score: ${knowledgeScore} percent`}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: badge.color }}
          initial={{ width: 0 }}
          animate={{ width: `${knowledgeScore}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </div>

      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        {knowledgeScore >= 80
          ? "Amazing! You know a lot about your rights. M-TETO will take you even further! 🌟"
          : knowledgeScore >= 50
          ? "Great start! M-TETO has everything you need to learn more. 📚"
          : "Welcome! That's exactly why M-TETO is here — let's learn together. 💙"}
      </p>

      {showResources && (
        <div className="mb-5 text-left bg-violet-50 border border-violet-200 rounded-2xl p-4" role="complementary" aria-label="Emergency resources">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-violet-600" aria-hidden="true" />
            <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">
              Remember — help is always available
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {EMERGENCY_RESOURCES.map((r) => (
              <a
                key={r.number}
                href={`tel:${r.number.replace(/\s/g, "")}`}
                className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 hover:bg-violet-100/50 transition-all"
                aria-label={`Call ${r.name}: ${r.number}. ${r.note}`}
              >
                <span className="text-base" aria-hidden="true">{r.emoji}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.note}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-violet-500" aria-hidden="true" />
                  <span className="font-display font-bold text-sm" style={{ color: "#E8215D" }}>
                    {r.number}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onEnter}
        className="w-full py-4 rounded-2xl font-display font-bold text-lg text-white brand-gradient shadow-lg transition-all hover:scale-[1.02] active:scale-95"
        aria-label="Enter M-TETO app"
      >
        Enter M-TETO! 🚀
      </button>
    </div>
  );
}
