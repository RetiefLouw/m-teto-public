import { useState } from "react";
import { Star, BadgeCheck, Camera, ShieldAlert, ThumbsUp, CheckCircle, X, ChevronRight, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCreateOfficialReview } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import type { Official } from "@workspace/api-client-react";

interface ReviewFlowProps {
  officials: Official[];
  providerId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "pick_official" | "verify_identity" | "rate_stars" | "tags" | "comment" | "conduct_flag" | "submitted";

const POSITIVE_TAGS = [
  "Professional",
  "Helpful",
  "Listened to me",
  "Explained everything",
  "Respectful",
  "Safe space",
];

const NEGATIVE_TAGS = [
  "Unhelpful",
  "Rude attitude",
  "Ignored me",
  "Dismissive",
  "Didn't explain",
  "Long wait",
];

const CONDUCT_FLAGS = [
  { id: "none", label: "No issues", icon: <CheckCircle className="w-4 h-4" />, color: "text-green-600 bg-green-50 border-green-200" },
  { id: "unprofessional", label: "Unprofessional", icon: <AlertTriangle className="w-4 h-4" />, color: "text-orange-600 bg-orange-50 border-orange-200" },
  { id: "refused_help", label: "Refused to help me", icon: <X className="w-4 h-4" />, color: "text-red-600 bg-red-50 border-red-200" },
  { id: "hostile", label: "Hostile behaviour", icon: <ShieldAlert className="w-4 h-4" />, color: "text-red-600 bg-red-50 border-red-200" },
  { id: "discriminatory", label: "Discriminatory", icon: <ShieldAlert className="w-4 h-4" />, color: "text-red-700 bg-red-100 border-red-300" },
  { id: "abusive", label: "Abusive / threatening", icon: <ShieldAlert className="w-4 h-4" />, color: "text-red-800 bg-red-200 border-red-400" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={`w-10 h-10 transition-colors ${
              (hover || value) >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const STAR_LABELS: Record<number, string> = {
  1: "Very poor",
  2: "Poor",
  3: "Okay",
  4: "Good",
  5: "Excellent!",
};

export function ReviewFlow({ officials, providerId, onClose, onSuccess }: ReviewFlowProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(officials.length > 0 ? "pick_official" : "rate_stars");
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);
  const [verifiedBadge, setVerifiedBadge] = useState(false);
  const [verifiedPhoto, setVerifiedPhoto] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [conductFlag, setConductFlag] = useState("none");

  const createReviewMutation = useCreateOfficialReview({
    mutation: {
      onSuccess: () => {
        setStep("submitted");
        onSuccess?.();
      },
      onError: () => {
        toast({
          title: "Couldn't submit review",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (!selectedOfficial) return;
    createReviewMutation.mutate({
      id: selectedOfficial.id,
      data: {
        providerId,
        score,
        comment: comment || undefined,
        tags: selectedTags.join(",") || undefined,
        verifiedBadge,
        verifiedPhoto,
        conductFlag: conductFlag === "none" ? undefined : conductFlag,
      },
    });
  };

  const progressSteps: Step[] = ["pick_official", "verify_identity", "rate_stars", "tags", "comment", "conduct_flag"];
  const currentIdx = progressSteps.indexOf(step);
  const progressPct = step === "submitted" ? 100 : Math.round(((currentIdx + 1) / progressSteps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-xl">Rate Your Experience</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">

          {/* STEP: Pick official */}
          {step === "pick_official" && (
            <div className="space-y-4">
              <div>
                <p className="font-bold text-base">Who helped you today?</p>
                <p className="text-sm text-muted-foreground mt-0.5">Select the person who assisted you (optional)</p>
              </div>
              <div className="space-y-2">
                {officials.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { setSelectedOfficial(o); setStep("verify_identity"); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3
                      ${selectedOfficial?.id === o.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0
                      ${o.isOnDuty ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {o.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.title}</p>
                    </div>
                    {o.isOnDuty && (
                      <span className="text-[10px] font-bold text-green-600 shrink-0">On Duty</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
                <button
                  onClick={() => { setSelectedOfficial(null); setStep("rate_stars"); }}
                  className="w-full text-left p-3 rounded-xl border border-dashed border-border hover:border-primary/40 transition-all flex items-center gap-3 text-muted-foreground"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Skip — rate the service in general</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            </div>
          )}

          {/* STEP: Verify identity */}
          {step === "verify_identity" && selectedOfficial && (
            <div className="space-y-5">
              <div>
                <p className="font-bold text-base">Verify {selectedOfficial.name}'s identity</p>
                <p className="text-sm text-muted-foreground mt-0.5">This helps protect you and ensures accountability</p>
              </div>

              {selectedOfficial.badgeNumber && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BadgeCheck className="w-5 h-5 text-primary" />
                    <p className="font-bold text-sm">Their badge number should be</p>
                  </div>
                  <p className="font-display font-black text-4xl text-primary tracking-widest">#{selectedOfficial.badgeNumber}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ask to see their official badge before sharing any personal information</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => setVerifiedBadge(!verifiedBadge)}
                  className={`w-full p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 text-left
                    ${verifiedBadge ? "border-green-500 bg-green-50" : "border-border"}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                    ${verifiedBadge ? "border-green-500 bg-green-500" : "border-muted-foreground"}`}>
                    {verifiedBadge && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">I checked their official badge</p>
                    <p className="text-xs text-muted-foreground">Badge number matched what was expected</p>
                  </div>
                </button>

                <button
                  onClick={() => setVerifiedPhoto(!verifiedPhoto)}
                  className={`w-full p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 text-left
                    ${verifiedPhoto ? "border-green-500 bg-green-50" : "border-border"}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                    ${verifiedPhoto ? "border-green-500 bg-green-500" : "border-muted-foreground"}`}>
                    {verifiedPhoto && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">I saw their photo ID</p>
                    <p className="text-xs text-muted-foreground">Face matched the official's photo on record</p>
                  </div>
                </button>
              </div>

              <Button onClick={() => setStep("rate_stars")} className="w-full rounded-xl font-bold py-5">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* STEP: Star rating */}
          {step === "rate_stars" && (
            <div className="space-y-6">
              <div>
                <p className="font-bold text-base">
                  {selectedOfficial ? `How was ${selectedOfficial.name.split(" ")[0]}?` : "How was the service?"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">Tap a star to rate</p>
              </div>

              <div className="flex flex-col items-center py-4 gap-4">
                <StarRating value={score} onChange={setScore} />
                {score > 0 && (
                  <p className="font-display font-black text-3xl text-primary animate-in fade-in">
                    {STAR_LABELS[score]}
                  </p>
                )}
              </div>

              <Button
                onClick={() => setStep("tags")}
                disabled={score === 0}
                className="w-full rounded-xl font-bold py-5"
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* STEP: Tags */}
          {step === "tags" && (
            <div className="space-y-5">
              <div>
                <p className="font-bold text-base">What describes your experience?</p>
                <p className="text-sm text-muted-foreground mt-0.5">Select all that apply</p>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                  <ThumbsUp className="w-3 h-3 inline-block mr-1 text-green-500" /> Good things
                </p>
                <div className="flex flex-wrap gap-2">
                  {POSITIVE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                        ${selectedTags.includes(tag)
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-card border-border text-foreground hover:border-green-400"}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                  <AlertTriangle className="w-3 h-3 inline-block mr-1 text-orange-500" /> Concerns
                </p>
                <div className="flex flex-wrap gap-2">
                  {NEGATIVE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                        ${selectedTags.includes(tag)
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-card border-border text-foreground hover:border-orange-400"}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep("comment")} className="w-full rounded-xl font-bold py-5">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* STEP: Comment */}
          {step === "comment" && (
            <div className="space-y-5">
              <div>
                <p className="font-bold text-base">Add a comment (optional)</p>
                <p className="text-sm text-muted-foreground mt-0.5">Your review is anonymous and helps others</p>
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share what happened — the more detail, the more helpful..."
                rows={5}
                className="rounded-xl bg-muted/50 border-border resize-none"
              />
              <Button onClick={() => setStep("conduct_flag")} className="w-full rounded-xl font-bold py-5">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* STEP: Conduct flag */}
          {step === "conduct_flag" && (
            <div className="space-y-4">
              <div>
                <p className="font-bold text-base">Report a conduct issue?</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Serious misconduct reports go to the accountability team
                </p>
              </div>
              <div className="space-y-2">
                {CONDUCT_FLAGS.map((flag) => (
                  <button
                    key={flag.id}
                    onClick={() => setConductFlag(flag.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                      ${conductFlag === flag.id
                        ? `border-current ${flag.color}`
                        : "border-border hover:border-muted-foreground/30"}`}
                  >
                    <span className={conductFlag === flag.id ? flag.color.split(" ")[0] : "text-muted-foreground"}>
                      {flag.icon}
                    </span>
                    <span className={`font-bold text-sm ${conductFlag === flag.id ? flag.color.split(" ")[0] : "text-foreground"}`}>
                      {flag.label}
                    </span>
                  </button>
                ))}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createReviewMutation.isPending}
                className="w-full rounded-xl font-bold py-5 bg-primary"
              >
                {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          )}

          {/* STEP: Submitted */}
          {step === "submitted" && (
            <div className="flex flex-col items-center text-center py-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <p className="font-display font-black text-3xl text-green-600">Thank you!</p>
                <p className="text-base font-medium text-muted-foreground mt-1">
                  Your review is anonymous and helps protect children in the community.
                </p>
              </div>
              {conductFlag !== "none" && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-left w-full">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-orange-700">Misconduct Report Filed</p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        This has been escalated to the accountability team for review. You can contact the National Gender-Based Violence Command Centre on <strong>0800 428 428</strong> for urgent support.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <Button onClick={onClose} className="w-full rounded-xl font-bold py-5 mt-4">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
