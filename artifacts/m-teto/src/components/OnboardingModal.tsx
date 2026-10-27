import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdateProfile, useAwardPoints } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Users, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const GRADE_OPTIONS = [
  { id: "grade_1_2", label: "Grades 1–2", subtitle: "Ages 5–8", emoji: "🌱" },
  { id: "grade_3_5", label: "Grades 3–5", subtitle: "Ages 8–12", emoji: "📚" },
  { id: "grade_6_7", label: "Grades 6–7", subtitle: "Ages 12–14", emoji: "🎒" },
  { id: "grade_8_12", label: "Grades 8–12", subtitle: "Ages 14–19", emoji: "🎓" },
  { id: "adult", label: "Adult / Guardian", subtitle: "Over 19", emoji: "👤" },
];

const PROFILE_TYPE_OPTIONS = [
  { id: "youth_victim", label: "I am a student / young person", emoji: "🧑‍🎓", description: "Access age-appropriate content for your grade" },
  { id: "guardian_adult", label: "I am a guardian / educator", emoji: "🏫", description: "Support children with relevant resources" },
];

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [profileType, setProfileType] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate: updateProfile, isPending } = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        onClose();
      }
    }
  });

  const { mutate: awardPoints } = useAwardPoints();

  function handleComplete() {
    if (!profileType) return;
    updateProfile({
      data: {
        profileType,
        gradeLevel: gradeLevel ?? "adult",
        onboardingDone: 1,
      }
    });
    awardPoints({ data: { reason: "onboarding" } });
  }

  const showGradeStep = profileType === "youth_victim";
  const canFinish = profileType !== null && (profileType !== "youth_victim" || gradeLevel !== null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && canFinish && onClose()}>
      <DialogContent className="max-w-[420px] w-[92vw] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="text-xl">👋</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">Welcome to M-Teto</h2>
              <p className="text-white/70 text-sm">Let's personalise your experience</p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex gap-1.5 mt-4">
            {[0, showGradeStep ? 1 : null].filter(Boolean).concat([showGradeStep ? 2 : 1]).map((s, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${step >= i ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">Who are you?</h3>
                  <p className="text-sm text-muted-foreground">This helps us show you the most relevant content</p>
                </div>
                <div className="space-y-3">
                  {PROFILE_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setProfileType(opt.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                        profileType === opt.id
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                          : 'border-border/50 hover:border-primary/40 bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{opt.emoji}</span>
                        <div>
                          <p className="font-bold text-sm text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                        {profileType === opt.id && (
                          <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full rounded-xl py-6 font-bold mt-2"
                  disabled={!profileType}
                  onClick={() => profileType === "youth_victim" ? setStep(1) : handleComplete()}
                >
                  {profileType === "youth_victim" ? (
                    <span className="flex items-center gap-2">Continue <ChevronRight className="w-4 h-4" /></span>
                  ) : isPending ? "Saving..." : (
                    <span className="flex items-center gap-2">Get Started — Earn 20 pts! 🎉</span>
                  )}
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h3 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" /> What grade are you in?
                  </h3>
                  <p className="text-sm text-muted-foreground">We'll show age-appropriate content for your grade level</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {GRADE_OPTIONS.filter(g => g.id !== "adult").map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setGradeLevel(opt.id)}
                      className={`text-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                        gradeLevel === opt.id
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                          : 'border-border/50 hover:border-primary/40 bg-card'
                      }`}
                    >
                      <div className="text-2xl mb-1">{opt.emoji}</div>
                      <p className="font-bold text-sm">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground">{opt.subtitle}</p>
                      {gradeLevel === opt.id && (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto mt-1" />
                      )}
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full rounded-xl py-6 font-bold"
                  disabled={!gradeLevel || isPending}
                  onClick={handleComplete}
                >
                  {isPending ? "Saving..." : "Get Started — Earn 20 pts! 🎉"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
