/**
 * DemoCases.tsx — Public browse of 100 seed demo cases (no auth)
 * Shows Uber-style case tracking in action using seeded data
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { MobileLayout } from "@/components/layout/MobileLayout";
import {
  Search, AlertTriangle, CheckCircle2, Clock, XCircle, Flame,
  Filter, ArrowLeft, ArrowRight, Loader2, MapPin, Calendar,
  Flag, Shield, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const INCIDENT_LABELS: Record<string, string> = {
  sexual_assault: "Sexual Assault",
  rape: "Rape",
  intimate_partner_violence: "Intimate Partner Violence",
  domestic_violence: "Domestic Violence / GBV",
  corporal_punishment: "Corporal Punishment",
  sexual_harassment: "Sexual Harassment",
  teacher_abuse: "Teacher Abuse",
  peer_violence: "Peer Violence",
  cyberbullying: "Cyberbullying",
  stalking: "Stalking",
  grooming: "Grooming",
  trafficking: "Trafficking",
};

const STAGE_LABELS: Record<string, string> = {
  incident: "Incident",
  case_opened: "Case Opened",
  investigation: "Investigation",
  court: "Court",
  sentencing: "Sentencing",
  closed: "Closed",
};

interface DemoCase {
  id: string;
  title: string;
  incident_type: string;
  stage: string;
  cas_number: string;
  io_name: string;
  incident_date: string;
  created_at: string;
  delayed_steps: number;
  failed_steps: number;
  completed_steps: number;
  in_progress_steps: number;
  escalation_count: number;
  unread_messages: number;
  current_actor_name: string | null;
  current_actor_label: string | null;
  current_deadline: string | null;
}

function getFlagLevel(c: DemoCase) {
  if (c.failed_steps > 0) return "critical";
  if (c.delayed_steps > 0) return "delayed";
  if (c.escalation_count > 0) return "escalated";
  return "ok";
}

function FlagBadge({ level }: { level: string }) {
  switch (level) {
    case "critical":
      return <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> FAILED</span>;
    case "delayed":
      return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" /> DELAYED</span>;
    case "escalated":
      return <span className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full"><Flame className="w-3 h-3" /> ESCALATED</span>;
    default:
      return <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> ON TRACK</span>;
  }
}

export default function DemoCases() {
  const [cases, setCases] = useState<DemoCase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 20;

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(search && { search }),
        ...(selectedType && { type: selectedType }),
        ...(selectedStage && { stage: selectedStage }),
        ...(flaggedOnly && { flagged: "true" }),
      });
      const r = await fetch(`${BASE}/api/demo-cases?${params}`);
      if (r.ok) {
        const d = await r.json();
        setCases(d.cases ?? []);
        setTotal(d.total ?? 0);
      }
    } catch {/* ignore */}
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchCases(); }, 300);
    return () => clearTimeout(t);
  }, [search, selectedType, selectedStage, flaggedOnly]);

  useEffect(() => { fetchCases(); }, [page]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <MobileLayout>
      <div className="pb-28">
        {/* Header */}
        <div className="bg-primary px-4 pt-4 pb-6 text-primary-foreground rounded-b-[36px] shadow-lg">
          <Link href="/tracker" className="inline-flex items-center text-sm font-bold text-primary-foreground/80 hover:text-white mb-3">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <h1 className="text-2xl font-display font-bold mb-1">100 Demo Cases</h1>
          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            See how the justice tracker works with real SA case scenarios — assault, rape, IPV, SRGBV and more. Each case shows the full justice value chain.
          </p>
        </div>

        <div className="px-4 pt-4 space-y-3">
          {/* Search + Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cases..."
                className="pl-9 rounded-2xl"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 bg-muted/30 rounded-2xl p-4 border border-border/60">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Incident Type</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedType("")}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${!selectedType ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/30"}`}
                  >
                    All Types
                  </button>
                  {Object.entries(INCIDENT_LABELS).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setSelectedType(selectedType === k ? "" : k)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${selectedType === k ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/30"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Stage</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedStage("")}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${!selectedStage ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground"}`}
                  >
                    All Stages
                  </button>
                  {Object.entries(STAGE_LABELS).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setSelectedStage(selectedStage === k ? "" : k)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${selectedStage === k ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setFlaggedOnly(!flaggedOnly)}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border transition-all ${flaggedOnly ? "bg-red-100 border-red-300 text-red-700" : "border-border/60 text-muted-foreground"}`}
              >
                <Flag className="w-3 h-3" /> Show Flagged / Delayed Only
              </button>
            </motion.div>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-muted-foreground">
              {loading ? "Loading..." : `${total} cases`}
            </p>
            {total > LIMIT && (
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            )}
          </div>

          {/* Case list */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No cases found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((c, i) => {
                const flag = getFlagLevel(c);
                const progress = Math.round((c.completed_steps / 15) * 100);

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <Link href={`/demo-cases/${c.id}`}>
                      <div className={`bg-card border rounded-3xl shadow-sm p-4 active:scale-[0.98] transition-all cursor-pointer ${
                        flag === "critical" ? "border-red-300 bg-red-50/30" :
                        flag === "delayed" ? "border-amber-300 bg-amber-50/30" :
                        "border-border/60"
                      }`}>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              <FlagBadge level={flag} />
                              <Badge variant="outline" className="text-[10px] font-medium px-2">
                                {STAGE_LABELS[c.stage] ?? c.stage}
                              </Badge>
                            </div>
                            <h3 className="font-bold text-sm text-gray-900 leading-tight">{c.title}</h3>
                            {c.cas_number && (
                              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{c.cas_number}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                            <span>{c.completed_steps} of 15 steps done</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${flag === "critical" ? "bg-red-500" : flag === "delayed" ? "bg-amber-500" : "bg-green-500"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Current actor */}
                        {c.current_actor_label && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            </div>
                            <span className="font-medium">With: <span className="text-gray-800 font-bold">{c.current_actor_label}</span></span>
                          </div>
                        )}

                        {/* Stats row */}
                        <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
                          {c.delayed_steps > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                              <AlertTriangle className="w-3 h-3" /> {c.delayed_steps} delayed
                            </span>
                          )}
                          {c.failed_steps > 0 && (
                            <span className="flex items-center gap-1 text-red-600 font-bold">
                              <XCircle className="w-3 h-3" /> {c.failed_steps} failed
                            </span>
                          )}
                          {c.escalation_count > 0 && (
                            <span className="flex items-center gap-1 text-orange-600 font-bold">
                              <Flame className="w-3 h-3" /> {c.escalation_count} escalated
                            </span>
                          )}
                          {c.incident_date && (
                            <span className="flex items-center gap-1 ml-auto">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(c.incident_date), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          <div className="text-center py-4">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              These are demo cases showing how M-TETO™ tracks real SA justice processes.
              All CAS numbers and names are fictional. © Adv. Thando Gumede ZA
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
