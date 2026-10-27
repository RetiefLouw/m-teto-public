/**
 * JusticeTimelines.tsx — Admin portal for SA Justice Value Chain tracking
 * Per-case drilldown, step management, escalation view, system alerts
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Scale, Flag, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp,
  TrendingUp, RefreshCw, XCircle, AlertOctagon, Flame, User, MessageSquare,
  Send, Search, Filter, FileText, Shield, X, Eye, Phone, ExternalLink,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function adminFetch(path: string, options?: RequestInit) {
  return fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Pin": sessionStorage.getItem("mteto_admin_pin") ?? "",
      ...(options?.headers ?? {}),
    },
  });
}

// ── Types ──────────────────────────────────────────────────────────────────

interface AdminCase {
  id: string;
  title: string;
  incident_type: string;
  stage: string;
  cas_number: string;
  io_name: string;
  court_date: string | null;
  created_at: string;
  user_id: string;
  delayed_steps: number;
  failed_steps: number;
  escalation_count: number;
  pending_escalations: number;
  unread_messages: number;
  current_step_label: string | null;
  current_actor_label: string | null;
}

interface TimelineEvent {
  id: string;
  stepId: string;
  stepLabel: string;
  stepNumber: number;
  status: string;
  actorRole: string;
  actorLabel: string;
  actorName: string | null;
  officialNotes: string | null;
  isDelayed: boolean;
  isFailed: boolean;
  delayHours: number | null;
  delayReason: string | null;
  completedAt: string | null;
  dueAt: string | null;
  step: {
    id: string;
    label: string;
    actorLabel: string;
    deadline: string;
    isCritical: boolean;
    legalBasis: string;
    whatMustHappen: string[];
    escalateTo: string;
    deadlineHours: number | null;
    flagAfterHours: number | null;
  };
}

interface CaseMessage {
  id: string;
  senderRole: string;
  senderName: string;
  senderTitle: string;
  messageType: string;
  subject: string;
  body: string;
  isUrgent: boolean;
  isRead: boolean;
  createdAt: string;
}

interface CaseEscalation {
  id: string;
  escalationBody: string;
  escalationBodyLabel: string;
  escalationLevel: number;
  failedStepId: string;
  failedStepLabel: string;
  reason: string;
  response: string | null;
  status: string;
  referenceNumber: string | null;
  submittedBy: string;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getFlagLevel(c: AdminCase) {
  if (c.failed_steps > 0) return "critical";
  if (c.delayed_steps > 0) return "delayed";
  if (c.pending_escalations > 0) return "escalated";
  return "ok";
}

function FlagDot({ level }: { level: string }) {
  if (level === "critical") return <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shrink-0" />;
  if (level === "delayed") return <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />;
  if (level === "escalated") return <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />;
  return <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Completed</span>;
    case "in_progress":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">● In Progress</span>;
    case "overdue":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚠ Overdue</span>;
    case "failed":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">✗ Failed</span>;
    case "escalated":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-800">🔥 Escalated</span>;
    case "skipped":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">— Skipped</span>;
    default:
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Pending</span>;
  }
}

// ── Case drilldown panel ───────────────────────────────────────────────────

function CaseDrilldown({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"steps" | "messages" | "escalations">("steps");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [stepActor, setStepActor] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  const { data: timelineData, refetch: refetchTimeline } = useQuery({
    queryKey: ["admin-timeline", caseId],
    queryFn: () => adminFetch(`/cases/${caseId}/timeline`).then(r => r.json()),
  });

  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ["admin-messages", caseId],
    queryFn: () => adminFetch(`/cases/${caseId}/messages`).then(r => r.json()),
  });

  const { data: escalationsData, refetch: refetchEscalations } = useQuery({
    queryKey: ["admin-escalations", caseId],
    queryFn: () => adminFetch(`/cases/${caseId}/escalations`).then(r => r.json()),
  });

  const timeline: TimelineEvent[] = timelineData?.timeline ?? [];
  const messages: CaseMessage[] = messagesData?.messages ?? [];
  const escalations: CaseEscalation[] = escalationsData?.escalations ?? [];

  const updateStepStatus = async (event: TimelineEvent, newStatus: string) => {
    setUpdatingStep(event.id);
    try {
      await adminFetch(`/cases/${caseId}/timeline`, {
        method: "POST",
        body: JSON.stringify({
          stepId: event.step.id,
          stepLabel: event.step.label,
          stepNumber: event.step.id.match(/\d+/)?.[0],
          status: newStatus,
          actorRole: event.step.escalateTo,
          actorLabel: event.step.actorLabel,
          actorName: stepActor[event.id] || event.actorName,
          officialNotes: stepNotes[event.id] || event.officialNotes,
          completedAt: newStatus === "completed" ? new Date().toISOString() : null,
        }),
      });
      await refetchTimeline();
      qc.invalidateQueries({ queryKey: ["admin-case-tracking"] });
    } catch {/* ignore */}
    setUpdatingStep(null);
  };

  const sendAdminMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    try {
      await adminFetch(`/cases/${caseId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          senderRole: "official",
          senderName: "M-TETO Admin",
          senderTitle: "Case Management System",
          messageType: "update",
          subject: "Official Case Update",
          body: newMessage.trim(),
          isUrgent: false,
        }),
      });
      setNewMessage("");
      await refetchMessages();
    } catch {/* ignore */}
    setSendingMsg(false);
  };

  const updateEscalationStatus = async (escalationId: string, status: string, response?: string) => {
    try {
      await adminFetch(`/cases/${caseId}/escalations/${escalationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, response }),
      });
      await refetchEscalations();
    } catch {/* ignore */}
  };

  const completedCount = timeline.filter(t => t.status === "completed").length;
  const failedCount = timeline.filter(t => t.isFailed).length;
  const delayedCount = timeline.filter(t => t.isDelayed && t.status !== "completed").length;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-stretch justify-end">
      <div className="bg-white w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8215D] flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-base">Case Drilldown</h2>
              <p className="text-xs text-slate-500">Admin view — authenticated official</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full">{completedCount} done</span>
              {delayedCount > 0 && <span className="bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full">{delayedCount} late</span>}
              {failedCount > 0 && <span className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded-full">{failedCount} failed</span>}
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-all">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 shrink-0">
          {(["steps", "messages", "escalations"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 capitalize ${
                activeTab === tab ? "border-[#E8215D] text-[#E8215D]" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "steps" ? `⚖️ Steps (${timeline.length})` :
               tab === "messages" ? `💬 Messages (${messages.length})` :
               `🚨 Escalations (${escalations.length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* STEPS */}
          {activeTab === "steps" && (
            <div className="p-4 space-y-2">
              {timeline.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No timeline events yet</p>
                </div>
              ) : (
                timeline.map(item => (
                  <div key={item.id} className={`border rounded-xl overflow-hidden ${
                    item.isFailed ? "border-red-300 bg-red-50/50" :
                    item.isDelayed ? "border-amber-300 bg-amber-50/50" :
                    item.status === "completed" ? "border-green-200 bg-green-50/30" :
                    item.status === "in_progress" ? "border-blue-200 bg-blue-50/30" :
                    "border-slate-200"
                  }`}>
                    <button
                      className="w-full flex items-start justify-between gap-3 p-3 text-left"
                      onClick={() => setExpandedStep(expandedStep === item.id ? null : item.id)}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold mt-0.5 ${
                          item.status === "completed" ? "bg-green-500" :
                          item.status === "in_progress" ? "bg-blue-500" :
                          item.isFailed ? "bg-red-600" :
                          item.isDelayed ? "bg-amber-500" :
                          "bg-slate-300"
                        }`}>
                          {item.stepNumber ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-800 truncate">{item.stepLabel}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.step.actorLabel} · {item.step.deadline}</p>
                          {item.delayHours && (
                            <p className="text-xs font-bold text-red-700 mt-0.5">🚩 {item.delayHours}h behind deadline</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={item.status} />
                        {expandedStep === item.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {expandedStep === item.id && (
                      <div className="border-t border-slate-200 p-4 space-y-4 bg-white">
                        {/* Delay info */}
                        {item.delayReason && (
                          <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                            <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Delay Reason</p>
                            <p className="text-xs text-red-900 leading-relaxed">{item.delayReason}</p>
                            {item.delayHours && <p className="text-[10px] text-red-600 mt-1 font-bold">Duration: {item.delayHours}h late</p>}
                          </div>
                        )}

                        {/* Official notes display */}
                        {item.officialNotes && (
                          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Current Official Notes</p>
                            <p className="text-xs text-blue-900 leading-relaxed">{item.officialNotes}</p>
                          </div>
                        )}

                        {/* Legal basis */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Legal Basis</p>
                          <p className="text-xs text-slate-700">{item.step.legalBasis}</p>
                        </div>

                        {/* Admin controls */}
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Admin — Update This Step</p>

                          <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Responsible Official Name</label>
                            <input
                              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8215D]/30"
                              placeholder={`e.g. ${item.step.actorLabel}`}
                              defaultValue={item.actorName ?? ""}
                              onChange={e => setStepActor(prev => ({ ...prev, [item.id]: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Official Notes / Status Update</label>
                            <textarea
                              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8215D]/30 resize-none"
                              rows={3}
                              placeholder="Enter official status notes visible to the complainant..."
                              defaultValue={item.officialNotes ?? ""}
                              onChange={e => setStepNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {["in_progress", "completed", "overdue", "failed"].map(s => (
                              <button
                                key={s}
                                onClick={() => updateStepStatus(item, s)}
                                disabled={updatingStep === item.id || item.status === s}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-50 ${
                                  s === "completed" ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100" :
                                  s === "in_progress" ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100" :
                                  s === "overdue" ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100" :
                                  "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                                } ${item.status === s ? "opacity-30 cursor-not-allowed" : ""}`}
                              >
                                {updatingStep === item.id ? "..." : `Mark ${s.replace("_", " ")}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* MESSAGES */}
          {activeTab === "messages" && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No messages yet</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderRole === "official" || msg.senderRole === "system" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 ${
                        msg.senderRole === "official" ? "bg-[#E8215D] text-white rounded-br-md" :
                        msg.senderRole === "system" ? "bg-slate-100 text-slate-700 rounded-bl-md" :
                        msg.isUrgent ? "bg-red-50 border-2 border-red-300 text-red-900 rounded-bl-md" :
                        "bg-blue-50 border border-blue-200 text-blue-900 rounded-bl-md"
                      }`}>
                        <p className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName} {msg.isUrgent && "🚨 Urgent"}</p>
                        {msg.subject && msg.senderRole !== "complainant" && (
                          <p className="text-xs font-bold mb-1">{msg.subject}</p>
                        )}
                        <p className="text-xs leading-relaxed">{msg.body}</p>
                        <p className="text-[10px] opacity-50 mt-1.5">
                          {new Date(msg.createdAt).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          {!msg.isRead && msg.senderRole === "complainant" && <span className="ml-1 text-red-500 font-bold">● unread</span>}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Admin reply box */}
              <div className="border-t border-slate-200 p-4 bg-slate-50 shrink-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Send Official Response</p>
                <div className="flex gap-2 items-end">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type your official response to the complainant..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8215D]/30 resize-none bg-white"
                    rows={2}
                  />
                  <button
                    onClick={sendAdminMessage}
                    disabled={!newMessage.trim() || sendingMsg}
                    className="px-4 py-2 bg-[#E8215D] text-white rounded-xl text-sm font-bold hover:bg-[#C51A4A] transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingMsg ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ESCALATIONS */}
          {activeTab === "escalations" && (
            <div className="p-4 space-y-3">
              {escalations.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No escalations in this case</p>
                </div>
              ) : (
                escalations.map(esc => (
                  <div key={esc.id} className={`border-2 rounded-xl p-4 ${
                    esc.status === "resolved" ? "border-green-300 bg-green-50" :
                    esc.status === "investigating" ? "border-blue-300 bg-blue-50" :
                    "border-amber-300 bg-amber-50"
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            esc.escalationLevel >= 6 ? "bg-red-100 text-red-700" :
                            esc.escalationLevel >= 4 ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            Level {esc.escalationLevel}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            esc.status === "resolved" ? "bg-green-100 text-green-700" :
                            esc.status === "investigating" ? "bg-blue-100 text-blue-700" :
                            esc.status === "acknowledged" ? "bg-purple-100 text-purple-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {esc.status}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800">{esc.escalationBodyLabel}</p>
                        <p className="text-xs text-slate-600">Re: {esc.failedStepLabel}</p>
                        <p className="text-xs text-slate-500 mt-0.5">By: {esc.submittedBy} · {new Date(esc.createdAt).toLocaleDateString("en-ZA")}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed mb-3 bg-white rounded-lg p-2.5 border border-slate-200">
                      {esc.reason}
                    </p>

                    {esc.response && (
                      <div className="bg-white rounded-lg p-2.5 border border-green-200 mb-3">
                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">Official Response</p>
                        <p className="text-xs text-green-900">{esc.response}</p>
                      </div>
                    )}

                    {esc.referenceNumber && (
                      <p className="text-xs font-bold text-slate-700 mb-3">Ref: {esc.referenceNumber}</p>
                    )}

                    {/* Admin status controls */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {["acknowledged", "investigating", "resolved", "dismissed"].map(s => (
                          <button
                            key={s}
                            onClick={() => updateEscalationStatus(esc.id, s)}
                            disabled={esc.status === s}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all disabled:opacity-40 ${
                              s === "resolved" ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100" :
                              s === "investigating" ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100" :
                              s === "dismissed" ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100" :
                              "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function JusticeTimelines() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "delayed" | "escalated" | "ok">("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-case-tracking"],
    queryFn: () => adminFetch("/admin/case-tracking").then(r => r.json()),
    refetchInterval: 30_000,
  });

  const cases: AdminCase[] = data?.cases ?? [];
  const filtered = cases.filter(c => {
    const flag = getFlagLevel(c);
    const matchFilter = filter === "all" || flag === filter;
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.cas_number?.toLowerCase().includes(search.toLowerCase()) || c.io_name?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: cases.length,
    critical: cases.filter(c => c.failed_steps > 0).length,
    delayed: cases.filter(c => c.delayed_steps > 0 && c.failed_steps === 0).length,
    escalated: cases.filter(c => c.pending_escalations > 0).length,
    ok: cases.filter(c => c.failed_steps === 0 && c.delayed_steps === 0 && c.pending_escalations === 0).length,
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8215D] flex items-center justify-center shadow-md">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Justice Tracker — Admin</h1>
            <p className="text-slate-500 text-sm">SA Justice Value Chain · Step management · Escalation oversight</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all ${isFetching ? "opacity-60" : ""}`}
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* System Alerts */}
      {(stats.critical > 0 || stats.escalated > 0) && (
        <div className={`rounded-2xl border-2 p-4 flex items-start gap-3 ${stats.critical > 0 ? "border-red-400 bg-red-50" : "border-amber-400 bg-amber-50"}`}>
          <AlertOctagon className={`w-6 h-6 shrink-0 mt-0.5 ${stats.critical > 0 ? "text-red-600" : "text-amber-600"}`} />
          <div>
            <h3 className={`font-bold text-base ${stats.critical > 0 ? "text-red-800" : "text-amber-800"}`}>
              System Alert — Immediate Attention Required
            </h3>
            <div className="text-xs mt-1 space-y-0.5">
              {stats.critical > 0 && <p className="text-red-700 font-medium">● {stats.critical} case(s) have failed steps — escalation may be needed</p>}
              {stats.escalated > 0 && <p className="text-amber-700 font-medium">● {stats.escalated} case(s) have pending unresolved escalations</p>}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { key: "all", label: "Total Cases", value: stats.total, color: "bg-slate-100 text-slate-700 border-slate-200" },
          { key: "critical", label: "🔴 Failed Steps", value: stats.critical, color: "bg-red-100 text-red-700 border-red-200" },
          { key: "delayed", label: "🟡 Delayed", value: stats.delayed, color: "bg-amber-100 text-amber-700 border-amber-200" },
          { key: "escalated", label: "🔥 Escalated", value: stats.escalated, color: "bg-orange-100 text-orange-700 border-orange-200" },
          { key: "ok", label: "🟢 On Track", value: stats.ok, color: "bg-green-100 text-green-700 border-green-200" },
        ].map(card => (
          <button
            key={card.key}
            onClick={() => setFilter(card.key as typeof filter)}
            className={`border rounded-2xl p-4 text-left transition-all hover:shadow-md ${card.color} ${filter === card.key ? "ring-2 ring-offset-1 ring-[#E8215D]" : ""}`}
          >
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{card.label}</p>
            <p className="text-3xl font-black">{isLoading ? "—" : card.value}</p>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by case title, CAS number, or IO name..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8215D]/30 bg-white"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "critical", "delayed", "escalated", "ok"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                filter === f ? "bg-[#E8215D] text-white border-[#E8215D]" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}
            >
              {f === "all" ? `All (${stats.total})` :
               f === "critical" ? `🔴 (${stats.critical})` :
               f === "delayed" ? `🟡 (${stats.delayed})` :
               f === "escalated" ? `🔥 (${stats.escalated})` :
               `🟢 (${stats.ok})`}
            </button>
          ))}
        </div>
      </div>

      {/* Case List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-600 text-lg">No cases found</h3>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search.</p>
          </div>
        ) : (
          filtered.map(c => {
            const flag = getFlagLevel(c);
            return (
              <div
                key={c.id}
                className={`border rounded-xl overflow-hidden transition-all hover:shadow-md ${
                  flag === "critical" ? "border-red-300 bg-red-50/40" :
                  flag === "delayed" ? "border-amber-300 bg-amber-50/40" :
                  flag === "escalated" ? "border-orange-300 bg-orange-50/40" :
                  "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <FlagDot level={flag} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-sm truncate">{c.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500">{c.cas_number || "No CAS"}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[10px] text-slate-500">{c.incident_type?.replace(/_/g, " ")}</span>
                          {c.io_name && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-[10px] text-slate-500">IO: {c.io_name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Badges */}
                        {c.failed_steps > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3" /> {c.failed_steps} failed
                          </span>
                        )}
                        {c.delayed_steps > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            <AlertTriangle className="w-3 h-3" /> {c.delayed_steps} late
                          </span>
                        )}
                        {c.pending_escalations > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            <Flame className="w-3 h-3" /> {c.pending_escalations} pending
                          </span>
                        )}
                        {c.unread_messages > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            <MessageSquare className="w-3 h-3" /> {c.unread_messages} unread
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Current step info */}
                    {c.current_step_label && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <p className="text-xs text-slate-500">
                          File with: <span className="font-bold text-slate-700">{c.current_actor_label}</span>
                          <span className="text-slate-400 mx-1">·</span>
                          {c.current_step_label}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedCaseId(c.id)}
                    className="px-4 py-2 bg-[#E8215D] text-white rounded-xl text-xs font-bold hover:bg-[#C51A4A] transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Drilldown
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <div className="text-xs text-slate-400 text-center">
          Showing {filtered.length} of {cases.length} cases · Refreshes every 30s
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-slate-400 bg-slate-50 rounded-xl p-4 border border-slate-200">
        <strong>Flag Legend:</strong> 🔴 Critical = step(s) failed, immediate escalation needed ·
        🟡 Delayed = behind legal deadlines · 🔥 Escalated = sent to CGE/SAHRC/PP · 🟢 On Track
        · Click <strong>Drilldown</strong> to view the full 15-step SA Justice Value Chain and update step statuses.
        <br />
        <strong className="text-slate-500 mt-1 block">Copyright: Adv. Thando Gumede ZA — M-TETO™</strong>
      </div>

      {/* Case Drilldown Panel */}
      {selectedCaseId && (
        <CaseDrilldown
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
        />
      )}
    </div>
  );
}
