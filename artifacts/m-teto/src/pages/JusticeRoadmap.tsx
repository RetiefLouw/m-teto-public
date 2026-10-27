import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { trackEvent } from "@/lib/trackEvent";
import { getSessionId } from "@/lib/trackEvent";
import {
  VIOLATION_GROUPS,
  getViolationType,
  getStepsForPathway,
  getDeadlineStatus,
  PATHWAY_LABELS,
  type JusticePathway,
  type ViolationContextGroup,
  type ViolationType,
  type JusticeStep,
} from "@/lib/justiceContent";
import {
  Scale, ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock,
  AlertTriangle, FileText, Phone, ExternalLink, ChevronDown,
  ChevronUp, Shield, BookOpen, Gavel, Globe, MapPin, X, Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

type WizardStep = "context" | "type" | "rights" | "pathway" | "roadmap";

const URGENCY_COLORS = {
  emergency: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", dot: "bg-red-500" },
  urgent: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", dot: "bg-amber-500" },
  standard: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", dot: "bg-blue-500" },
};

const FLAG_COLORS = {
  overdue: "text-red-600 bg-red-50 border-red-200",
  due_soon: "text-amber-600 bg-amber-50 border-amber-200",
  on_track: "text-green-600 bg-green-50 border-green-200",
  no_deadline: "text-slate-500 bg-slate-50 border-slate-200",
};

const STEP_STATUS_COLORS = {
  completed: "bg-green-500 text-white",
  current: "bg-primary text-white ring-4 ring-primary/20",
  upcoming: "bg-slate-200 text-slate-400",
};

function gradeLabel(g: string): string {
  const m: Record<string, string> = {
    grade_1_2: "Gr 1–2",
    grade_3_5: "Gr 3–5",
    grade_6_7: "Gr 6–7",
    grade_8_12: "Gr 8–12",
  };
  return m[g] || "All";
}

// Save/load journey progress to localStorage
function saveJourneyProgress(data: JourneyProgress) {
  localStorage.setItem("mteto_justice_journey", JSON.stringify(data));
}

function loadJourneyProgress(): JourneyProgress | null {
  try {
    const raw = localStorage.getItem("mteto_justice_journey");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface JourneyProgress {
  violationContext: string;
  violationTypeId: string;
  pathway: JusticePathway;
  currentStepId: string;
  completedStepIds: string[];
  stepNotes: Record<string, string>;
  startedAt: string;
  journeyId?: string;
}

export default function JusticeRoadmap() {
  const gradeLevel = localStorage.getItem("mteto_grade") || "grade_6_7";
  const [, navigate] = useLocation();

  const [wizardStep, setWizardStep] = useState<WizardStep>("context");
  const [selectedContext, setSelectedContext] = useState<ViolationContextGroup | null>(null);
  const [selectedType, setSelectedType] = useState<ViolationType | null>(null);
  const [selectedPathway, setSelectedPathway] = useState<JusticePathway>("criminal");
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [hasSavedJourney, setHasSavedJourney] = useState(false);

  useEffect(() => {
    const saved = loadJourneyProgress();
    if (saved) setHasSavedJourney(true);
    trackEvent("justice_roadmap_opened", { gradeLevel });
  }, []);

  const resumeJourney = useCallback(() => {
    const saved = loadJourneyProgress();
    if (!saved) return;
    const type = getViolationType(saved.violationTypeId);
    const group = VIOLATION_GROUPS.find((g) => g.id === saved.violationContext);
    if (!type || !group) return;
    setSelectedContext(group);
    setSelectedType(type);
    setSelectedPathway(saved.pathway);
    setCompletedStepIds(saved.completedStepIds);
    setCurrentStepId(saved.currentStepId);
    setWizardStep("roadmap");
    setHasSavedJourney(false);
  }, []);

  const startFresh = () => {
    localStorage.removeItem("mteto_justice_journey");
    setWizardStep("context");
    setSelectedContext(null);
    setSelectedType(null);
    setCompletedStepIds([]);
    setCurrentStepId(null);
    setHasSavedJourney(false);
  };

  const handleSelectContext = (group: ViolationContextGroup) => {
    setSelectedContext(group);
    setSelectedType(null);
    setWizardStep("type");
    trackEvent("justice_context_selected", { context: group.id });
  };

  const handleSelectType = (type: ViolationType) => {
    setSelectedType(type);
    setWizardStep("rights");
    trackEvent("justice_type_selected", { violationType: type.id });
  };

  const handleSelectPathway = (p: JusticePathway) => {
    setSelectedPathway(p);
    const steps = getStepsForPathway(selectedType!, p);
    if (steps.length > 0) {
      setCurrentStepId(steps[0].id);
    }
    setWizardStep("roadmap");
    trackEvent("justice_pathway_selected", {
      violationType: selectedType?.id,
      pathway: p,
    });
    // Save journey to localStorage
    const progress: JourneyProgress = {
      violationContext: selectedContext!.id,
      violationTypeId: selectedType!.id,
      pathway: p,
      currentStepId: steps[0]?.id ?? "",
      completedStepIds: [],
      stepNotes: {},
      startedAt: new Date().toISOString(),
    };
    saveJourneyProgress(progress);
    // Save to backend
    fetch("/api/justice/journeys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        violationContext: selectedContext!.id,
        violationTypeId: selectedType!.id,
        pathway: p,
        gradeLevel,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.journey?.id) {
          const saved = loadJourneyProgress();
          if (saved) saveJourneyProgress({ ...saved, journeyId: data.journey.id });
        }
      })
      .catch(() => {});
  };

  const markStepComplete = (stepId: string) => {
    const steps = getStepsForPathway(selectedType!, selectedPathway);
    const idx = steps.findIndex((s) => s.id === stepId);
    const newCompleted = [...completedStepIds.filter((id) => id !== stepId), stepId];
    const nextStep = steps[idx + 1];
    const newCurrentStep = nextStep?.id ?? stepId;
    setCompletedStepIds(newCompleted);
    setCurrentStepId(newCurrentStep);
    setExpandedStepId(nextStep?.id ?? null);
    const saved = loadJourneyProgress();
    if (saved) {
      const updated: JourneyProgress = {
        ...saved,
        completedStepIds: newCompleted,
        currentStepId: newCurrentStep,
      };
      saveJourneyProgress(updated);
      if (saved.journeyId) {
        fetch(`/api/justice/journeys/${saved.journeyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedStepIds: newCompleted, currentStepId: newCurrentStep }),
        }).catch(() => {});
        fetch(`/api/justice/journeys/${saved.journeyId}/steps/${stepId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed", completedAt: new Date().toISOString() }),
        }).catch(() => {});
      }
    }
    trackEvent("justice_step_completed", { stepId, violationType: selectedType?.id });
  };

  const steps = selectedType ? getStepsForPathway(selectedType, selectedPathway) : [];
  const completedCount = completedStepIds.length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <MobileLayout title="Justice Roadmap">
      <div className="px-4 pt-4 pb-8">
        <AnimatePresence mode="wait">
          {/* Saved Journey Banner */}
          {hasSavedJourney && wizardStep === "context" && (
            <motion.div
              key="saved-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-3xl p-4 border-2 border-primary/30"
              style={{ background: "linear-gradient(135deg, #fff0f4 0%, #fff8f0 100%)" }}
            >
              <p className="text-sm font-bold brand-gradient-text mb-1">You have a saved journey</p>
              <p className="text-xs text-muted-foreground mb-3">Would you like to continue where you left off?</p>
              <div className="flex gap-2">
                <button
                  onClick={resumeJourney}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white brand-gradient"
                >
                  Continue Journey
                </button>
                <button
                  onClick={startFresh}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-bold border border-border text-muted-foreground"
                >
                  Start New
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Context Selector */}
          {wizardStep === "context" && (
            <motion.div
              key="context"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto rounded-3xl brand-gradient flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
                  <Scale className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-xl font-display font-bold brand-gradient-text">Accessing Justice</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {gradeLevel === "grade_1_2"
                    ? "Tell me — where did this happen?"
                    : gradeLevel === "grade_3_5"
                    ? "Where did this happen to you?"
                    : "I'll help you understand your rights and how to seek justice."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {VIOLATION_GROUPS.map((group, i) => (
                  <motion.button
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => handleSelectContext(group)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border-2 border-border/60 bg-white hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95 text-center shadow-sm"
                  >
                    <span className="text-3xl">{group.emoji}</span>
                    <span className="text-xs font-bold text-foreground leading-tight">{group.label}</span>
                  </motion.button>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-3xl bg-muted/40 text-center">
                <p className="text-xs text-muted-foreground">
                  This tool helps you understand your rights and the steps to seek justice.
                  {" "}
                  <strong>All information is private</strong> — no personal data is shared.
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Violation Type */}
          {wizardStep === "type" && selectedContext && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => setWizardStep("context")} className="w-9 h-9 rounded-2xl border-2 border-border flex items-center justify-center hover:bg-muted/40 transition-all">
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <div>
                  <p className="text-xs text-muted-foreground">{selectedContext.emoji} {selectedContext.label}</p>
                  <h2 className="text-base font-display font-bold brand-gradient-text">What happened?</h2>
                </div>
              </div>

              <div className="space-y-2.5">
                {selectedContext.types
                  .filter((t) => t.ageGroups.includes(gradeLevel as any) || gradeLevel === "all")
                  .map((type, i) => (
                    <motion.button
                      key={type.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      onClick={() => handleSelectType(type)}
                      className={`w-full text-left p-4 rounded-3xl border-2 transition-all active:scale-[0.98] ${
                        URGENCY_COLORS[type.urgency].bg
                      } ${URGENCY_COLORS[type.urgency].border}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{type.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground">{type.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {type.shortDescription[(gradeLevel as keyof typeof type.shortDescription)] || type.shortDescription.grade_6_7}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className={`w-2.5 h-2.5 rounded-full ${URGENCY_COLORS[type.urgency].dot}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wide ${URGENCY_COLORS[type.urgency].text}`}>
                            {type.urgency}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
              </div>

              {selectedContext.types.filter(t => t.ageGroups.includes(gradeLevel as any)).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No specific violations listed for your grade level.</p>
                  <button onClick={() => setWizardStep("context")} className="mt-3 text-xs text-primary font-bold">← Choose a different category</button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: Rights Explained */}
          {wizardStep === "rights" && selectedType && (
            <motion.div
              key="rights"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => setWizardStep("type")} className="w-9 h-9 rounded-2xl border-2 border-border flex items-center justify-center hover:bg-muted/40 transition-all">
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <div>
                  <p className="text-xs text-muted-foreground">{selectedType.emoji} {selectedType.label}</p>
                  <h2 className="text-base font-display font-bold brand-gradient-text">Your Rights</h2>
                </div>
              </div>

              {/* What happened explanation */}
              <div className="rounded-3xl p-4 border-2 border-primary/20" style={{ background: "linear-gradient(135deg, #fff0f4, #fff8f0)" }}>
                <p className="text-sm font-semibold text-foreground leading-relaxed">
                  {selectedType.shortDescription[(gradeLevel as keyof typeof selectedType.shortDescription)] || selectedType.shortDescription.grade_6_7}
                </p>
              </div>

              {/* Rights violated */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Your Rights That Were Violated</p>
                <div className="space-y-2">
                  {selectedType.rightsViolated.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="w-6 h-6 rounded-xl brand-gradient flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{r.right}</p>
                        <p className="text-[10px] text-muted-foreground">{r.legalBasis}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pathway selector */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Choose Your Justice Pathway</p>
                <div className="space-y-2">
                  {(selectedType.pathway === "criminal" || selectedType.pathway === "both") && (
                    <button
                      onClick={() => handleSelectPathway("criminal")}
                      className="w-full text-left p-4 rounded-3xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <Gavel className="w-5 h-5 text-red-600" />
                        <div className="flex-1">
                          <p className="font-bold text-sm text-red-800">Criminal Justice Pathway</p>
                          <p className="text-xs text-red-600 mt-0.5">
                            {gradeLevel === "grade_1_2"
                              ? "Police arrest the person who hurt you and they go to court"
                              : gradeLevel === "grade_3_5"
                              ? "Report to police, investigation, and court trial"
                              : "Police investigation → NPA prosecution → Criminal trial → Sentencing"}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-red-600" />
                      </div>
                    </button>
                  )}
                  {(selectedType.pathway === "civil" || selectedType.pathway === "both") && (
                    <button
                      onClick={() => handleSelectPathway("civil")}
                      className="w-full text-left p-4 rounded-3xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <Scale className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-bold text-sm text-blue-800">Civil Justice Pathway</p>
                          <p className="text-xs text-blue-600 mt-0.5">
                            {gradeLevel === "grade_1_2"
                              ? "Organisations and courts help fix the situation"
                              : gradeLevel === "grade_3_5"
                              ? "File a complaint, mediation, hearing at relevant body"
                              : "SAHRC / Children's Court / Equality Court → Mediation → Judgment → Enforcement"}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                      </div>
                    </button>
                  )}
                  {selectedType.pathway === "both" && (
                    <button
                      onClick={() => handleSelectPathway("both")}
                      className="w-full text-left p-4 rounded-3xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                        <div className="flex-1">
                          <p className="font-bold text-sm text-purple-800">Both Pathways</p>
                          <p className="text-xs text-purple-600 mt-0.5">Show all steps — criminal and civil together</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-600" />
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* E-Policing */}
              {selectedType.ePolicing && (
                <div className="rounded-3xl p-4 border-2 border-teal-200 bg-teal-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-teal-600" />
                    <p className="text-xs font-bold text-teal-700">🖥️ E-Policing: Report Online</p>
                  </div>
                  <p className="text-xs text-teal-600 mb-2">{selectedType.ePolicing.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedType.ePolicing.links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-white rounded-xl px-3 py-1.5 border border-teal-200 hover:bg-teal-100 transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: Interactive Roadmap */}
          {wizardStep === "roadmap" && selectedType && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <button onClick={() => setWizardStep("rights")} className="w-9 h-9 rounded-2xl border-2 border-border flex items-center justify-center hover:bg-muted/40 transition-all">
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{selectedType.emoji} {selectedType.label}</p>
                  <h2 className="text-base font-display font-bold brand-gradient-text truncate">{PATHWAY_LABELS[selectedPathway]}</h2>
                </div>
                <Badge className="text-[10px] font-bold rounded-full shrink-0" variant="outline">
                  {gradeLabel(gradeLevel)}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{completedCount} of {steps.length} steps</span>
                  <span>{progress}% complete</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full brand-gradient rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const isCompleted = completedStepIds.includes(step.id);
                  const isCurrent = currentStepId === step.id;
                  const isExpanded = expandedStepId === step.id;
                  const deadlineStatus = getDeadlineStatus(step, new Date());
                  const isLocked = !isCompleted && !isCurrent && idx > 0 && !completedStepIds.includes(steps[idx - 1]?.id ?? "");

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <div
                        className={`rounded-3xl border-2 overflow-hidden transition-all ${
                          isCompleted
                            ? "border-green-200 bg-green-50/50"
                            : isCurrent
                            ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10"
                            : "border-border/60 bg-white"
                        }`}
                      >
                        {/* Step header — always visible */}
                        <button
                          onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                          className="w-full flex items-center gap-3 p-4"
                        >
                          <div
                            className={`w-8 h-8 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                              isCompleted
                                ? "bg-green-500 text-white"
                                : isCurrent
                                ? "bg-primary text-white ring-2 ring-primary/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>

                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-sm font-bold truncate ${isCompleted ? "text-green-700" : isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground truncate">{step.timeline}</span>
                              {step.isDeadlineCritical && (
                                <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5">CRITICAL</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {deadlineStatus !== "no_deadline" && (
                              <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${FLAG_COLORS[deadlineStatus]}`}>
                                {deadlineStatus === "overdue" ? "⚠ OVERDUE" : deadlineStatus === "due_soon" ? "⏰ DUE SOON" : "✓ ON TRACK"}
                              </div>
                            )}
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </button>

                        {/* Expanded step detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-3">
                                {/* Age-appropriate description */}
                                <p className="text-sm text-foreground leading-relaxed">
                                  {step.description[(gradeLevel as keyof typeof step.description)] || step.description.grade_6_7}
                                </p>

                                {/* Actions */}
                                {step.actions.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">What to do</p>
                                    <div className="space-y-1.5">
                                      {step.actions.map((action, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                          <div className="w-4 h-4 rounded-full brand-gradient flex items-center justify-center mt-0.5 shrink-0">
                                            <span className="text-[8px] font-bold text-white">{i + 1}</span>
                                          </div>
                                          <p className="text-xs text-foreground">{action}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Documents */}
                                {step.documents.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">📋 Documents Needed</p>
                                    <div className="space-y-1">
                                      {step.documents.map((doc, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                                          <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                                          {doc}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Contacts */}
                                {step.contacts.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">📞 Who to Contact</p>
                                    <div className="space-y-2">
                                      {step.contacts.map((contact, i) => (
                                        <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl bg-muted/30 border border-border/50">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">{contact.name}</p>
                                            {contact.note && <p className="text-[10px] text-muted-foreground">{contact.note}</p>}
                                          </div>
                                          <div className="flex gap-1.5 shrink-0 ml-2">
                                            {contact.number && (
                                              <a
                                                href={`tel:${contact.number.replace(/\s/g, "")}`}
                                                className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 rounded-xl px-2 py-1"
                                              >
                                                <Phone className="w-3 h-3" />
                                                {contact.number}
                                              </a>
                                            )}
                                            {contact.website && (
                                              <a
                                                href={contact.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 rounded-xl px-2 py-1"
                                              >
                                                <Globe className="w-3 h-3" />
                                                Web
                                              </a>
                                            )}
                                            {contact.isFree && (
                                              <span className="text-[9px] font-bold text-green-700 bg-green-50 rounded-xl px-1.5 py-1">FREE</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* E-Policing Options */}
                                {step.ePolicingOptions && step.ePolicingOptions.length > 0 && (
                                  <div className="rounded-2xl p-3 bg-teal-50 border border-teal-200">
                                    <p className="text-xs font-bold text-teal-700 mb-1.5">🖥️ Report Online (E-Policing)</p>
                                    <div className="space-y-1">
                                      {step.ePolicingOptions.map((opt, i) => {
                                        const urlMatch = opt.match(/https?:\/\/\S+/);
                                        const label = opt.replace(/https?:\/\/\S+/, "").trim().replace(/:\s*$/, "");
                                        const url = urlMatch?.[0];
                                        return (
                                          <div key={i} className="flex items-center justify-between">
                                            <p className="text-xs text-teal-700 flex-1">{label || opt}</p>
                                            {url && (
                                              <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-white rounded-lg px-2 py-1 border border-teal-200 ml-2 shrink-0">
                                                <ExternalLink className="w-3 h-3" />
                                                Open
                                              </a>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Tips */}
                                {step.tips.length > 0 && (
                                  <div className="rounded-2xl p-3 bg-amber-50 border border-amber-200">
                                    <p className="text-xs font-bold text-amber-700 mb-1.5">💡 Tips</p>
                                    {step.tips.map((tip, i) => (
                                      <p key={i} className="text-xs text-amber-700">• {tip}</p>
                                    ))}
                                  </div>
                                )}

                                {/* Warning flags */}
                                {step.warningFlags.length > 0 && (
                                  <div className="rounded-2xl p-3 bg-red-50 border border-red-200">
                                    <p className="text-xs font-bold text-red-700 mb-1.5">⚠️ Important Warnings</p>
                                    {step.warningFlags.map((flag, i) => (
                                      <p key={i} className="text-xs text-red-700">• {flag}</p>
                                    ))}
                                  </div>
                                )}

                                {/* Legal basis */}
                                {step.legalBasis && (
                                  <p className="text-[10px] text-muted-foreground italic">Legal basis: {step.legalBasis}</p>
                                )}

                                {/* Mark complete / in progress button */}
                                {!isCompleted && (isCurrent || isCompleted) && (
                                  <button
                                    onClick={() => markStepComplete(step.id)}
                                    className="w-full py-3 rounded-2xl text-sm font-bold text-white brand-gradient shadow-sm"
                                  >
                                    ✓ Mark This Step as Done
                                  </button>
                                )}
                                {!isCompleted && !isCurrent && idx === 0 && (
                                  <button
                                    onClick={() => markStepComplete(step.id)}
                                    className="w-full py-3 rounded-2xl text-sm font-bold text-white brand-gradient shadow-sm"
                                  >
                                    ✓ Mark This Step as Done
                                  </button>
                                )}
                                {isCompleted && (
                                  <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Step completed
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Completion message */}
              {completedCount === steps.length && steps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl p-5 text-center brand-gradient text-white shadow-lg"
                >
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="font-display font-bold text-lg">Journey Complete!</p>
                  <p className="text-sm opacity-90 mt-1">You have been through every step of the justice process. You are strong and brave.</p>
                </motion.div>
              )}

              {/* Link to Case Tracker */}
              <div className="rounded-3xl p-4 border border-border/60 bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground mb-2">Track your case progress alongside this roadmap</p>
                <button
                  onClick={() => navigate("/tracker")}
                  className="text-xs font-bold text-primary"
                >
                  🛡 Open Case Tracker →
                </button>
              </div>

              {/* Start over button */}
              <button
                onClick={startFresh}
                className="w-full py-3 rounded-2xl text-sm font-bold border-2 border-border text-muted-foreground hover:bg-muted/40 transition-all"
              >
                ← Start a Different Journey
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
