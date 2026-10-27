/**
 * M-TETO SP Inbox — Unified Communications Hub
 * All inbound contact: messages, emails, calls, walk-ins, emergency events.
 * Every inquiry must be responded to within SLA or it triggers a review.
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { spApi } from "@/lib/api";
import {
  MessageSquare, Mail, Phone, AlertOctagon, Users,
  RefreshCw, Search, Filter, ChevronRight, ChevronDown,
  Send, Clock, CheckCircle2, AlertTriangle, X,
  User, Building2, MapPin, Star, Flag, Zap,
  FileText, ArrowLeft, Circle, ExternalLink,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
type InquiryType = "all" | "message" | "email" | "call" | "emergency" | "walk_in";
type StatusFilter = "all" | "open" | "in_progress" | "resolved" | "escalated";

interface Inquiry {
  id: string;
  type: string;
  status: string;
  urgency: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  organisation_slug: string;
  assigned_to: string;
  assigned_department: string;
  subject: string;
  body: string;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_address: string | null;
  is_read: boolean;
  requires_response: boolean;
  responded_at: string | null;
  resolved_at: string | null;
  first_response_at: string | null;
  review_score: number | null;
  was_reported: boolean;
  response_count: number;
  last_response: string | null;
  created_at: string;
  updated_at: string;
}

interface Response {
  id: string;
  inquiry_id: string;
  responder_name: string;
  responder_role: string;
  responder_department: string;
  channel: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────
const TYPE_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  message:   { icon: MessageSquare, color: "text-blue-400",   bg: "bg-blue-500/15 border-blue-500/30",   label: "Message"   },
  email:     { icon: Mail,          color: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/30", label: "Email"   },
  call:      { icon: Phone,         color: "text-emerald-400",bg: "bg-emerald-500/15 border-emerald-500/30",label: "Call"  },
  emergency: { icon: AlertOctagon,  color: "text-red-400",    bg: "bg-red-500/15 border-red-500/30",     label: "Emergency" },
  walk_in:   { icon: Users,         color: "text-amber-400",  bg: "bg-amber-500/15 border-amber-500/30", label: "Walk-In"   },
};

const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  open:        { label: "Open",        cls: "text-amber-400",  dot: "bg-amber-400"  },
  in_progress: { label: "In Progress", cls: "text-blue-400",   dot: "bg-blue-400"   },
  resolved:    { label: "Resolved",    cls: "text-emerald-400",dot: "bg-emerald-400"},
  escalated:   { label: "Escalated",   cls: "text-red-400",    dot: "bg-red-400"    },
  closed:      { label: "Closed",      cls: "text-gray-400",   dot: "bg-gray-400"   },
};

const URGENCY_CFG: Record<string, string> = {
  normal:   "text-gray-400",
  urgent:   "text-amber-400",
  critical: "text-red-400",
};

function fmtDateTime(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-ZA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function timeSince(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function slaHours(type: string) {
  if (type === "emergency") return 0.5;
  if (type === "call") return 1;
  return 24;
}

function slaStatus(inq: Inquiry): "ok" | "warning" | "breach" {
  if (inq.responded_at) return "ok";
  const age = (Date.now() - new Date(inq.created_at).getTime()) / 3600000;
  const sla = slaHours(inq.type);
  if (age > sla) return "breach";
  if (age > sla * 0.6) return "warning";
  return "ok";
}

const TAB_TYPES: { key: InquiryType; label: string; icon: React.ElementType }[] = [
  { key: "all",       label: "All",       icon: FileText      },
  { key: "message",   label: "Messages",  icon: MessageSquare },
  { key: "email",     label: "Emails",    icon: Mail          },
  { key: "call",      label: "Calls",     icon: Phone         },
  { key: "emergency", label: "Emergency", icon: AlertOctagon  },
  { key: "walk_in",   label: "Walk-Ins",  icon: Users         },
];

// ── Main Component ────────────────────────────────────────────
export function Inbox() {
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter]     = useState<InquiryType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [q, setQ]                       = useState("");
  const [inquiries, setInquiries]       = useState<Inquiry[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [detail, setDetail]             = useState<{ inquiry: Inquiry; responses: Response[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyBody, setReplyBody]       = useState("");
  const [replyName, setReplyName]       = useState("SP Official");
  const [replyRole, setReplyRole]       = useState("Case Manager");
  const [replyChannel, setReplyChannel] = useState("portal");
  const [replyInternal, setReplyInternal] = useState(false);
  const [replySaving, setReplySaving]   = useState(false);
  const [replyMsg, setReplyMsg]         = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const r = await spApi.getInquiries({
        type:   typeFilter   !== "all" ? typeFilter   : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        q:      q || undefined,
        limit: 100,
      });
      setInquiries(r.inquiries ?? []);
      setTotal(r.total ?? 0);
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, q]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const r = await spApi.getInquiry(id);
      setDetail(r);
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i));
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.responses]);

  async function handleReply() {
    if (!selectedId || !replyBody.trim()) return;
    setReplySaving(true); setReplyMsg("");
    try {
      await spApi.respondToInquiry(selectedId, {
        responderName: replyName,
        responderRole: replyRole,
        body: replyBody,
        channel: replyChannel,
        isInternal: replyInternal,
      });
      setReplyBody("");
      setReplyMsg("Response sent successfully.");
      await loadDetail(selectedId);
      await loadList();
    } catch {
      setReplyMsg("Failed to send. Please try again.");
    } finally {
      setReplySaving(false);
      setTimeout(() => setReplyMsg(""), 4000);
    }
  }

  async function handleStatusUpdate(status: string) {
    if (!selectedId) return;
    setStatusUpdating(true);
    try {
      await spApi.updateInquiryStatus(selectedId, { status });
      await loadDetail(selectedId);
      await loadList();
    } catch {
      /* silent */
    } finally {
      setStatusUpdating(false);
    }
  }

  // ── Counts for tab badges ─────────────────────────────────
  function countOf(type: InquiryType) {
    if (type === "all") return inquiries.length;
    return inquiries.filter(i => i.type === type).length;
  }
  function unrespondedOf(type: InquiryType) {
    return inquiries
      .filter(i => (type === "all" || i.type === type) && !i.responded_at && i.requires_response)
      .length;
  }

  const selected = detail?.inquiry;
  const responses = detail?.responses ?? [];

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ── LEFT PANEL: List ─────────────────────────────────── */}
      <div className={`flex flex-col border-r border-border bg-[hsl(218,30%,10%)] transition-all ${selectedId ? "hidden md:flex md:w-[380px]" : "w-full md:w-[380px]"} flex-shrink-0`}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-sm font-bold text-foreground">Inbox</h1>
              <p className="text-[11px] text-muted-foreground">{total} inquiries total</p>
            </div>
            <button onClick={loadList} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <RefreshCw size={12} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && loadList()}
              placeholder="Search inquiries…"
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 flex-wrap">
            {(["all","open","in_progress","resolved"] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-white/5 text-muted-foreground hover:text-foreground"}`}
              >
                {s.replace("_"," ")}
              </button>
            ))}
          </div>
        </div>

        {/* Type tabs */}
        <div className="flex gap-0 border-b border-border overflow-x-auto flex-shrink-0">
          {TAB_TYPES.map(({ key, label, icon: Icon }) => {
            const unresponded = unrespondedOf(key);
            return (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-semibold border-b-2 transition-colors ${typeFilter === key ? "border-blue-500 text-blue-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                <div className="relative">
                  <Icon size={13} />
                  {unresponded > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-black">{unresponded}</span>
                  )}
                </div>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Inquiry list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-xs">Loading…</div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs gap-2">
              <MessageSquare size={24} className="opacity-30" />
              <p>No inquiries found</p>
            </div>
          ) : (
            inquiries
              .filter(i => typeFilter === "all" || i.type === typeFilter)
              .map(inq => {
                const tc = TYPE_CFG[inq.type] ?? TYPE_CFG.message;
                const sc = STATUS_CFG[inq.status] ?? STATUS_CFG.open;
                const sla = slaStatus(inq);
                const isSelected = selectedId === inq.id;
                return (
                  <button
                    key={inq.id}
                    onClick={() => setSelectedId(isSelected ? null : inq.id)}
                    className={`w-full text-left px-3 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${isSelected ? "bg-blue-600/10 border-l-2 border-l-blue-500" : ""}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center border ${tc.bg}`}>
                        <tc.icon size={13} className={tc.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          {!inq.is_read && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />}
                          <p className={`text-xs font-semibold truncate ${!inq.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                            {inq.contact_name || "Anonymous"}
                          </p>
                          {inq.urgency !== "normal" && (
                            <span className={`text-[9px] font-black uppercase ${URGENCY_CFG[inq.urgency]}`}>
                              {inq.urgency === "critical" ? "🚨" : "⚠️"} {inq.urgency}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-foreground/80 truncate mb-1">{inq.subject}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`flex items-center gap-1 text-[9px] font-semibold ${sc.cls}`}>
                            <Circle size={5} className={sc.dot} fill="currentColor" /> {sc.label}
                          </span>
                          {sla === "breach" && <span className="text-[9px] font-black text-red-400">SLA BREACH</span>}
                          {sla === "warning" && <span className="text-[9px] font-black text-amber-400">SLA WARNING</span>}
                          <span className="text-[9px] text-muted-foreground ml-auto">{timeSince(inq.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Detail ──────────────────────────────── */}
      {selectedId ? (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[hsl(218,30%,9%)]">
          {/* Detail header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-shrink-0 bg-[hsl(218,30%,10%)]">
            <button
              onClick={() => setSelectedId(null)}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} />
            </button>
            {selected && (() => {
              const tc = TYPE_CFG[selected.type] ?? TYPE_CFG.message;
              const sc = STATUS_CFG[selected.status] ?? STATUS_CFG.open;
              const sla = slaStatus(selected);
              return (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${tc.bg}`}>
                      <tc.icon size={11} className={tc.color} />
                    </div>
                    <p className="text-sm font-bold text-foreground truncate">{selected.subject}</p>
                    {sla === "breach" && <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded-full">SLA BREACH</span>}
                    {selected.was_reported && <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded-full">⚠️ REPORTED</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                    <span className={sc.cls}>{sc.label}</span>
                    <span>{timeSince(selected.created_at)}</span>
                    {selected.assigned_to && <span>Assigned: {selected.assigned_to}</span>}
                  </div>
                </div>
              );
            })()}

            {/* Status actions */}
            {selected && selected.status !== "resolved" && (
              <div className="flex gap-1.5">
                {selected.status === "open" && (
                  <button
                    onClick={() => handleStatusUpdate("in_progress")}
                    disabled={statusUpdating}
                    className="text-[10px] px-2 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-colors"
                  >
                    Take Over
                  </button>
                )}
                <button
                  onClick={() => handleStatusUpdate("resolved")}
                  disabled={statusUpdating}
                  className="text-[10px] px-2 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                >
                  Resolve
                </button>
                <button
                  onClick={() => handleStatusUpdate("escalated")}
                  disabled={statusUpdating}
                  className="text-[10px] px-2 py-1 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-colors"
                >
                  Escalate
                </button>
              </div>
            )}
          </div>

          {/* Thread */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {detailLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-xs">Loading thread…</div>
            ) : (
              <>
                {/* Original inquiry */}
                {selected && (
                  <div className="rounded-2xl bg-[hsl(218,25%,14%)] border border-border p-4">
                    {/* Contact details */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                        {(selected.contact_name || "A")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{selected.contact_name || "Anonymous"}</p>
                        <div className="flex gap-3 text-[10px] text-muted-foreground flex-wrap mt-0.5">
                          {selected.contact_phone && <span className="flex items-center gap-1"><Phone size={9} /> {selected.contact_phone}</span>}
                          {selected.contact_email && <span className="flex items-center gap-1"><Mail size={9} /> {selected.contact_email}</span>}
                          {selected.geo_address && <span className="flex items-center gap-1"><MapPin size={9} /> {selected.geo_address}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDateTime(selected.created_at)}</p>
                      </div>
                    </div>

                    {/* Metadata row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-[10px]">
                      {[
                        { label: "Type",       value: TYPE_CFG[selected.type]?.label ?? selected.type },
                        { label: "Urgency",    value: selected.urgency.toUpperCase(), cls: URGENCY_CFG[selected.urgency] },
                        { label: "Assigned To",value: selected.assigned_to || "—" },
                        { label: "Department", value: selected.assigned_department || "—" },
                      ].map(f => (
                        <div key={f.label} className="rounded-lg bg-white/5 p-2">
                          <p className="text-muted-foreground">{f.label}</p>
                          <p className={`font-semibold text-foreground mt-0.5 ${f.cls ?? ""}`}>{f.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Body */}
                    <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed border-t border-white/5 pt-3">
                      {selected.body}
                    </div>

                    {/* SLA info */}
                    {selected.requires_response && !selected.responded_at && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px]">
                        <Clock size={10} className="text-amber-400 flex-shrink-0" />
                        <span className="text-amber-400 font-semibold">
                          Response required within {slaHours(selected.type)}h of receipt —
                          {slaStatus(selected) === "breach" ? " SLA BREACHED" : " SLA active"}
                        </span>
                      </div>
                    )}
                    {selected.responded_at && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] text-emerald-400">
                        <CheckCircle2 size={10} />
                        <span>First responded {fmtDateTime(selected.responded_at)}</span>
                      </div>
                    )}

                    {/* Review score if given */}
                    {selected.review_score !== null && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px]">
                        <Star size={10} className="text-amber-400" />
                        <span className="text-amber-400 font-semibold">End-user review: {selected.review_score.toFixed(1)} / 5</span>
                        {selected.was_reported && <span className="text-red-400 font-semibold ml-2">⚠️ Entity reported</span>}
                      </div>
                    )}

                    {/* Geo coords for emergency */}
                    {selected.type === "emergency" && selected.geo_lat && selected.geo_lng && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] text-red-400 mb-2">
                          <MapPin size={10} />
                          <span className="font-semibold">Emergency Location: {selected.geo_address || `${selected.geo_lat.toFixed(4)}, ${selected.geo_lng.toFixed(4)}`}</span>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-[10px] text-red-300">
                          <p><strong>Lat:</strong> {selected.geo_lat.toFixed(6)}</p>
                          <p><strong>Lng:</strong> {selected.geo_lng.toFixed(6)}</p>
                          <a
                            href={`https://www.google.com/maps?q=${selected.geo_lat},${selected.geo_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-red-400 hover:text-red-300 mt-1 font-semibold"
                          >
                            <ExternalLink size={9} /> Open in Google Maps
                          </a>
                        </div>
                        <button
                          onClick={() => navigate(`/emergency-log`)}
                          className="mt-2 text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <ChevronRight size={10} /> Record outcome in Emergency Log
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Response thread */}
                {responses.map(r => (
                  <div
                    key={r.id}
                    className={`rounded-2xl p-4 border ${r.is_internal ? "bg-amber-500/5 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                        {r.responder_name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{r.responder_name}</p>
                        <p className="text-[9px] text-muted-foreground">{r.responder_role} · {r.responder_department} · {r.channel} · {fmtDateTime(r.created_at)}</p>
                      </div>
                      {r.is_internal && <span className="ml-auto text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">Internal Note</span>}
                    </div>
                    <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">{r.body}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Reply box */}
          {selected && selected.status !== "resolved" && selected.status !== "closed" && (
            <div className="flex-shrink-0 border-t border-border bg-[hsl(218,30%,10%)] p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <input
                  value={replyName}
                  onChange={e => setReplyName(e.target.value)}
                  placeholder="Your name"
                  className="px-2.5 py-1.5 text-[11px] bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground focus:outline-none focus:border-blue-500"
                />
                <input
                  value={replyRole}
                  onChange={e => setReplyRole(e.target.value)}
                  placeholder="Your role"
                  className="px-2.5 py-1.5 text-[11px] bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground focus:outline-none focus:border-blue-500"
                />
                <select
                  value={replyChannel}
                  onChange={e => setReplyChannel(e.target.value)}
                  className="px-2.5 py-1.5 text-[11px] bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground focus:outline-none"
                >
                  <option value="portal">Portal</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
                <label className="flex items-center gap-2 px-2 text-[10px] text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={replyInternal}
                    onChange={e => setReplyInternal(e.target.checked)}
                    className="rounded"
                  />
                  Internal note
                </label>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder={replyInternal ? "Write an internal note (not visible to end-user)…" : `Reply to ${selected.contact_name || "end-user"}…`}
                  rows={3}
                  className="flex-1 px-3 py-2 text-xs bg-[hsl(218,25%,14%)] border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 resize-none"
                />
                <button
                  onClick={handleReply}
                  disabled={replySaving || !replyBody.trim()}
                  className="self-end flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  <Send size={13} /> {replySaving ? "Sending…" : "Send"}
                </button>
              </div>
              {replyMsg && (
                <p className={`text-[10px] mt-1.5 font-semibold ${replyMsg.includes("success") ? "text-emerald-400" : "text-red-400"}`}>{replyMsg}</p>
              )}
            </div>
          )}
          {selected?.status === "resolved" && (
            <div className="flex-shrink-0 border-t border-border bg-[hsl(218,30%,10%)] p-4">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 size={14} />
                <span className="font-semibold">Inquiry resolved {fmtDateTime(selected.resolved_at)}</span>
                <button
                  onClick={() => handleStatusUpdate("in_progress")}
                  className="ml-auto text-[10px] text-blue-400 hover:text-blue-300"
                >
                  Reopen
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-semibold">Select an inquiry to view</p>
            <p className="text-xs mt-1 opacity-60">Every inquiry must receive a response</p>
          </div>
        </div>
      )}
    </div>
  );
}
