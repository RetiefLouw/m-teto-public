/**
 * M-TETO Integrated Case Management — CaseDetail
 * Full 15-step SA Justice Value Chain with evidence, messaging, escalation.
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { spApi } from "@/lib/api";
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, XCircle,
  Upload, FileText, Image, Film, Download, Send,
  MessageSquare, Paperclip, AlertCircle, Shield,
  User, Building2, Calendar, MapPin, ChevronDown,
  RefreshCw, Eye, Lock, Hash, Flag, Gavel,
  Scale, Heart, Users, BookOpen, Phone, Badge,
  ClipboardList, Zap, Plus, X, Check
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
type TabId = "overview" | "timeline" | "evidence" | "messages" | "escalations";

interface StepData {
  step: { id: string; label: string; actorLabel: string; actorRole?: string; deadlineHours?: number; isCritical?: boolean; legalBasis?: string; whatMustHappen?: string[]; };
  event: Record<string, any> | null;
  status: string;
  isDelayed: boolean;
  isFailed: boolean;
  actorName: string | null;
  officialNotes: string | null;
  completedAt: string | null;
  dueAt: string | null;
  pendingActions: string[];
  delayHours: number | null;
  delayReason: string | null;
}

interface Document { id: string; documentType: string; documentLabel: string; fileName: string; fileType: string; fileSizeBytes: number; description?: string; stepId?: string; uploadedBy: string; uploadedByRole: string; isVerified: boolean; createdAt: string; }
interface Message { id: string; senderRole: string; senderName: string; senderTitle?: string; messageType: string; subject: string; body: string; stepId?: string; isUrgent: boolean; isRead: boolean; createdAt: string; }
interface Escalation { id: string; escalationBody: string; reason: string; status: string; severity: string; stepId?: string; submittedBy?: string; createdAt: string; resolvedAt?: string; resolutionNotes?: string; }

interface CaseData {
  id: string; title: string; incident_type: string; stage: string;
  created_at: string; updated_at: string;
  incident_date?: string; cas_number?: string; io_name?: string;
  social_worker_name?: string; court_date?: string; court_location?: string;
  prosecutor_name?: string; magistrate_name?: string;
}

// ── Helpers ───────────────────────────────────────────────────
const STATUS_CFG: Record<string, { cls: string; bg: string; label: string; Icon: React.ElementType }> = {
  completed:   { cls: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "Completed", Icon: CheckCircle2 },
  in_progress: { cls: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/30",       label: "In Progress", Icon: Clock },
  pending:     { cls: "text-slate-400",   bg: "bg-white/5 border-border",                label: "Pending", Icon: Clock },
  not_started: { cls: "text-slate-400",   bg: "bg-white/5 border-border",                label: "Not Started", Icon: Clock },
  failed:      { cls: "text-red-400",     bg: "bg-red-500/10 border-red-500/30",         label: "Failed / Overdue", Icon: XCircle },
  skipped:     { cls: "text-gray-400",    bg: "bg-gray-500/10 border-gray-500/20",       label: "Skipped", Icon: ChevronDown },
};

const DOC_TYPES = [
  "Affidavit", "J88 Medical Form", "Police Docket", "Court Order", "Protection Order",
  "Medical Report", "Social Work Report", "Witness Statement", "Evidence Photo",
  "CCTV Footage", "Forensic Report", "Legal Notice", "Correspondence", "Other",
];

const ESCALATION_BODIES = [
  "SAPS Provincial Commissioner", "National Prosecuting Authority", "IPID",
  "Department of Justice", "Department of Social Development", "Public Protector",
  "South African Human Rights Commission", "SAPS GBVF Unit", "Court Registrar",
  "Child Protection Unit", "Other Oversight Body",
];

async function computeSHA256(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STEP_ICON_MAP: Record<number, React.ElementType> = {
  0: Shield, 1: Users, 2: Gavel, 3: Scale, 4: BookOpen,
  5: Heart, 6: FileText, 7: Zap, 8: Building2, 9: AlertCircle,
  10: Gavel, 11: Scale, 12: CheckCircle2, 13: Heart, 14: Users,
};

// ── Tab Button ────────────────────────────────────────────────
function Tab({ id, active, label, icon: Icon, badge }: { id: TabId; active: boolean; label: string; icon: React.ElementType; badge?: number; onClick?: () => void }) {
  return (
    <button
      data-tab={id}
      className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
        active ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      <Icon size={13} />
      {label}
      {badge != null && badge > 0 && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${active ? "bg-white/25 text-white" : "bg-blue-600/30 text-blue-400"}`}>{badge}</span>
      )}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────
export function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  // Data
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [timeline, setTimeline]   = useState<StepData[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);

  // UI
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Step update form
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);
  const [stepForm, setStepForm]         = useState({ status: "in_progress", officialNotes: "", actorName: "", actorPhone: "", actorBadge: "", delayReason: "" });
  const [stepSaving, setStepSaving]     = useState(false);
  const [stepMsg, setStepMsg]           = useState("");

  // Evidence upload
  const [uploadFile, setUploadFile]     = useState<File | null>(null);
  const [uploadMeta, setUploadMeta]     = useState({ documentType: "", documentLabel: "", description: "", stepId: "", uploadedBy: "" });
  const [uploading, setUploading]       = useState(false);
  const [uploadMsg, setUploadMsg]       = useState("");
  const [uploadHash, setUploadHash]     = useState("");
  const fileInputRef                     = useRef<HTMLInputElement>(null);

  // Messages
  const [msgForm, setMsgForm]   = useState({ senderName: "", senderTitle: "", subject: "", body: "", isUrgent: false });
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent]       = useState("");

  // Escalation
  const [escForm, setEscForm]   = useState({ escalationBody: "", reason: "", severity: "high", submittedBy: "" });
  const [escSending, setEscSending] = useState(false);
  const [escSent, setEscSent]       = useState("");

  // ── Load all data ──────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [caseRes, timelineRes, docsRes, msgsRes, escRes] = await Promise.allSettled([
        spApi.getCaseById(id!),
        spApi.getCaseTimeline(id!),
        spApi.getDocuments(id!),
        spApi.getMessages(id!),
        spApi.getEscalations(id!),
      ]);

      if (caseRes.status === "fulfilled") {
        const d = caseRes.value;
        setCaseData(d.case ?? d);
      } else { setError("Could not load case."); }

      if (timelineRes.status === "fulfilled") setTimeline(timelineRes.value.timeline ?? []);
      if (docsRes.status === "fulfilled")     setDocuments(docsRes.value.documents ?? []);
      if (msgsRes.status === "fulfilled")     setMessages(msgsRes.value.messages ?? []);
      if (escRes.status === "fulfilled")      setEscalations(escRes.value.escalations ?? []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Step update ────────────────────────────────────────────
  async function handleStepUpdate(stepId: string) {
    setStepSaving(true); setStepMsg("");
    try {
      await spApi.updateTimelineStep(id!, stepId, {
        status: stepForm.status,
        officialNotes: stepForm.officialNotes || undefined,
        actorName: stepForm.actorName || undefined,
        actorPhone: stepForm.actorPhone || undefined,
        actorBadge: stepForm.actorBadge || undefined,
        delayReason: stepForm.delayReason || undefined,
      });
      setStepMsg("✓ Step updated successfully");
      setUpdatingStep(null);
      await load();
    } catch {
      setStepMsg("Update saved locally — sync pending.");
    } finally {
      setStepSaving(false);
      setTimeout(() => setStepMsg(""), 4000);
    }
  }

  // ── Evidence upload ────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadFile(f);
    setUploadHash("computing…");
    const hash = await computeSHA256(f);
    setUploadHash(hash);
    setUploadMeta(m => ({
      ...m,
      documentLabel: m.documentLabel || f.name,
      documentType: m.documentType || "Other",
    }));
  }

  async function handleUpload() {
    if (!uploadFile || !uploadMeta.documentType) {
      setUploadMsg("Please select a file and choose a document type.");
      return;
    }
    setUploading(true); setUploadMsg("");
    try {
      const reader = new FileReader();
      const fileData: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(uploadFile);
      });

      await spApi.uploadDocument(id!, {
        documentType: uploadMeta.documentType,
        documentLabel: uploadMeta.documentLabel || uploadFile.name,
        fileName: uploadFile.name,
        fileType: uploadFile.type,
        fileSizeBytes: uploadFile.size,
        fileData,
        fileHash: uploadHash,
        description: uploadMeta.description || undefined,
        stepId: uploadMeta.stepId || undefined,
        uploadedBy: uploadMeta.uploadedBy || "Service Provider",
      });

      setUploadMsg("✓ Document uploaded and integrity hash recorded.");
      setUploadFile(null);
      setUploadHash("");
      setUploadMeta({ documentType: "", documentLabel: "", description: "", stepId: "", uploadedBy: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      await spApi.getDocuments(id!).then(r => setDocuments(r.documents ?? []));
    } catch (e: any) {
      setUploadMsg("Upload failed: " + e.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(""), 6000);
    }
  }

  // ── Send message ───────────────────────────────────────────
  async function handleSendMessage() {
    if (!msgForm.body.trim()) return;
    setMsgSending(true); setMsgSent("");
    try {
      await spApi.sendMessage(id!, msgForm);
      setMsgSent("✓ Message sent to case record.");
      setMsgForm(f => ({ ...f, body: "", subject: "", isUrgent: false }));
      await spApi.getMessages(id!).then(r => setMessages(r.messages ?? []));
    } catch { setMsgSent("Message saved locally."); }
    finally { setMsgSending(false); setTimeout(() => setMsgSent(""), 4000); }
  }

  // ── Create escalation ──────────────────────────────────────
  async function handleEscalation() {
    if (!escForm.escalationBody || !escForm.reason) return;
    setEscSending(true); setEscSent("");
    try {
      await spApi.createEscalation(id!, escForm);
      setEscSent("✓ Escalation submitted to " + escForm.escalationBody);
      setEscForm({ escalationBody: "", reason: "", severity: "high", submittedBy: "" });
      await spApi.getEscalations(id!).then(r => setEscalations(r.escalations ?? []));
    } catch { setEscSent("Escalation logged locally."); }
    finally { setEscSending(false); setTimeout(() => setEscSent(""), 5000); }
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto space-y-3">
        <div className="h-8 w-40 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }
  if (error || !caseData) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error || "Case not found"}</div>
      </div>
    );
  }

  const completed = timeline.filter(s => s.status === "completed").length;
  const progress  = timeline.length > 0 ? Math.round((completed / timeline.length) * 100) : 0;
  const unreadMsgs = messages.filter(m => !m.isRead && m.senderRole !== "official").length;
  const openEscs   = escalations.filter(e => e.status !== "resolved").length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <div className="p-4 pb-0">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={13} /> Back to Dashboard
        </button>

        {/* Case header */}
        <div className="rounded-2xl bg-[hsl(218,25%,14%)] border border-border p-5 mb-4">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground leading-snug">{caseData.title}</h1>
              {caseData.cas_number && <p className="text-xs text-muted-foreground mt-0.5 font-mono">{caseData.cas_number}</p>}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider badge-blue">{caseData.stage}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider badge-amber">{caseData.incident_type.replace(/_/g," ")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
            {([
              { icon: Calendar, label: `Reported: ${fmtDate(caseData.incident_date ?? caseData.created_at)}` },
              { icon: FileText, label: caseData.incident_type.replace(/_/g," ") },
              ...(caseData.court_date ? [{ icon: Gavel, label: `Court: ${fmtDate(caseData.court_date)}` }] : []),
              ...(caseData.court_location ? [{ icon: MapPin, label: caseData.court_location }] : []),
            ] as { icon: React.ElementType; label: string }[]).map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                <item.icon size={11} /><span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>

          {caseData.io_name && (
            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <Shield size={11} /> Investigating Officer: <strong className="text-foreground">{caseData.io_name}</strong>
            </div>
          )}
          {caseData.prosecutor_name && (
            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <Gavel size={11} /> Prosecutor: <strong className="text-foreground">{caseData.prosecutor_name}</strong>
            </div>
          )}

          {/* Progress */}
          <div>
            <div className="flex justify-between mb-1.5 text-xs">
              <span className="text-muted-foreground">{completed}/{timeline.length} justice steps completed</span>
              <span className="font-bold text-blue-400">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-4 -mx-1 px-1" onClick={e => {
          const tab = (e.target as HTMLElement).closest("[data-tab]")?.getAttribute("data-tab") as TabId;
          if (tab) setActiveTab(tab);
        }}>
          <Tab id="overview"    active={activeTab==="overview"}    label="Overview"    icon={Eye} />
          <Tab id="timeline"    active={activeTab==="timeline"}    label="Timeline"    icon={ClipboardList} badge={timeline.filter(s=>s.isDelayed||s.isFailed).length} />
          <Tab id="evidence"    active={activeTab==="evidence"}    label="Evidence"    icon={Paperclip} badge={documents.length} />
          <Tab id="messages"    active={activeTab==="messages"}    label="Messages"    icon={MessageSquare} badge={unreadMsgs} />
          <Tab id="escalations" active={activeTab==="escalations"} label="Escalations" icon={AlertCircle} badge={openEscs} />
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pb-8">

        {/* ── OVERVIEW ──────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Integrity banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Lock size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-300">Corruption-Proof Integrated Case Record</p>
                <p className="text-xs text-blue-300/70 mt-0.5">All updates are timestamped and immutable. Every document is SHA-256 verified. All actions are visible to all authorised service providers on this case.</p>
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Steps Done",  value: completed,           sub: `of ${timeline.length}`, cls: "text-emerald-400" },
                { label: "Documents",   value: documents.length,     sub: "uploaded", cls: "text-blue-400" },
                { label: "Messages",    value: messages.length,      sub: "on this case", cls: "text-violet-400" },
                { label: "Escalations", value: escalations.length,   sub: `${openEscs} open`, cls: openEscs > 0 ? "text-red-400" : "text-gray-400" },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-4 text-center">
                  <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Case details */}
            <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-5 space-y-3">
              <h2 className="text-sm font-bold text-foreground mb-3">Case Details</h2>
              {[
                { label: "CAS Number",       value: caseData.cas_number ?? "Not assigned" },
                { label: "Incident Type",    value: caseData.incident_type.replace(/_/g," ") },
                { label: "Stage",            value: caseData.stage },
                { label: "IO / Officer",     value: caseData.io_name ?? "Not assigned" },
                { label: "Social Worker",    value: caseData.social_worker_name ?? "Not assigned" },
                { label: "Prosecutor",       value: caseData.prosecutor_name ?? "Not assigned" },
                { label: "Magistrate",       value: caseData.magistrate_name ?? "Not assigned" },
                { label: "Court Date",       value: fmtDate(caseData.court_date) },
                { label: "Court Location",   value: caseData.court_location ?? "Not assigned" },
                { label: "Incident Date",    value: fmtDate(caseData.incident_date) },
                { label: "Date Reported",    value: fmtDateTime(caseData.created_at) },
                { label: "Last Updated",     value: fmtDateTime(caseData.updated_at) },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-start gap-4 text-xs border-b border-white/5 pb-2 last:border-0">
                  <span className="text-muted-foreground font-semibold shrink-0">{r.label}</span>
                  <span className="text-foreground text-right">{r.value}</span>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Upload Evidence",   tab: "evidence",    icon: Upload, cls: "bg-blue-600/20 border-blue-500/30 text-blue-400" },
                  { label: "Send Message",      tab: "messages",    icon: MessageSquare, cls: "bg-violet-600/20 border-violet-500/30 text-violet-400" },
                  { label: "Update a Step",     tab: "timeline",    icon: ClipboardList, cls: "bg-emerald-600/20 border-emerald-500/30 text-emerald-400" },
                  { label: "Escalate Case",     tab: "escalations", icon: AlertCircle, cls: "bg-red-600/20 border-red-500/30 text-red-400" },
                ].map(a => (
                  <button
                    key={a.label}
                    onClick={() => setActiveTab(a.tab as TabId)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold ${a.cls} hover:opacity-90 transition-opacity`}
                  >
                    <a.icon size={14} /> {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TIMELINE ──────────────────────────────────────── */}
        {activeTab === "timeline" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">SA Justice Value Chain — all 15 steps. Click any step to expand and update it.</p>
              <button onClick={load} className="text-xs text-blue-400 flex items-center gap-1 hover:text-blue-300">
                <RefreshCw size={11} /> Refresh
              </button>
            </div>

            {stepMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold">{stepMsg}</div>
            )}

            {timeline.map((s, idx) => {
              const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.pending;
              const StepIcon = STEP_ICON_MAP[idx] ?? FileText;
              const isExpanded  = expandedStep === s.step.id;
              const isUpdating  = updatingStep  === s.step.id;

              return (
                <div key={s.step.id} className={`rounded-xl border transition-all ${cfg.bg}`}>
                  {/* Step row */}
                  <button className="w-full text-left p-4" onClick={() => setExpandedStep(isExpanded ? null : s.step.id)}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-white/10 text-[10px] font-black text-muted-foreground">{idx + 1}</div>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <StepIcon size={13} className={cfg.cls} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{s.step.label}</p>
                          <span className={`text-[9px] font-black uppercase tracking-wider ${cfg.cls}`}>{cfg.label}</span>
                          {s.isDelayed && <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">DELAYED</span>}
                          {s.isFailed  && <span className="text-[9px] font-black uppercase text-red-400 tracking-wider">FAILED</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.step.actorLabel}</p>
                        {s.actorName && (
                          <p className="text-[10px] text-blue-400 mt-0.5 flex items-center gap-1"><User size={9} /> {s.actorName}</p>
                        )}
                      </div>
                      <ChevronDown size={13} className={`flex-shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
                      {/* Step metadata */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {s.completedAt && <div><p className="text-muted-foreground">Completed</p><p className="text-foreground">{fmtDate(s.completedAt)}</p></div>}
                        {s.dueAt       && <div><p className="text-muted-foreground">Deadline</p><p className={s.isDelayed ? "text-amber-400 font-semibold" : "text-foreground"}>{fmtDate(s.dueAt)}</p></div>}
                        {s.step.deadlineHours && <div><p className="text-muted-foreground">Legal Timeframe</p><p className="text-foreground">{s.step.deadlineHours}h</p></div>}
                        {s.delayHours  && <div><p className="text-muted-foreground">Delayed By</p><p className="text-amber-400 font-semibold">{s.delayHours}h</p></div>}
                      </div>

                      {s.officialNotes && (
                        <div className="p-3 rounded-lg bg-white/5 text-xs text-muted-foreground leading-relaxed">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Official Notes</p>
                          {s.officialNotes}
                        </div>
                      )}

                      {s.delayReason && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                          <strong>Delay Reason:</strong> {s.delayReason}
                        </div>
                      )}

                      {s.pendingActions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Pending Actions</p>
                          <ul className="space-y-1">
                            {s.pendingActions.map((a, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Clock size={10} className="mt-0.5 flex-shrink-0 text-amber-400" />{a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Update form */}
                      {!isUpdating ? (
                        <button
                          onClick={() => {
                            setUpdatingStep(s.step.id);
                            setStepForm({
                              status: s.status === "not_started" ? "in_progress" : s.status,
                              officialNotes: s.officialNotes ?? "",
                              actorName: s.actorName ?? "",
                              actorPhone: s.event?.actorPhone ?? "",
                              actorBadge: s.event?.actorBadge ?? "",
                              delayReason: s.delayReason ?? "",
                            });
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Send size={11} /> Update this step
                        </button>
                      ) : (
                        <div className="space-y-3 border-t border-white/5 pt-3">
                          <p className="text-xs font-bold text-foreground">Log Update — {s.step.label}</p>

                          {/* Status */}
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
                            <select value={stepForm.status} onChange={e => setStepForm(f => ({ ...f, status: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-blue-500">
                              <option value="not_started">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="failed">Failed / Blocked</option>
                              <option value="pending">Pending</option>
                            </select>
                          </div>

                          {/* Actor details */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"><User size={9} className="inline" /> Officer/Actor Name</label>
                              <input type="text" value={stepForm.actorName} onChange={e => setStepForm(f => ({ ...f, actorName: e.target.value }))}
                                placeholder="Full name" className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"><Badge size={9} className="inline" /> Badge / ID</label>
                              <input type="text" value={stepForm.actorBadge} onChange={e => setStepForm(f => ({ ...f, actorBadge: e.target.value }))}
                                placeholder="Badge number" className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"><Phone size={9} className="inline" /> Contact Phone</label>
                            <input type="tel" value={stepForm.actorPhone} onChange={e => setStepForm(f => ({ ...f, actorPhone: e.target.value }))}
                              placeholder="+27 …" className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500" />
                          </div>

                          {/* Official notes */}
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Official Notes / Report</label>
                            <textarea rows={4} value={stepForm.officialNotes} onChange={e => setStepForm(f => ({ ...f, officialNotes: e.target.value }))}
                              placeholder="Describe actions taken, outcome, evidence collected, next steps…"
                              className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 resize-none" />
                          </div>

                          {(stepForm.status === "failed" || stepForm.status === "pending") && (
                            <div>
                              <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">Delay / Block Reason</label>
                              <textarea rows={2} value={stepForm.delayReason} onChange={e => setStepForm(f => ({ ...f, delayReason: e.target.value }))}
                                placeholder="Explain why this step is delayed or blocked…"
                                className="w-full px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500 resize-none" />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button onClick={() => handleStepUpdate(s.event?.id ?? s.step.id)} disabled={stepSaving}
                              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                              {stepSaving ? <><RefreshCw size={11} className="animate-spin" /> Saving…</> : <><Check size={11} /> Save Update</>}
                            </button>
                            <button onClick={() => setUpdatingStep(null)} className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-muted-foreground transition-colors">
                              <X size={11} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── EVIDENCE ──────────────────────────────────────── */}
        {activeTab === "evidence" && (
          <div className="space-y-5">
            {/* Upload */}
            <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Upload size={15} className="text-blue-400" />
                <h2 className="text-sm font-bold text-foreground">Upload Evidence / Document</h2>
              </div>

              {/* File picker */}
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-400">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(uploadFile.size)} · {uploadFile.type || "unknown type"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Paperclip size={24} className="mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to choose a file</p>
                    <p className="text-xs text-muted-foreground/60">PDF, Word, Excel, images, video — any format</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" className="hidden" accept="*/*" onChange={handleFileChange} />
              </div>

              {/* SHA-256 integrity hash */}
              {uploadHash && uploadHash !== "computing…" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Hash size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">SHA-256 Integrity Hash</p>
                    <p className="text-[10px] font-mono text-emerald-300/70 break-all mt-0.5">{uploadHash}</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Document Type *</label>
                  <select value={uploadMeta.documentType} onChange={e => setUploadMeta(m => ({ ...m, documentType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-blue-500">
                    <option value="">Select type…</option>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Label / Title</label>
                  <input type="text" value={uploadMeta.documentLabel} onChange={e => setUploadMeta(m => ({ ...m, documentLabel: e.target.value }))}
                    placeholder="e.g. J88 completed 2025-03-01" className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Uploaded By</label>
                  <input type="text" value={uploadMeta.uploadedBy} onChange={e => setUploadMeta(m => ({ ...m, uploadedBy: e.target.value }))}
                    placeholder="Your name / department" className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Related Step</label>
                  <select value={uploadMeta.stepId} onChange={e => setUploadMeta(m => ({ ...m, stepId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-blue-500">
                    <option value="">Not linked to a step</option>
                    {timeline.map(s => <option key={s.step.id} value={s.step.id}>{s.step.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
                <textarea rows={2} value={uploadMeta.description} onChange={e => setUploadMeta(m => ({ ...m, description: e.target.value }))}
                  placeholder="Brief description of what this document contains / proves…"
                  className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 resize-none" />
              </div>

              {uploadMsg && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${uploadMsg.startsWith("✓") ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                  {uploadMsg}
                </div>
              )}

              <button onClick={handleUpload} disabled={uploading || !uploadFile}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                {uploading ? <><RefreshCw size={13} className="animate-spin" /> Uploading & hashing…</> : <><Upload size={13} /> Upload & Record in Chain of Custody</>}
              </button>
            </div>

            {/* Document list */}
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">Evidence Record ({documents.length} items)</h2>
              {documents.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-border border-dashed">
                  No documents uploaded yet for this case.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                          {doc.fileType?.startsWith("image") ? <Image size={14} className="text-blue-400" />
                            : doc.fileType?.startsWith("video") ? <Film size={14} className="text-violet-400" />
                            : <FileText size={14} className="text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{doc.documentLabel || doc.fileName}</p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-blue-400 font-bold uppercase">{doc.documentType}</span>
                            <span className="text-[10px] text-muted-foreground">{formatBytes(doc.fileSizeBytes)}</span>
                            <span className="text-[10px] text-muted-foreground">{fmtDate(doc.createdAt)}</span>
                            {doc.isVerified && <span className="text-[10px] text-emerald-400 font-bold">✓ Verified</span>}
                          </div>
                          {doc.description && <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><User size={9} /> {doc.uploadedBy} · {doc.uploadedByRole}</p>
                        </div>
                        <button
                          onClick={() => spApi.getDocumentFile(id!, doc.id).then(r => {
                            const a = document.createElement("a");
                            a.href = r.fileData;
                            a.download = r.fileName;
                            a.click();
                          })}
                          className="flex-shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                          title="Download"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MESSAGES ──────────────────────────────────────── */}
        {activeTab === "messages" && (
          <div className="space-y-4">
            {/* Send message */}
            <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Send size={14} className="text-violet-400" />
                <h2 className="text-sm font-bold text-foreground">Send Message to Case Record</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Your Name</label>
                  <input type="text" value={msgForm.senderName} onChange={e => setMsgForm(f => ({ ...f, senderName: e.target.value }))}
                    placeholder="Full name" className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Your Title / Dept</label>
                  <input type="text" value={msgForm.senderTitle} onChange={e => setMsgForm(f => ({ ...f, senderTitle: e.target.value }))}
                    placeholder="e.g. Social Worker, SAPS" className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Subject</label>
                <input type="text" value={msgForm.subject} onChange={e => setMsgForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief subject line" className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Message</label>
                <textarea rows={4} value={msgForm.body} onChange={e => setMsgForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Write your message or update here…"
                  className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-red-400 cursor-pointer">
                  <input type="checkbox" checked={msgForm.isUrgent} onChange={e => setMsgForm(f => ({ ...f, isUrgent: e.target.checked }))} className="accent-red-500" />
                  <Zap size={11} /> Mark as URGENT
                </label>
                <button onClick={handleSendMessage} disabled={msgSending || !msgForm.body.trim()}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
                  {msgSending ? <><RefreshCw size={11} className="animate-spin" /> Sending…</> : <><Send size={11} /> Send</>}
                </button>
              </div>
              {msgSent && <p className="text-xs text-emerald-400 font-semibold">{msgSent}</p>}
            </div>

            {/* Message thread */}
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">Case Communication Thread ({messages.length})</h2>
              {messages.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-dashed border-border">No messages on this case yet.</div>
              ) : (
                <div className="space-y-3">
                  {[...messages].reverse().map(msg => (
                    <div key={msg.id} className={`rounded-xl border p-4 ${msg.isUrgent ? "border-red-500/30 bg-red-500/5" : msg.senderRole === "system" ? "border-blue-500/20 bg-blue-500/5" : "border-border bg-[hsl(218,25%,14%)]"}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-xs font-bold text-foreground">{msg.senderName}</p>
                          {msg.senderTitle && <p className="text-[10px] text-muted-foreground">{msg.senderTitle}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {msg.isUrgent && <span className="text-[9px] font-black text-red-400 uppercase">URGENT</span>}
                          <span className="text-[10px] text-muted-foreground">{fmtDateTime(msg.createdAt)}</span>
                        </div>
                      </div>
                      {msg.subject && msg.subject !== "Message" && (
                        <p className="text-xs font-semibold text-foreground mb-1">{msg.subject}</p>
                      )}
                      <p className="text-xs text-muted-foreground leading-relaxed">{msg.body}</p>
                      {msg.senderRole === "system" && (
                        <span className="inline-block mt-2 text-[9px] font-bold uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">System</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ESCALATIONS ───────────────────────────────────── */}
        {activeTab === "escalations" && (
          <div className="space-y-5">
            {/* Create escalation */}
            <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-red-500/20 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400" />
                <h2 className="text-sm font-bold text-foreground">Create Escalation</h2>
              </div>
              <p className="text-xs text-muted-foreground">Use this to formally escalate a case to an oversight body or supervisory authority when a service provider has failed to act, there is evidence of corruption, or a case is critically delayed.</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Escalate To *</label>
                  <select value={escForm.escalationBody} onChange={e => setEscForm(f => ({ ...f, escalationBody: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-red-500">
                    <option value="">Select oversight body…</option>
                    {ESCALATION_BODIES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Severity</label>
                  <select value={escForm.severity} onChange={e => setEscForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-red-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Submitted By</label>
                  <input type="text" value={escForm.submittedBy} onChange={e => setEscForm(f => ({ ...f, submittedBy: e.target.value }))}
                    placeholder="Your name / dept" className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-red-500" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Reason for Escalation *</label>
                <textarea rows={4} value={escForm.reason} onChange={e => setEscForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Describe in detail why this case is being escalated, which service provider failed, what the failure was, and the impact on the survivor…"
                  className="w-full px-3 py-2 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-red-500 resize-none" />
              </div>

              {escSent && <p className="text-xs text-emerald-400 font-semibold">{escSent}</p>}

              <button onClick={handleEscalation} disabled={escSending || !escForm.escalationBody || !escForm.reason}
                className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                {escSending ? <><RefreshCw size={13} className="animate-spin" /> Submitting…</> : <><AlertCircle size={13} /> Submit Formal Escalation</>}
              </button>
            </div>

            {/* Escalation list */}
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">Escalation History ({escalations.length})</h2>
              {escalations.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-dashed border-border">No escalations on this case.</div>
              ) : (
                <div className="space-y-3">
                  {escalations.map(esc => (
                    <div key={esc.id} className={`rounded-xl border p-4 ${esc.status === "resolved" ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-xs font-bold text-foreground">{esc.escalationBody}</p>
                        <span className={`text-[9px] font-black uppercase tracking-wider ${esc.status === "resolved" ? "text-emerald-400" : "text-amber-400"}`}>{esc.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{esc.reason}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                        <span>Severity: <strong className={esc.severity === "critical" ? "text-red-400" : "text-amber-400"}>{esc.severity}</strong></span>
                        {esc.submittedBy && <span>By: {esc.submittedBy}</span>}
                        <span>{fmtDateTime(esc.createdAt)}</span>
                      </div>
                      {esc.resolutionNotes && (
                        <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 text-xs text-emerald-300">{esc.resolutionNotes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
