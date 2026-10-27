/**
 * M-TETO Integrated Case Management — Dashboard
 * Multi-stakeholder case queue with real-time stats.
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { spApi } from "@/lib/api";
import {
  AlertTriangle, CheckCircle2, Clock, FolderOpen,
  RefreshCw, Search, Zap, Shield,
  FileText, Scale, Gavel, Lock, ChevronRight, AlertCircle,
  MessageSquare, Mail, Phone, AlertOctagon, Inbox,
} from "lucide-react";

type InquiryStats = {
  total?: number; open_count?: number; in_progress_count?: number; resolved_count?: number;
  emergency_count?: number; message_count?: number; email_count?: number; call_count?: number;
  critical_count?: number; urgent_count?: number; unread_count?: number;
  unresponded_count?: number; reported_count?: number;
};

// Real cases table columns + computed columns from demo-cases endpoint
type Case = {
  id: string;
  title: string;
  incident_type: string;
  stage: string;
  incident_date?: string;
  cas_number?: string;
  io_name?: string;
  social_worker_name?: string;
  court_date?: string;
  court_location?: string;
  prosecutor_name?: string;
  created_at: string;
  updated_at: string;
  // Computed by the endpoint (JOINs)
  delayed_steps?: number;
  failed_steps?: number;
  completed_steps?: number;
  in_progress_steps?: number;
  escalation_count?: number;
  current_actor_name?: string;
  current_actor_label?: string;
  current_deadline?: string;
  unread_messages?: number;
};

type Stats = {
  total_cases?: number;
  open_cases?: number;
  closed_cases?: number;
  in_incident?: number;
  in_case_opened?: number;
  in_investigation?: number;
  in_court?: number;
  in_sentencing?: number;
  delayed_steps?: number;
  failed_steps?: number;
  active_steps?: number;
  completed_steps?: number;
  total_documents?: number;
  total_messages?: number;
};

const STAGE_COLORS: Record<string, string> = {
  incident: "badge-amber",
  case_opened: "badge-blue",
  investigation: "badge-blue",
  court: "badge-red",
  sentencing: "badge-green",
  closed: "badge-gray",
};

const STAGE_LABELS: Record<string, string> = {
  incident: "Incident",
  case_opened: "Case Opened",
  investigation: "Investigation",
  court: "Court",
  sentencing: "Sentencing",
  closed: "Closed",
};

const STAGE_ICONS: Record<string, React.ElementType> = {
  incident: Shield,
  case_opened: FileText,
  investigation: Search,
  court: Gavel,
  sentencing: Scale,
  closed: CheckCircle2,
};

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function getUrgency(c: Case): { label: string; cls: string } {
  const failed  = Number(c.failed_steps)  ?? 0;
  const delayed = Number(c.delayed_steps) ?? 0;
  if (failed > 0)  return { label: "Overdue",  cls: "badge-red"   };
  if (delayed > 0) return { label: "Delayed",  cls: "badge-amber" };
  if (c.stage === "closed") return { label: "Closed", cls: "badge-gray" };
  if (Number(c.in_progress_steps) > 0) return { label: "Active", cls: "badge-blue" };
  return { label: "On Track", cls: "badge-green" };
}

export function Dashboard() {
  const [cases, setCases]           = useState<Case[]>([]);
  const [stats, setStats]           = useState<Stats>({});
  const [inquiryStats, setInquiryStats] = useState<InquiryStats>({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [filter, setFilter]         = useState<"all" | "urgent" | "active" | "closed">("all");
  const [search, setSearch]         = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [, navigate] = useLocation();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [casesRes, statsRes, inquiryRes] = await Promise.allSettled([
        spApi.getDemoCases({ limit: "200" }),
        spApi.getStats(),
        spApi.getInquiryStats(),
      ]);
      if (casesRes.status === "fulfilled") setCases(casesRes.value.cases ?? []);
      else setError("Could not load cases.");
      if (statsRes.status === "fulfilled") setStats(statsRes.value ?? {});
      if (inquiryRes.status === "fulfilled") setInquiryStats(inquiryRes.value ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const urgent = cases.filter(c => Number(c.failed_steps) > 0 || Number(c.delayed_steps) > 0);

  const filtered = cases
    .filter(c => {
      if (filter === "urgent")  return Number(c.failed_steps) > 0 || Number(c.delayed_steps) > 0;
      if (filter === "active")  return c.stage !== "closed";
      if (filter === "closed")  return c.stage === "closed";
      return true;
    })
    .filter(c => !stageFilter || c.stage === stageFilter)
    .filter(c =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.cas_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
      c.incident_type.toLowerCase().includes(search.toLowerCase()) ||
      (c.io_name ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      // Sort: overdue > delayed > active > on-track > closed
      const score = (c: Case) =>
        Number(c.failed_steps) > 0 ? 0 :
        Number(c.delayed_steps) > 0 ? 1 :
        c.stage !== "closed" ? 2 : 3;
      return score(a) - score(b);
    });

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-5xl mx-auto">
        <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
        </div>
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-black text-foreground">Case Management Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Integrated multi-stakeholder oversight · {cases.length} total cases</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-muted-foreground transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Integrity notice */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/8 border border-blue-500/15">
        <Lock size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-blue-300/80">All case updates, evidence and communications are timestamped, immutable and visible to all authorised service providers. Corruption-proof audit trail active.</p>
      </div>

      {/* Urgent alert */}
      {urgent.length > 0 && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-red-400" />
            <p className="text-sm font-bold text-red-300">{urgent.length} case{urgent.length !== 1 ? "s" : ""} require immediate attention</p>
          </div>
          <div className="space-y-1.5">
            {urgent.slice(0, 3).map(c => (
              <button key={c.id} onClick={() => navigate(`/cases/${c.id}`)}
                className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs text-foreground truncate">{c.title}</p>
                  {c.cas_number && <p className="text-[10px] text-muted-foreground font-mono">{c.cas_number}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {Number(c.failed_steps) > 0  && <span className="text-[9px] font-black text-red-400 uppercase">OVERDUE</span>}
                  {Number(c.delayed_steps) > 0 && <span className="text-[9px] font-black text-amber-400 uppercase">DELAYED</span>}
                  <ChevronRight size={12} className="text-muted-foreground" />
                </div>
              </button>
            ))}
            {urgent.length > 3 && (
              <button onClick={() => setFilter("urgent")} className="text-xs text-red-400 hover:text-red-300 pl-3">
                + {urgent.length - 3} more — view all urgent
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inquiry alert banner */}
      {Number(inquiryStats.unresponded_count) > 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Inbox size={14} className="text-amber-400" />
            <p className="text-sm font-bold text-amber-300">
              {inquiryStats.unresponded_count} inquiry{Number(inquiryStats.unresponded_count) !== 1 ? "ies" : ""} awaiting response
            </p>
            <button onClick={() => navigate("/inbox")} className="ml-auto text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold">
              Open Inbox <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { icon: MessageSquare, label: "Messages",  value: inquiryStats.message_count   ?? 0, cls: "text-blue-400"   },
              { icon: Mail,          label: "Emails",    value: inquiryStats.email_count     ?? 0, cls: "text-violet-400" },
              { icon: Phone,         label: "Calls",     value: inquiryStats.call_count      ?? 0, cls: "text-emerald-400"},
              { icon: AlertOctagon,  label: "Emergency", value: inquiryStats.emergency_count ?? 0, cls: "text-red-400"    },
            ].map(s => (
              <button key={s.label} onClick={() => navigate("/inbox")}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <s.icon size={12} className={s.cls} />
                <div className="text-left">
                  <p className={`font-black text-sm ${s.cls}`}>{s.value}</p>
                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                </div>
              </button>
            ))}
          </div>
          {Number(inquiryStats.reported_count) > 0 && (
            <p className="mt-2 text-[10px] text-red-400 font-semibold flex items-center gap-1.5">
              <AlertOctagon size={10} /> {inquiryStats.reported_count} entities reported for non-response — requires urgent action
            </p>
          )}
        </div>
      )}

      {/* Emergency pending outcomes */}
      {Number(inquiryStats.emergency_count) > 0 && (
        <div className="rounded-xl bg-red-500/8 border border-red-500/20 p-3 flex items-center gap-3">
          <AlertOctagon size={14} className="text-red-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-red-300">{inquiryStats.emergency_count} emergency panic button event{Number(inquiryStats.emergency_count) !== 1 ? "s" : ""} logged</p>
            <p className="text-[10px] text-muted-foreground">Record outcomes for all emergency events in the Emergency Log</p>
          </div>
          <button onClick={() => navigate("/emergency-log")} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold flex-shrink-0">
            View Log <ChevronRight size={11} />
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Cases",    value: stats.total_cases ?? cases.length, icon: FolderOpen,    cls: "text-blue-400",    desc: `${stats.open_cases ?? 0} open` },
          { label: "Overdue Steps",  value: stats.failed_steps ?? 0,           icon: AlertTriangle, cls: "text-red-400",     desc: `${stats.delayed_steps ?? 0} delayed` },
          { label: "Active Steps",   value: stats.active_steps ?? 0,           icon: Clock,         cls: "text-amber-400",   desc: "in progress now" },
          { label: "Documents",      value: stats.total_documents ?? 0,        icon: FileText,      cls: "text-emerald-400", desc: `${stats.total_messages ?? 0} messages` },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <s.icon size={16} className={s.cls} />
              <p className={`text-2xl font-black ${s.cls}`}>{String(s.value)}</p>
            </div>
            <p className="text-xs font-bold text-foreground">{s.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Stage breakdown */}
      <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Cases by Justice Stage</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { key: "incident",      label: "Incident",     statsKey: "in_incident",      icon: Shield       },
            { key: "case_opened",   label: "Case Opened",  statsKey: "in_case_opened",   icon: FileText     },
            { key: "investigation", label: "Investigation", statsKey: "in_investigation", icon: AlertCircle  },
            { key: "court",         label: "Court",         statsKey: "in_court",         icon: Gavel        },
            { key: "sentencing",    label: "Sentencing",    statsKey: "in_sentencing",    icon: Scale        },
            { key: "closed",        label: "Closed",        statsKey: "closed_cases",     icon: CheckCircle2 },
          ].map(s => {
            const val = (stats as Record<string, number>)[s.statsKey] ?? cases.filter(c => c.stage === s.key).length;
            const active = stageFilter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setStageFilter(active ? "" : s.key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center ${active ? "border-blue-500/50 bg-blue-500/10" : "border-border hover:bg-white/5"}`}
              >
                <s.icon size={14} className="text-muted-foreground" />
                <p className="text-sm font-black text-foreground">{val}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{s.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, CAS number, IO name, incident type…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[hsl(218,25%,14%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: "all",    label: `All (${cases.length})` },
            { id: "urgent", label: `Urgent (${urgent.length})` },
            { id: "active", label: "Active" },
            { id: "closed", label: "Closed" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filter === f.id ? "bg-blue-600 text-white" : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"}`}
            >
              {f.label}
            </button>
          ))}
          {stageFilter && (
            <button onClick={() => setStageFilter("")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Stage: {STAGE_LABELS[stageFilter] ?? stageFilter} ✕
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      {/* Case list */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{filtered.length} case{filtered.length !== 1 ? "s" : ""} shown</p>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm rounded-xl border border-dashed border-border">
            No cases match your filters.
          </div>
        ) : (
          filtered.map(c => {
            const urg = getUrgency(c);
            const StageIcon = STAGE_ICONS[c.stage] ?? FolderOpen;
            const totalSteps = Number(c.completed_steps ?? 0) + Number(c.in_progress_steps ?? 0) + 10;
            const progress = Math.min(Math.round((Number(c.completed_steps ?? 0) / Math.max(totalSteps, 1)) * 100), 100);

            return (
              <button
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="w-full text-left rounded-xl bg-[hsl(218,25%,14%)] border border-border hover:border-blue-500/40 hover:bg-[hsl(218,28%,16%)] transition-all p-4 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 flex-col">
                    <StageIcon size={15} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-foreground leading-snug pr-2">{c.title}</p>
                      <ChevronRight size={14} className="text-muted-foreground group-hover:text-blue-400 flex-shrink-0 mt-0.5 transition-colors" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${STAGE_COLORS[c.stage] ?? "badge-gray"}`}>
                        {STAGE_LABELS[c.stage] ?? c.stage}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${urg.cls}`}>{urg.label}</span>
                      {Number(c.unread_messages) > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider badge-blue">
                          {c.unread_messages} msg
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                      {c.cas_number && <span className="font-mono">{c.cas_number}</span>}
                      <span>{c.incident_type.replace(/_/g, " ")}</span>
                      {c.io_name && <span>IO: {c.io_name}</span>}
                      {c.court_date && <span>Court: {fmtDate(c.court_date)}</span>}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2.5">
                      <div className="h-1 rounded-full bg-white/10">
                        <div
                          className={`h-1 rounded-full transition-all ${
                            Number(c.failed_steps) > 0 ? "bg-red-500" :
                            Number(c.delayed_steps) > 0 ? "bg-amber-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
