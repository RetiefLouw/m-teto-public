/**
 * DemoCaseDetail.tsx — Shows a specific demo case with full Uber-style tracking
 * Works without authentication — uses /api/demo-cases/:id and demo=true params
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */
import { useState, useEffect, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, AlertTriangle, ShieldCheck, User, CheckCircle2,
  ChevronDown, ChevronUp, Phone, Flag, AlertOctagon,
  Loader2, FileText, Shield, Info, XCircle, Flame,
  MessageSquare, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SA_JUSTICE_STEPS, ESCALATION_BODIES, type JusticeStep } from "@workspace/justice-timelines";
import { formatDistanceToNow, format, isAfter } from "date-fns";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type StepStatus = "not_started" | "in_progress" | "completed" | "overdue" | "failed" | "escalated" | "skipped";

interface TimelineItem {
  step: JusticeStep;
  event: Record<string, unknown> | null;
  status: StepStatus;
  isDelayed: boolean;
  isFailed: boolean;
  delayHours: number | null;
  delayReason: string | null;
  completedAt: string | null;
  dueAt: string | null;
  actorName: string | null;
  officialNotes: string | null;
}

interface DemoCase {
  id: string;
  title: string;
  incident_type: string;
  stage: string;
  cas_number: string;
  io_name: string;
  incident_date: string;
}

function statusConfig(status: StepStatus) {
  switch (status) {
    case "completed": return { color: "bg-green-500", text: "text-green-700", bg: "bg-green-50", border: "border-green-300", label: "Completed" };
    case "in_progress": return { color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-300", label: "In Progress" };
    case "overdue": return { color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", label: "Overdue" };
    case "failed": return { color: "bg-red-600", text: "text-red-700", bg: "bg-red-50", border: "border-red-300", label: "Failed" };
    case "escalated": return { color: "bg-red-700", text: "text-red-800", bg: "bg-red-100", border: "border-red-400", label: "Escalated" };
    default: return { color: "bg-gray-200", text: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", label: "Pending" };
  }
}

export default function DemoCaseDetail() {
  const [, params] = useRoute("/demo-cases/:id");
  const id = params?.id ?? "";

  const [theCase, setTheCase] = useState<DemoCase | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [messages, setMessages] = useState<{ id: string; senderRole: string; senderName: string; body: string; isUrgent: boolean; createdAt: string }[]>([]);
  const [escalations, setEscalations] = useState<{ id: string; escalationBodyLabel: string; failedStepLabel: string; reason: string; status: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tracking" | "messages" | "escalations">("tracking");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [caseRes, timelineRes, msgRes, escRes] = await Promise.all([
        fetch(`${BASE}/api/demo-cases/${id}`),
        fetch(`${BASE}/api/cases/${id}/timeline?demo=true`),
        fetch(`${BASE}/api/cases/${id}/messages?demo=true`),
        fetch(`${BASE}/api/cases/${id}/escalations?demo=true`),
      ]);

      if (caseRes.ok) {
        const d = await caseRes.json();
        setTheCase(d.case);
      }
      if (timelineRes.ok) {
        const d = await timelineRes.json();
        setTimeline(d.timeline ?? []);
      }
      if (msgRes.ok) {
        const d = await msgRes.json();
        setMessages(d.messages ?? []);
      }
      if (escRes.ok) {
        const d = await escRes.json();
        setEscalations(d.escalations ?? []);
      }
    } catch {/* ignore */}
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const completedCount = timeline.filter(t => t.status === "completed").length;
  const delayedSteps = timeline.filter(t => t.isDelayed && t.status !== "completed");
  const failedSteps = timeline.filter(t => t.isFailed);
  const currentStep = timeline.find(t => t.status === "in_progress") ?? timeline.find(t => t.status === "overdue");
  const progressPct = Math.round((completedCount / SA_JUSTICE_STEPS.length) * 100);

  if (loading) {
    return (
      <MobileLayout>
        <div className="p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading demo case...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!theCase) {
    return (
      <MobileLayout>
        <div className="p-8 text-center text-destructive font-medium">Case not found.</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="pb-28">
        {/* Header */}
        <div className="bg-primary px-4 pt-4 pb-6 text-primary-foreground rounded-b-[36px] shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/demo-cases" className="inline-flex items-center text-sm font-bold text-primary-foreground/80 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" /> Demo Cases
            </Link>
            <span className="text-primary-foreground/40">·</span>
            <span className="text-xs font-bold text-primary-foreground/60 uppercase tracking-wider">DEMO MODE</span>
          </div>

          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-2">
              <h1 className="text-xl font-display font-bold leading-tight mb-2">{theCase.title}</h1>
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-white/20 text-white border-transparent text-[10px] font-bold">
                  {theCase.incident_type?.replace(/_/g, " ")}
                </Badge>
                {theCase.cas_number && (
                  <Badge className="bg-white/15 text-white border-transparent text-[10px] font-mono">
                    {theCase.cas_number}
                  </Badge>
                )}
              </div>
            </div>
            <div className={`rounded-full w-12 h-12 flex items-center justify-center shrink-0 ${
              failedSteps.length > 0 ? "bg-red-600" : delayedSteps.length > 0 ? "bg-amber-500" : "bg-green-500"
            }`}>
              {failedSteps.length > 0 ? <AlertOctagon className="w-6 h-6" /> :
               delayedSteps.length > 0 ? <AlertTriangle className="w-6 h-6" /> :
               <ShieldCheck className="w-6 h-6" />}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-primary-foreground/80">
              <span>{completedCount} of {SA_JUSTICE_STEPS.length} steps complete</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-white/10 rounded-2xl p-1">
            {(["tracking", "messages", "escalations"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all capitalize ${
                  activeTab === tab ? "bg-white text-primary shadow" : "text-white/80"
                }`}
              >
                {tab === "tracking" ? "📍 Track" : tab === "messages" ? "💬 Comms" : "🚨 Escalations"}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          <AnimatePresence mode="wait">
            {/* TRACKING TAB */}
            {activeTab === "tracking" && (
              <motion.div key="tracking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Who has the file */}
                {currentStep && (
                  <Card className="rounded-3xl border-2 border-blue-200 bg-blue-50 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">File Currently With</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 border-2 border-blue-300 flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base">{currentStep.actorName ?? currentStep.step.actorLabel}</h3>
                          <p className="text-sm text-blue-700 font-medium">{currentStep.step.actorLabel}</p>
                          <p className="text-xs text-gray-600 mt-1">Step: <span className="font-bold">{currentStep.step.label}</span></p>
                          {currentStep.dueAt && (
                            <p className={`text-xs font-bold mt-1 ${isAfter(new Date(), new Date(currentStep.dueAt)) ? "text-red-600" : "text-blue-600"}`}>
                              {isAfter(new Date(), new Date(currentStep.dueAt)) ? "⚠️ Overdue — was due " : "Due: "}
                              {formatDistanceToNow(new Date(currentStep.dueAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                      {currentStep.officialNotes && (
                        <div className="mt-3 bg-white rounded-xl p-3 border border-blue-200">
                          <p className="text-xs text-gray-600 leading-relaxed">{currentStep.officialNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Flag alert */}
                {(failedSteps.length > 0 || delayedSteps.length > 0) && (
                  <Card className={`rounded-3xl border-2 ${failedSteps.length > 0 ? "border-red-400 bg-red-50" : "border-amber-400 bg-amber-50"} shadow-md`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertOctagon className={`w-6 h-6 shrink-0 mt-0.5 ${failedSteps.length > 0 ? "text-red-600" : "text-amber-600"}`} />
                        <div className="flex-1">
                          <h3 className={`font-bold text-base ${failedSteps.length > 0 ? "text-red-800" : "text-amber-800"}`}>
                            {failedSteps.length > 0 ? `${failedSteps.length} Step(s) Failed` : `${delayedSteps.length} Step(s) Delayed`}
                          </h3>
                          <div className="mt-2 space-y-1.5">
                            {[...failedSteps, ...delayedSteps.filter(s => !s.isFailed)].slice(0, 3).map(s => (
                              <div key={s.step.id} className={`text-xs rounded-xl p-2 ${failedSteps.includes(s) ? "bg-red-100" : "bg-amber-100"}`}>
                                <span className="font-bold">{s.step.label}</span>
                                {s.delayHours && <span className="ml-1 text-red-700 font-bold">({s.delayHours}h late)</span>}
                                {s.delayReason && <p className="text-gray-600 mt-0.5 text-[10px]">{s.delayReason.substring(0, 100)}...</p>}
                                <p className="text-gray-500 text-[10px] mt-0.5">Responsible: <span className="font-bold">{s.step.actorLabel}</span></p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Case details */}
                <div className="bg-muted/30 rounded-2xl p-4 border border-border/60 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {theCase.cas_number && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CAS Number</p>
                        <p className="font-mono font-bold text-xs mt-0.5">{theCase.cas_number}</p>
                      </div>
                    )}
                    {theCase.io_name && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Investigating Officer</p>
                        <p className="font-bold text-xs mt-0.5">{theCase.io_name}</p>
                      </div>
                    )}
                    {theCase.incident_date && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Incident Date</p>
                        <p className="font-bold text-xs mt-0.5">{format(new Date(theCase.incident_date), "d MMMM yyyy")}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stage</p>
                      <p className="font-bold text-xs mt-0.5 capitalize">{theCase.stage?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                </div>

                {/* Justice Value Chain */}
                <h3 className="font-display font-bold text-lg px-1">Justice Value Chain</h3>
                <div className="space-y-0">
                  {timeline.map((item, idx) => {
                    const cfg = statusConfig(item.status);
                    const isExpanded = expandedStep === item.step.id;
                    const isLast = idx === timeline.length - 1;
                    const escalateBodyInfo = ESCALATION_BODIES[item.step.escalateTo];

                    return (
                      <div key={item.step.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                            item.status === "completed" ? "bg-green-500 border-green-500 text-white" :
                            item.status === "in_progress" ? "bg-blue-500 border-blue-500 text-white" :
                            item.status === "failed" || item.status === "escalated" ? "bg-red-600 border-red-600 text-white" :
                            item.isDelayed ? "bg-amber-500 border-amber-500 text-white" :
                            "bg-gray-200 border-gray-300 text-gray-400"
                          }`}>
                            {item.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> :
                             item.status === "in_progress" ? <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> :
                             item.status === "failed" || item.status === "escalated" ? <XCircle className="w-4 h-4" /> :
                             <span className="text-[10px] font-bold">{idx + 1}</span>}
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 flex-1 min-h-[24px] mt-1 ${
                              item.status === "completed" ? "bg-green-300" : item.status === "in_progress" ? "bg-blue-300" : "bg-gray-200"
                            }`} />
                          )}
                        </div>

                        <div className="flex-1 pb-4">
                          <button
                            onClick={() => setExpandedStep(isExpanded ? null : item.step.id)}
                            className={`w-full text-left rounded-2xl p-3 border transition-all ${cfg.bg} ${cfg.border} ${item.isFailed || item.isDelayed ? "border-2" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                                    {item.isFailed ? "FAILED" : item.isDelayed ? "DELAYED" : cfg.label}
                                  </span>
                                  {item.step.isCritical && <span className="text-[10px] text-red-600 font-bold">⚡ Critical</span>}
                                </div>
                                <h4 className="font-bold text-sm text-gray-900 leading-tight">{item.step.label}</h4>
                                <p className="text-[11px] text-gray-600 mt-0.5">{item.step.actorLabel} · {item.step.deadline}</p>
                                {item.delayHours && <p className="text-[11px] font-bold text-red-700 mt-0.5">🚩 {item.delayHours}h behind schedule</p>}
                                {item.completedAt && <p className="text-[11px] text-green-700 font-medium mt-0.5">✓ {format(new Date(item.completedAt), "d MMM yyyy")}</p>}
                              </div>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 mt-1" />}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className={`mt-2 rounded-2xl border p-4 space-y-3 bg-white ${cfg.border}`}>
                                  <div>
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">What Must Happen</h5>
                                    <ul className="space-y-1.5">
                                      {item.step.whatMustHappen.map((w, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                                          <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-[8px] font-bold text-primary">{i + 1}</span>
                                          {w}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">What You Must Receive</h5>
                                    <ul className="space-y-1">
                                      {item.step.whatComplainantShouldReceive.map((w, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                                          <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />{w}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Legal Basis</p>
                                    <p className="text-xs text-gray-700 font-medium">{item.step.legalBasis}</p>
                                  </div>

                                  {item.officialNotes && (
                                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Official Update</p>
                                      <p className="text-xs text-gray-700">{item.officialNotes}</p>
                                    </div>
                                  )}

                                  {item.delayReason && (
                                    <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                                      <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Delay Documented</p>
                                      <p className="text-xs text-gray-700">{item.delayReason}</p>
                                      <p className="text-[10px] text-gray-500 mt-1">Responsible: <span className="font-bold">{item.step.actorLabel}</span></p>
                                    </div>
                                  )}

                                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">If This Step Fails</p>
                                    <p className="text-xs text-gray-700">{item.step.failureConsequence}</p>
                                  </div>

                                  {escalateBodyInfo && (
                                    <div className="bg-gray-50 rounded-xl p-3 border">
                                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Escalate To</p>
                                      <p className="text-xs font-bold">{escalateBodyInfo.label}</p>
                                      <a href={`tel:${escalateBodyInfo.phone}`} className="flex items-center gap-1 mt-1 text-primary font-bold text-xs">
                                        <Phone className="w-3 h-3" /> {escalateBodyInfo.phone}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* MESSAGES TAB */}
            {activeTab === "messages" && (
              <motion.div key="messages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="bg-blue-50 rounded-2xl p-3 border border-blue-200">
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    These are the official communications in this demo case — system updates, official notifications, and complainant messages.
                  </p>
                </div>
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-sm">No messages in this case</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderRole === "complainant" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl p-3 ${
                        msg.senderRole === "complainant" ? "bg-primary text-primary-foreground rounded-br-md" :
                        msg.senderRole === "system" ? "bg-gray-100 text-gray-700 rounded-bl-md" :
                        msg.isUrgent ? "bg-red-50 border-2 border-red-300 text-red-900 rounded-bl-md" :
                        "bg-blue-50 border border-blue-200 text-blue-900 rounded-bl-md"
                      }`}>
                        <p className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName} {msg.isUrgent && "🚨"}</p>
                        <p className="text-xs leading-relaxed">{msg.body}</p>
                        <p className="text-[10px] opacity-50 mt-1.5">{format(new Date(msg.createdAt), "d MMM, HH:mm")}</p>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* ESCALATIONS TAB */}
            {activeTab === "escalations" && (
              <motion.div key="escalations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {escalations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-sm">No escalations in this case</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {escalations.map(esc => (
                      <Card key={esc.id} className="rounded-2xl border-2 border-amber-200 bg-amber-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="font-bold text-sm">{esc.escalationBodyLabel}</p>
                              <p className="text-xs text-gray-600">{esc.failedStepLabel}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                              esc.status === "resolved" ? "bg-green-100 text-green-700" :
                              esc.status === "investigating" ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>{esc.status}</span>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">{esc.reason.substring(0, 200)}...</p>
                          <p className="text-[10px] text-gray-500 mt-2">{format(new Date(esc.createdAt), "d MMM yyyy")}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                  <h3 className="font-bold text-sm">SA Escalation Bodies</h3>
                  {[
                    { key: "commission_gender_equality", label: "Commission for Gender Equality", phone: "0800 007 709" },
                    { key: "sahrc", label: "SA Human Rights Commission", phone: "011 877 3600" },
                    { key: "public_protector", label: "Public Protector SA", phone: "0800 112 040" },
                  ].map(b => (
                    <div key={b.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold">{b.label}</p>
                        <a href={`tel:${b.phone}`} className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {b.phone}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center py-2">
            <p className="text-[10px] text-muted-foreground">Demo case · All names fictional · © Adv. Thando Gumede ZA — M-TETO™</p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
