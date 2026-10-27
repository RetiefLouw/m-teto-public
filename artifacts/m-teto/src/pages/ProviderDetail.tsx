import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { trackEvent } from "@/lib/trackEvent";
import { MobileLayout } from "@/components/layout/MobileLayout";
import {
  useGetProvider,
  useListProviderReviews,
  useCreateReview,
  useListProviderOfficials,
  getListProviderReviewsQueryKey,
  getGetProviderQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, MapPin, Phone, Star, ShieldAlert, User, Mail,
  Globe, Clock, BadgeCheck, Shield, ChevronRight, Users,
  AlertTriangle, Award, CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { OfficialCard, sortOfficialsByRole } from "@/components/Officials/OfficialCard";
import { ReviewFlow } from "@/components/ReviewFlow/ReviewFlow";
import type { Official } from "@workspace/api-client-react";

const TYPE_LABELS: Record<string, string> = {
  police_station: "Police Station",
  court: "Court",
  hospital: "Hospital",
  clinic: "Clinic",
  doctor_office: "Doctor's Office",
  thuthuzela_care_centre: "Thuthuzela Care Centre",
  shelter: "Shelter",
  social_worker: "Social Worker",
  legal_aid: "Legal Aid South Africa",
  pro_bono_legal: "Pro-Bono Lawyers",
  legal_clinic: "University Law Clinic",
  counsellor: "Counsellor",
  srhr_practitioner: "SRHR Practitioner",
  ngo: "NGO / NPO",
  cso: "Civil Society Organisation",
  crisis_centre: "Crisis Centre",
};

const ROLE_ORDER: Record<string, number> = {
  director: 0,
  manager: 1,
  supervisor: 2,
  frontline: 3,
};

export default function ProviderDetail() {
  const [, params] = useRoute("/directory/:id");
  const id = params?.id || "";
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [showUberReview, setShowUberReview] = useState(false);
  const [score, setScore] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [officialName, setOfficialName] = useState("");
  const [selectedTab, setSelectedTab] = useState<"info" | "team" | "reviews">("info");
  const [selectedReviewOfficial, setSelectedReviewOfficial] = useState<Official | null>(null);

  const { data: providerData, isLoading: providerLoading } = useGetProvider(id);
  const { data: officialsData } = useListProviderOfficials(id);
  const { data: reviewsData, isLoading: reviewsLoading } = useListProviderReviews(id);

  const createReviewMutation = useCreateReview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProviderReviewsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetProviderQueryKey(id) });
        setIsReviewModalOpen(false);
        setScore(5);
        setReviewText("");
        setOfficialName("");
        toast({ title: "Review Submitted", description: "Thank you for helping the community." });
      },
      onError: (error: any) => {
        toast({
          title: "Failed to submit",
          description: error?.error || "An error occurred.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    createReviewMutation.mutate({ id, data: { score, reviewText, officialName } });
  };

  const provider = providerData?.provider;

  useEffect(() => {
    if (provider) {
      trackEvent("provider_view", {
        providerId: id,
        providerName: provider.name,
        providerType: provider.type,
        province: provider.province,
      });
    }
  }, [provider?.id]);
  const allOfficials = officialsData?.officials ?? [];
  const sortedOfficials = sortOfficialsByRole(allOfficials);
  const onDutyOfficials = sortedOfficials.filter((o) => o.isOnDuty);
  const offDutyOfficials = sortedOfficials.filter((o) => !o.isOnDuty);

  if (providerLoading) {
    return (
      <MobileLayout>
        <div className="p-8 text-center animate-pulse">Loading...</div>
      </MobileLayout>
    );
  }

  if (!provider) {
    return (
      <MobileLayout>
        <div className="p-8 text-center text-destructive font-bold">Provider not found.</div>
      </MobileLayout>
    );
  }

  const needsImprovement = provider.averageRating && provider.averageRating < 7;
  const typeLabel = TYPE_LABELS[provider.type] ?? provider.type.replace(/_/g, " ");

  // Build escalation chain from officials (director→manager→supervisor→frontline)
  const escalationChain = ["director", "manager", "supervisor", "frontline"]
    .map((role) => ({
      role,
      officials: sortedOfficials.filter((o) => o.role === role),
    }))
    .filter((tier) => tier.officials.length > 0);

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* ── HERO ── */}
        <div className={`relative px-4 pt-4 pb-14 ${needsImprovement ? "bg-destructive/5" : "bg-primary/5"}`}>
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div
              className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 ${needsImprovement ? "bg-destructive" : "bg-primary"}`}
            />
          </div>

          <Link href="/directory" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-foreground mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Directory
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Badge
                variant="outline"
                className="bg-card text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border-border mb-3 shadow-sm"
              >
                {typeLabel}
              </Badge>
              <h1 className="text-2xl font-display font-bold leading-tight mb-2">{provider.name}</h1>
              <p className="text-sm text-muted-foreground">
                {provider.suburb}
                {provider.municipality ? `, ${provider.municipality}` : ""}, {provider.area ?? provider.province}
              </p>
            </div>
            <div className="flex flex-col items-center bg-card shadow-lg rounded-2xl p-3 min-w-[64px] border border-border/50 shrink-0">
              <Star
                className={`w-7 h-7 mb-0.5 ${provider.averageRating && provider.averageRating >= 7 ? "text-secondary fill-secondary" : "text-muted-foreground fill-muted-foreground/20"}`}
              />
              <span className="font-display font-bold text-xl leading-none">
                {provider.averageRating ? provider.averageRating.toFixed(1) : "—"}
              </span>
              <span className="text-[9px] text-muted-foreground font-medium mt-0.5">
                {provider.reviewCount > 0 ? `${provider.reviewCount} reviews` : "No reviews"}
              </span>
            </div>
          </div>

          {needsImprovement && (
            <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">
                This facility has a low community rating. Consider alternative options where possible.
              </p>
            </div>
          )}

          {/* On-duty indicator pill */}
          {onDutyOfficials.length > 0 && (
            <div
              className="mt-3 inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-700 rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer"
              onClick={() => setSelectedTab("team")}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {onDutyOfficials.length} on duty now
              <ChevronRight className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* ── TAB BAR ── */}
        <div className="sticky top-0 z-20 bg-card border-b border-border/50 shadow-sm -mt-6 rounded-t-3xl pt-3">
          <div className="flex">
            {(["info", "team", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                  selectedTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "info" && "Info"}
                {tab === "team" && `Team${allOfficials.length > 0 ? ` (${allOfficials.length})` : ""}`}
                {tab === "reviews" && `Reviews`}
                {selectedTab === tab && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 mt-5 space-y-5">
          {/* ── TAB: INFO ── */}
          {selectedTab === "info" && (
            <>
              <Card className="rounded-3xl shadow-lg border-border/50">
                <CardContent className="p-5 space-y-4">
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Address</p>
                      <p className="text-sm font-semibold text-foreground">{provider.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {provider.suburb}
                        {provider.municipality ? `, ${provider.municipality}` : ""}, {provider.province}
                      </p>
                    </div>
                  </div>

                  <div className="h-px w-full bg-border/40" />

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Phone</p>
                      <a
                        href={`tel:${provider.contactNumber.replace(/\s/g, "")}`}
                        className="text-lg font-display font-bold text-primary hover:underline"
                      >
                        {provider.contactNumber}
                      </a>
                    </div>
                  </div>

                  {provider.operatingHours && (
                    <>
                      <div className="h-px w-full bg-border/40" />
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Hours</p>
                          <p className="text-sm font-medium text-foreground">{provider.operatingHours}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {provider.email && (
                    <>
                      <div className="h-px w-full bg-border/40" />
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Email</p>
                          <a href={`mailto:${provider.email}`} className="text-sm font-semibold text-primary hover:underline">
                            {provider.email}
                          </a>
                        </div>
                      </div>
                    </>
                  )}

                  {provider.website && (
                    <>
                      <div className="h-px w-full bg-border/40" />
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Website</p>
                          <a
                            href={provider.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-primary hover:underline break-all"
                          >
                            {provider.website}
                          </a>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Accountability CTA */}
              {allOfficials.length > 0 && (
                <Card
                  className="rounded-3xl border-primary/20 bg-primary/5 cursor-pointer shadow-sm"
                  onClick={() => setSelectedTab("team")}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-base text-foreground">Know your helpers</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        See who's on duty, verify their badge number, and rate your experience
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ── TAB: TEAM ── */}
          {selectedTab === "team" && (
            <>
              {/* On Duty NOW section */}
              {onDutyOfficials.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <h3 className="font-bold text-base font-display">On Duty Right Now</h3>
                    <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 border font-bold">
                      {onDutyOfficials.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {onDutyOfficials.map((official) => (
                      <OfficialCard
                        key={official.id}
                        official={official}
                        onReview={(o) => {
                          setSelectedReviewOfficial(o);
                          setShowUberReview(true);
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Rate this visit CTA */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowUberReview(true)}
                  className="flex-1 rounded-xl font-bold py-5 bg-primary shadow-md"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Rate This Visit
                </Button>
                {isAuthenticated && (
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="rounded-xl font-bold py-5"
                  >
                    Quick Review
                  </Button>
                )}
              </div>

              {/* Escalation Chain */}
              {escalationChain.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <BadgeCheck className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-base font-display">Escalation Chain</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    If you don't get help from frontline staff, contact the next level up
                  </p>
                  <div className="space-y-4">
                    {escalationChain.map((tier, tierIdx) => (
                      <div key={tier.role} className="relative">
                        {/* Vertical connector line */}
                        {tierIdx < escalationChain.length - 1 && (
                          <div className="absolute left-5 top-full h-4 w-0.5 bg-border/60 z-10" />
                        )}
                        <div className="mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">
                            {tier.role === "director" ? "Level 4 — Director" :
                             tier.role === "manager" ? "Level 3 — Manager" :
                             tier.role === "supervisor" ? "Level 2 — Supervisor" :
                             "Level 1 — Frontline Staff"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {tier.officials.map((official) => (
                            <OfficialCard
                              key={official.id}
                              official={official}
                              compact
                              onReview={(o) => {
                                setSelectedReviewOfficial(o);
                                setShowUberReview(true);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Off-duty if no one on duty */}
              {onDutyOfficials.length === 0 && offDutyOfficials.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-bold text-base font-display text-muted-foreground">All Staff (Currently Off Duty)</h3>
                  </div>
                  <div className="space-y-2">
                    {offDutyOfficials.map((official) => (
                      <OfficialCard key={official.id} official={official} compact />
                    ))}
                  </div>
                </section>
              )}

              {allOfficials.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No staff information available yet.</p>
                </div>
              )}
            </>
          )}

          {/* ── TAB: REVIEWS ── */}
          {selectedTab === "reviews" && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl font-display">Community Reviews</h3>
                <span className="text-sm text-muted-foreground font-bold">{provider.reviewCount} total</span>
              </div>

              {isAuthenticated ? (
                <Button
                  onClick={() => setShowUberReview(true)}
                  className="w-full mb-5 py-5 rounded-2xl font-bold bg-primary shadow-md"
                >
                  <Star className="w-4 h-4 mr-2" /> Rate Your Experience
                </Button>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-4 mb-5 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Log in to leave a review and help the community.</p>
                  <Button variant="outline" onClick={login} className="rounded-xl w-full font-bold">
                    Log In to Review
                  </Button>
                </div>
              )}

              {reviewsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-32 bg-card rounded-2xl border border-border" />
                  ))}
                </div>
              ) : reviewsData?.reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No reviews yet. Be the first to share your experience.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsData?.reviews.map((review) => (
                    <Card key={review.id} className="rounded-2xl border-border/50 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-muted p-1.5 rounded-full">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground">Anonymous</p>
                              <p className="text-[10px] text-muted-foreground/70">
                                {formatDistanceToNow(new Date(review.createdAt!))} ago
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-lg">
                            <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                            <span className="text-sm font-bold text-secondary-foreground">{review.score}/10</span>
                          </div>
                        </div>
                        {review.officialName && (
                          <div className="mb-2 inline-flex text-xs bg-primary/5 text-primary border border-primary/10 px-2 py-1 rounded-md font-medium">
                            Official: {review.officialName}
                          </div>
                        )}
                        {review.reviewText && (
                          <p className="text-sm text-foreground/90 leading-relaxed mt-2">"{review.reviewText}"</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* ── UBER REVIEW FLOW ── */}
      {showUberReview && (
        <ReviewFlow
          officials={allOfficials}
          providerId={id}
          onClose={() => {
            setShowUberReview(false);
            setSelectedReviewOfficial(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: getListProviderOfficialsQueryKey(id) });
          }}
        />
      )}

      {/* ── LEGACY QUICK REVIEW DIALOG ── */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-[400px] w-[95vw] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Quick Review</DialogTitle>
            <DialogDescription>Your feedback is anonymous and helps others.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-bold">Overall Rating</Label>
                <span className="text-2xl font-display font-bold text-primary">{score}/10</span>
              </div>
              <Slider
                value={[score]}
                onValueChange={(val) => setScore(val[0])}
                max={10}
                min={1}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Very Poor (1)</span>
                <span>Excellent (10)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="official">Name of Official (Optional)</Label>
              <Input
                id="official"
                placeholder="e.g. Officer Smith"
                value={officialName}
                onChange={(e) => setOfficialName(e.target.value)}
                className="rounded-xl bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review">Your Review (Optional)</Label>
              <Textarea
                id="review"
                placeholder="Share details about how you were treated..."
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="rounded-xl bg-muted/50 resize-none"
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={createReviewMutation.isPending}
                className="w-full rounded-xl py-6 font-bold text-base bg-primary shadow-lg shadow-primary/20"
              >
                {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
