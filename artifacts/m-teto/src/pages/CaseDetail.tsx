import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useGetCase, useUpdateCase, useUpdateChecklist, getGetCaseQueryKey, getListCasesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Clock, AlertTriangle, ShieldCheck, User, Calendar,
  CheckCircle2, ChevronDown, ChevronUp, Phone, Camera,
  MessageSquare, Upload, Flag, AlertOctagon, ExternalLink,
  Loader2, FileText, Shield, Info, Send, Eye, X,
  MapPin, Gavel, Lock, XCircle, Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SA_JUSTICE_STEPS, ESCALATION_BODIES, type JusticeStep, type EscalationBody } from "@workspace/justice-timelines";
import { formatDistanceToNow, format, isAfter } from "date-fns";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type CaseTab = "tracking" | "documents" | "messages" | "escalations";
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
  pendingActions: string[];
}

interface CaseMessage {
  id: string;
  senderRole: string;
  senderName: string;
  senderTitle: string;
  messageType: string;
  subject: string;
  body: string;
  stepId: string | null;
  isUrgent: boolean;
  isRead: boolean;
  createdAt: string;
}

interface CaseDocument {
  id: string;
  documentType: string;
  documentLabel: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  description: string;
  stepId: string | null;
  uploadedBy: string;
  uploadedByRole: string;
  isVerified: boolean;
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

function statusConfig(status: StepStatus) {
  switch (status) {
    case "completed":
      return { color: "bg-green-500", text: "text-green-700", bg: "bg-green-50", border: "border-green-300", label: "Completed", icon: CheckCircle2 };
    case "in_progress":
      return { color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-300", label: "In Progress", icon: Clock };
    case "overdue":
      return { color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", label: "Overdue", icon: AlertTriangle };
    case "failed":
      return { color: "bg-red-600", text: "text-red-700", bg: "bg-red-50", border: "border-red-300", label: "Failed", icon: XCircle };
    case "escalated":
      return { color: "bg-red-700", text: "text-red-800", bg: "bg-red-100", border: "border-red-400", label: "Escalated", icon: Flame };
    case "skipped":
      return { color: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-50", border: "border-gray-300", label: "Skipped", icon: Info };
    default:
      return { color: "bg-gray-200", text: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", label: "Pending", icon: Clock };
  }
}

const DOC_TYPES = [
  { id: "docket", label: "Police Docket / Case File", icon: FileText },
  { id: "j88", label: "J88 Medical Form", icon: Shield },
  { id: "statement", label: "Witness / Victim Statement", icon: FileText },
  { id: "badge", label: "Official's Badge / ID", icon: User },
  { id: "evidence_photo", label: "Evidence / Scene Photo", icon: Camera },
  { id: "court_order", label: "Court Order / Warrant", icon: Gavel },
  { id: "protection_order", label: "Protection Order", icon: Lock },
  { id: "other", label: "Other Document", icon: Upload },
];

// ── Main Component ─────────────────────────────────────────────────────────

export default function CaseDetail() {
  const [, params] = useRoute("/tracker/:id");
  const id = params?.id ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [activeTab, setActiveTab] = useState<CaseTab>("tracking");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [escalations, setEscalations] = useState<CaseEscalation[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [escalateStep, setEscalateStep] = useState<JusticeStep | null>(null);
  const [escalateBody, setEscalateBody] = useState<EscalationBody>("station_commander");
  const [escalateReason, setEscalateReason] = useState("");
  const [submittingEscalation, setSubmittingEscalation] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagStep, setFlagStep] = useState<JusticeStep | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("docket");
  const [docDescription, setDocDescription] = useState("");
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: caseData, isLoading } = useGetCase(id);
  const theCase = caseData?.case;

  const updateMutation = useUpdateCase({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListCasesQueryKey() });
        toast({ title: "Saved", description: "Case details updated securely." });
      },
    },
  });

  const [formData, setFormData] = useState({ casNumber: "", ioName: "", incidentDate: "" });

  useEffect(() => {
    if (theCase) {
      setFormData({
        casNumber: theCase.casNumber ?? "",
        ioName: theCase.ioName ?? "",
        incidentDate: theCase.incidentDate ?? "",
      });
    }
  }, [theCase]);

  const fetchTimeline = useCallback(async () => {
    if (!id) return;
    setLoadingTimeline(true);
    try {
      const r = await fetch(`${BASE}/api/cases/${id}/timeline`);
      if (r.ok) {
        const d = await r.json();
        setTimeline(d.timeline ?? []);
      }
    } catch {/* ignore */}
    finally { setLoadingTimeline(false); }
  }, [id]);

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    setLoadingMessages(true);
    try {
      const r = await fetch(`${BASE}/api/cases/${id}/messages`);
      if (r.ok) {
        const d = await r.json();
        setMessages(d.messages ?? []);
      }
    } catch {/* ignore */}
    finally { setLoadingMessages(false); }
  }, [id]);

  const fetchDocuments = useCallback(async () => {
    if (!id) return;
    setLoadingDocs(true);
    try {
      const r = await fetch(`${BASE}/api/cases/${id}/documents`);
      if (r.ok) {
        const d = await r.json();
        setDocuments(d.documents ?? []);
      }
    } catch {/* ignore */}
    finally { setLoadingDocs(false); }
  }, [id]);

  const fetchEscalations = useCallback(async () => {
    if (!id) return;
    try {
      const r = await fetch(`${BASE}/api/cases/${id}/escalations`);
      if (r.ok) {
        const d = await r.json();
        setEscalations(d.escalations ?? []);
      }
    } catch {/* ignore */}
  }, [id]);

  useEffect(() => {
    if (theCase) {
      fetchTimeline();
      fetchMessages();
      fetchDocuments();
      fetchEscalations();
    }
  }, [theCase, fetchTimeline, fetchMessages, fetchDocuments, fetchEscalations]);

  // ── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    try {
      await fetch(`${BASE}/api/cases/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderRole: "complainant",
          senderName: "You / Family",
          messageType: "question",
          subject: "Question / Update Request",
          body: newMessage.trim(),
        }),
      });
      setNewMessage("");
      await fetchMessages();
      toast({ title: "Sent", description: "Your message has been recorded." });
    } catch {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    }
    setSendingMsg(false);
  };

  // ── Flag a step ───────────────────────────────────────────────────────────
  const submitFlag = async () => {
    if (!flagStep || !flagReason.trim()) return;
    try {
      await fetch(`${BASE}/api/cases/${id}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId: flagStep.id, reason: flagReason, flaggedBy: "Complainant / Family" }),
      });
      setShowFlagDialog(false);
      setFlagReason("");
      await fetchTimeline();
      await fetchMessages();
      toast({ title: "🚩 Red Flag Raised", description: "This has been documented and the responsible official notified." });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  // ── Escalate ──────────────────────────────────────────────────────────────
  const submitEscalation = async () => {
    if (!escalateStep || !escalateReason.trim()) return;
    setSubmittingEscalation(true);
    try {
      const r = await fetch(`${BASE}/api/cases/${id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escalationBody: escalateBody,
          failedStepId: escalateStep.id,
          failedStepLabel: escalateStep.label,
          reason: escalateReason,
          submittedBy: "Complainant / Family",
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const bodyInfo = d.body;
        setShowEscalateDialog(false);
        setEscalateReason("");
        await fetchEscalations();
        await fetchMessages();
        toast({
          title: `Escalated to ${bodyInfo?.label ?? "authority"}`,
          description: `Contact: ${bodyInfo?.phone ?? ""}`,
        });
      }
    } catch {
      toast({ title: "Error submitting escalation", variant: "destructive" });
    }
    setSubmittingEscalation(false);
  };

  // ── Photo / Document upload ───────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingDoc(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await fetch(`${BASE}/api/cases/${id}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentType: selectedDocType,
            documentLabel: DOC_TYPES.find(d => d.id === selectedDocType)?.label ?? selectedDocType,
            fileName: file.name,
            fileType: file.type,
            fileSizeBytes: file.size,
            fileData: base64,
            description: docDescription,
            uploadedBy: "Complainant / Family",
          }),
        });
        await fetchDocuments();
        setDocDescription("");
        toast({ title: "Document Uploaded", description: "Safely stored in your case file." });
        setUploadingDoc(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      setUploadingDoc(false);
    }
  };

  // ── Who has my file right now ─────────────────────────────────────────────
  const currentStep = timeline.find(t => t.status === "in_progress") ?? timeline.find(t => t.status === "overdue");
  const delayedSteps = timeline.filter(t => t.isDelayed && t.status !== "completed");
  const failedSteps = timeline.filter(t => t.isFailed);
  const completedCount = timeline.filter(t => t.status === "completed").length;
  const totalSteps = SA_JUSTICE_STEPS.length;

  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading your case...</p>
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
      <div className="pb-32">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-primary px-4 pt-4 pb-6 text-primary-foreground rounded-b-[36px] shadow-lg">
          <Link href="/tracker" className="inline-flex items-center text-sm font-bold text-primary-foreground/80 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>

          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-2">
              <h1 className="text-xl font-display font-bold leading-tight mb-1">{theCase.title}</h1>
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-white/20 text-white border-transparent text-[10px] font-bold">
                  {theCase.incidentType?.replace(/_/g, " ")}
                </Badge>
                {theCase.casNumber && (
                  <Badge className="bg-white/15 text-white border-transparent text-[10px] font-mono">
                    {theCase.casNumber}
                  </Badge>
                )}
              </div>
            </div>
            <div className={`rounded-full w-12 h-12 flex items-center justify-center shrink-0 text-sm font-bold ${
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
              <span>{completedCount} of {totalSteps} steps complete</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-4 bg-white/10 rounded-2xl p-1">
            {(["tracking", "documents", "messages", "escalations"] as CaseTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all capitalize ${
                  activeTab === tab ? "bg-white text-primary shadow" : "text-white/80"
                }`}
              >
                {tab === "tracking" ? "📍 Track" :
                 tab === "documents" ? "📷 Docs" :
                 tab === "messages" ? "💬 Msgs" : "🚨 Escalate"}
                {tab === "messages" && messages.filter(m => !m.isRead && m.senderRole !== "complainant").length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[8px] rounded-full px-1">
                    {messages.filter(m => !m.isRead && m.senderRole !== "complainant").length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 -mt-2 relative z-10 space-y-4 pt-4">
          <AnimatePresence mode="wait">
            {/* ── TRACKING TAB ───────────────────────────────────────────── */}
            {activeTab === "tracking" && (
              <motion.div key="tracking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                {/* Who has my file right now */}
                {currentStep && (
                  <Card className="rounded-3xl border-2 border-blue-200 bg-blue-50 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Who Has Your File Now</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 border-2 border-blue-300 flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base leading-tight">{currentStep.actorName ?? currentStep.step.actorLabel}</h3>
                          <p className="text-sm text-blue-700 font-medium">{currentStep.step.actorLabel}</p>
                          <p className="text-xs text-gray-600 mt-1 font-medium">Step: <span className="font-bold">{currentStep.step.label}</span></p>
                          {currentStep.dueAt && (
                            <p className={`text-xs font-bold mt-1 ${isAfter(new Date(), new Date(currentStep.dueAt)) ? "text-red-600" : "text-blue-600"}`}>
                              {isAfter(new Date(), new Date(currentStep.dueAt)) ? "⚠️ OVERDUE — was due " : "Due: "}
                              {formatDistanceToNow(new Date(currentStep.dueAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                      {currentStep.officialNotes && (
                        <div className="mt-3 bg-white rounded-xl p-3 border border-blue-200">
                          <p className="text-xs text-gray-600 font-medium leading-relaxed">{currentStep.officialNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Red flag warnings */}
                {(failedSteps.length > 0 || delayedSteps.length > 0) && (
                  <Card className={`rounded-3xl border-2 ${failedSteps.length > 0 ? "border-red-400 bg-red-50" : "border-amber-400 bg-amber-50"} shadow-md`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertOctagon className={`w-6 h-6 shrink-0 mt-0.5 ${failedSteps.length > 0 ? "text-red-600" : "text-amber-600"}`} />
                        <div className="flex-1">
                          <h3 className={`font-bold text-base ${failedSteps.length > 0 ? "text-red-800" : "text-amber-800"}`}>
                            {failedSteps.length > 0 ? `${failedSteps.length} Step(s) Failed — Action Required` : `${delayedSteps.length} Delayed Step(s)`}
                          </h3>
                          <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                            {failedSteps.length > 0
                              ? "One or more steps have failed. This must be escalated immediately. Use the Escalate tab to raise this with the relevant authority."
                              : "Some steps are taking longer than legally required. You can raise a red flag or escalate if needed."}
                          </p>
                          <div className="mt-2 space-y-1">
                            {[...failedSteps, ...delayedSteps.filter(s => !s.isFailed)].slice(0, 3).map(s => (
                              <div key={s.step.id} className={`text-xs rounded-xl p-2 flex items-start gap-2 ${failedSteps.includes(s) ? "bg-red-100" : "bg-amber-100"}`}>
                                <Flag className="w-3 h-3 shrink-0 mt-0.5 text-red-600" />
                                <div>
                                  <span className="font-bold">{s.step.label}</span>
                                  {s.delayReason && <span className="text-gray-600 ml-1">— {s.delayReason.substring(0, 80)}...</span>}
                                  {s.delayHours && <span className="font-bold text-red-700 ml-1">({s.delayHours}h late)</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Case key details card */}
                <Card className="rounded-3xl border border-border/60 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Key Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="cas-number" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CAS Number</Label>
                        <Input
                          id="cas-number"
                          aria-label="CAS Number (police case number)"
                          value={formData.casNumber}
                          onChange={e => setFormData(f => ({ ...f, casNumber: e.target.value }))}
                          onBlur={() => updateMutation.mutate({ id, data: { casNumber: formData.casNumber } })}
                          placeholder="e.g. CAS 0001/2025"
                          className="h-9 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="incident-date" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Incident Date</Label>
                        <Input
                          id="incident-date"
                          type="date"
                          aria-label="Date the incident occurred"
                          value={formData.incidentDate}
                          onChange={e => setFormData(f => ({ ...f, incidentDate: e.target.value }))}
                          onBlur={() => updateMutation.mutate({ id, data: { incidentDate: formData.incidentDate } })}
                          className="h-9 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="io-name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">IO Name</Label>
                      <Input
                        id="io-name"
                        aria-label="Investigating Officer name and rank"
                        value={formData.ioName}
                        onChange={e => setFormData(f => ({ ...f, ioName: e.target.value }))}
                        onBlur={() => updateMutation.mutate({ id, data: { ioName: formData.ioName } })}
                        placeholder="Officer Name / Rank"
                        className="h-9 rounded-xl text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Uber-style justice timeline */}
                <h3 className="font-display font-bold text-lg px-1">Justice Value Chain</h3>

                {loadingTimeline ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-0">
                    {timeline.map((item, idx) => {
                      const cfg = statusConfig(item.status);
                      const Icon = cfg.icon;
                      const isExpanded = expandedStep === item.step.id;
                      const isLast = idx === timeline.length - 1;
                      const escalateBodyForStep = ESCALATION_BODIES[item.step.escalateTo];

                      return (
                        <div key={item.step.id} className="flex gap-3">
                          {/* Vertical line + dot */}
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                              item.status === "completed" ? "bg-green-500 border-green-500 text-white" :
                              item.status === "in_progress" ? "bg-blue-500 border-blue-500 text-white" :
                              item.status === "overdue" ? "bg-amber-500 border-amber-500 text-white" :
                              item.status === "failed" || item.status === "escalated" ? "bg-red-600 border-red-600 text-white" :
                              "bg-gray-200 border-gray-300 text-gray-400"
                            } transition-all`}>
                              {item.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> :
                               item.status === "in_progress" ? <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> :
                               item.status === "failed" || item.status === "escalated" ? <XCircle className="w-4 h-4" /> :
                               <span className="text-[10px] font-bold">{idx + 1}</span>}
                            </div>
                            {!isLast && (
                              <div className={`w-0.5 flex-1 min-h-[24px] mt-1 ${
                                item.status === "completed" ? "bg-green-300" :
                                item.status === "in_progress" ? "bg-blue-300" :
                                "bg-gray-200"
                              }`} />
                            )}
                          </div>

                          {/* Step content */}
                          <div className={`flex-1 pb-4 ${!isLast ? "mb-0" : ""}`}>
                            <button
                              onClick={() => setExpandedStep(isExpanded ? null : item.step.id)}
                              className={`w-full text-left rounded-2xl p-3 border transition-all ${cfg.bg} ${cfg.border} ${isExpanded ? "shadow-md" : "shadow-sm"} ${item.isFailed || item.isDelayed ? "border-2" : "border"}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                      item.status === "completed" ? "bg-green-100 text-green-700" :
                                      item.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                                      item.status === "overdue" || item.isDelayed ? "bg-amber-100 text-amber-700" :
                                      item.status === "failed" || item.status === "escalated" ? "bg-red-100 text-red-700" :
                                      "bg-gray-100 text-gray-500"
                                    }`}>
                                      {item.isFailed ? "FAILED" : item.isDelayed ? "DELAYED" : cfg.label}
                                    </span>
                                    {item.step.isCritical && (
                                      <span className="text-[10px] font-bold text-red-600 uppercase">⚡ Critical</span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-sm text-gray-900 leading-tight">{item.step.label}</h4>
                                  <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                                    {item.step.actorLabel} · {item.step.deadline}
                                  </p>
                                  {item.delayHours && (
                                    <p className="text-[11px] font-bold text-red-700 mt-0.5">
                                      🚩 {item.delayHours}h behind schedule
                                    </p>
                                  )}
                                  {item.completedAt && (
                                    <p className="text-[11px] text-green-700 font-medium mt-0.5">
                                      ✓ {format(new Date(item.completedAt), "d MMM yyyy")}
                                    </p>
                                  )}
                                </div>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 mt-1" />}
                              </div>
                            </button>

                            {/* Expanded step detail */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className={`mt-2 rounded-2xl border p-4 space-y-3 bg-white ${cfg.border}`}>
                                    {/* What must happen */}
                                    <div>
                                      <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">What Must Happen</h5>
                                      <ul className="space-y-1.5">
                                        {item.step.whatMustHappen.map((w, i) => (
                                          <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                                            <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                              <span className="text-[8px] font-bold text-primary">{i + 1}</span>
                                            </div>
                                            {w}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* What you should receive */}
                                    <div>
                                      <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">What You Must Receive</h5>
                                      <ul className="space-y-1.5">
                                        {item.step.whatComplainantShouldReceive.map((w, i) => (
                                          <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                                            <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                                            {w}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* Legal basis */}
                                    <div className="bg-gray-50 rounded-xl p-3">
                                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Legal Basis</p>
                                      <p className="text-xs text-gray-700 font-medium">{item.step.legalBasis}</p>
                                    </div>

                                    {/* Official notes if present */}
                                    {item.officialNotes && (
                                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                                        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Official Update</p>
                                        <p className="text-xs text-gray-700 leading-relaxed">{item.officialNotes}</p>
                                      </div>
                                    )}

                                    {/* Delay reason if present */}
                                    {item.delayReason && (
                                      <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                                        <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Delay Reason Documented</p>
                                        <p className="text-xs text-gray-700 leading-relaxed">{item.delayReason}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                          Responsible: <span className="font-bold">{item.step.actorLabel}</span>
                                        </p>
                                      </div>
                                    )}

                                    {/* Failure consequence */}
                                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">If This Step Fails</p>
                                      <p className="text-xs text-gray-700 leading-relaxed">{item.step.failureConsequence}</p>
                                    </div>

                                    {/* Escalation target */}
                                    {escalateBodyForStep && (
                                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Escalate To</p>
                                        <p className="text-xs font-bold text-gray-900">{escalateBodyForStep.label}</p>
                                        <p className="text-xs text-gray-600">{escalateBodyForStep.forWhat}</p>
                                        <a href={`tel:${escalateBodyForStep.phone}`} className="flex items-center gap-1 mt-1.5 text-primary font-bold text-xs">
                                          <Phone className="w-3 h-3" /> {escalateBodyForStep.phone}
                                        </a>
                                      </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex gap-2 pt-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 rounded-xl text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={() => { setFlagStep(item.step); setShowFlagDialog(true); }}
                                      >
                                        <Flag className="w-3 h-3 mr-1" /> Flag Delay
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 rounded-xl text-xs font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
                                        onClick={() => { setEscalateStep(item.step); setEscalateBody(item.step.escalateTo); setShowEscalateDialog(true); }}
                                      >
                                        <AlertOctagon className="w-3 h-3 mr-1" /> Escalate
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── DOCUMENTS TAB ─────────────────────────────────────────── */}
            {activeTab === "documents" && (
              <motion.div key="documents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Upload section */}
                <Card className="rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-bold text-base">Upload Document / Photo</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Take a photo of your docket, J88 form, statements, officials' badges, or any evidence. All files are stored securely and encrypted.
                    </p>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Document Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {DOC_TYPES.map(dt => (
                          <button
                            key={dt.id}
                            onClick={() => setSelectedDocType(dt.id)}
                            className={`p-2 rounded-xl border text-left text-xs font-medium transition-all ${
                              selectedDocType === dt.id ? "border-primary bg-primary/10 text-primary font-bold" : "border-border/60 text-gray-600 hover:border-primary/30"
                            }`}
                          >
                            {dt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="doc-description" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description (optional)</Label>
                      <Input
                        id="doc-description"
                        aria-label="Document description (optional)"
                        value={docDescription}
                        onChange={e => setDocDescription(e.target.value)}
                        placeholder="e.g. J88 from Soweto TCC, 15 Jan 2025"
                        className="rounded-xl text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 rounded-xl font-bold"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingDoc}
                      >
                        {uploadingDoc ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                        Take Photo / Choose File
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      capture="environment"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                    />
                  </CardContent>
                </Card>

                {/* Document list */}
                {loadingDocs ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-sm">No documents yet</p>
                    <p className="text-xs mt-1">Upload your first document above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider px-1">Uploaded Documents ({documents.length})</h3>
                    {documents.map(doc => (
                      <Card key={doc.id} className="rounded-2xl border border-border/60 shadow-sm">
                        <CardContent className="p-3 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            {doc.fileType?.startsWith("image/") ? <Camera className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm leading-tight">{doc.documentLabel}</p>
                            <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {doc.uploadedBy} · {format(new Date(doc.createdAt), "d MMM yyyy")}
                              {doc.isVerified && <span className="ml-1 text-green-600 font-bold">✓ Verified</span>}
                            </p>
                            {doc.description && <p className="text-[11px] text-gray-600 mt-1">{doc.description}</p>}
                          </div>
                          <button
                            onClick={() => setViewingDoc(doc.id)}
                            className="text-primary p-1 rounded-lg hover:bg-primary/10"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── MESSAGES TAB ──────────────────────────────────────────── */}
            {activeTab === "messages" && (
              <motion.div key="messages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-blue-50 rounded-2xl p-3 border border-blue-200">
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    All communications are logged and legally documented. Officials can send updates directly through this system. You can also send questions and requests.
                  </p>
                </div>

                {/* Message thread */}
                <div className="space-y-3">
                  {loadingMessages ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Messages from officials will appear here</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.senderRole === "complainant" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 ${
                          msg.senderRole === "complainant" ? "bg-primary text-primary-foreground rounded-br-md" :
                          msg.senderRole === "system" ? "bg-gray-100 border border-gray-200 text-gray-700 rounded-bl-md" :
                          msg.messageType === "alert" || msg.isUrgent ? "bg-red-50 border-2 border-red-300 text-red-900 rounded-bl-md" :
                          "bg-blue-50 border border-blue-200 text-blue-900 rounded-bl-md"
                        }`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold opacity-70">{msg.senderName}</span>
                            {msg.senderTitle && <span className="text-[10px] opacity-60">· {msg.senderTitle}</span>}
                            {msg.isUrgent && <span className="text-[10px] font-bold text-red-600">🚨 Urgent</span>}
                          </div>
                          {msg.subject && msg.senderRole !== "complainant" && (
                            <p className="text-[11px] font-bold mb-1">{msg.subject}</p>
                          )}
                          <p className="text-xs leading-relaxed">{msg.body}</p>
                          <p className="text-[10px] opacity-60 mt-1.5 text-right">
                            {format(new Date(msg.createdAt), "d MMM yyyy, HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Send message */}
                <div className="sticky bottom-0 bg-background pt-2 pb-2 border-t border-border/60">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Send a question or request to your IO / prosecutor..."
                      className="rounded-2xl text-sm resize-none min-h-[72px]"
                      rows={2}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMsg}
                      className="rounded-2xl h-10 w-10 p-0 shrink-0"
                    >
                      {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ESCALATIONS TAB ───────────────────────────────────────── */}
            {activeTab === "escalations" && (
              <motion.div key="escalations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-200">
                  <h3 className="font-bold text-red-800 text-base mb-2">SA Escalation Bodies</h3>
                  <p className="text-xs text-red-700 leading-relaxed">
                    If officials fail to act within legally required timeframes, or if you suspect corruption, you have the constitutional right to escalate to independent oversight bodies. All escalations are documented.
                  </p>
                </div>

                {/* Escalation body reference cards */}
                <div className="space-y-2">
                  {Object.entries(ESCALATION_BODIES).map(([key, body]) => (
                    <div key={key} className={`rounded-2xl border p-3 ${
                      body.level >= 6 ? "border-red-300 bg-red-50" :
                      body.level >= 4 ? "border-amber-300 bg-amber-50" :
                      "border-gray-200 bg-gray-50"
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              body.level >= 6 ? "bg-red-100 text-red-700" :
                              body.level >= 4 ? "bg-amber-100 text-amber-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              Level {body.level}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-gray-900">{body.label}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{body.forWhat}</p>
                          <a href={`tel:${body.phone}`} className="flex items-center gap-1 mt-1.5 text-primary font-bold text-xs">
                            <Phone className="w-3 h-3" /> {body.phone}
                          </a>
                          {body.website && (
                            <a href={body.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-0.5 text-primary text-xs">
                              <ExternalLink className="w-3 h-3" /> {body.website}
                            </a>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-bold rounded-xl shrink-0"
                          onClick={() => {
                            setEscalateBody(key as EscalationBody);
                            setEscalateStep(SA_JUSTICE_STEPS[0]);
                            setShowEscalateDialog(true);
                          }}
                        >
                          Escalate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submitted escalations */}
                {escalations.length > 0 && (
                  <div>
                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider px-1 mb-3">
                      Your Escalations ({escalations.length})
                    </h3>
                    <div className="space-y-3">
                      {escalations.map(esc => (
                        <Card key={esc.id} className={`rounded-2xl border-2 ${
                          esc.status === "resolved" ? "border-green-300 bg-green-50" :
                          esc.status === "investigating" ? "border-blue-300 bg-blue-50" :
                          "border-amber-300 bg-amber-50"
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="font-bold text-sm">{esc.escalationBodyLabel}</p>
                                <p className="text-xs text-gray-600">{esc.failedStepLabel}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                                esc.status === "resolved" ? "bg-green-100 text-green-700" :
                                esc.status === "investigating" ? "bg-blue-100 text-blue-700" :
                                esc.status === "acknowledged" ? "bg-purple-100 text-purple-700" :
                                "bg-amber-100 text-amber-700"
                              }`}>
                                {esc.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed mb-2">{esc.reason.substring(0, 200)}...</p>
                            {esc.referenceNumber && (
                              <p className="text-xs font-bold text-gray-800">Ref: {esc.referenceNumber}</p>
                            )}
                            {esc.response && (
                              <div className="mt-2 bg-white rounded-xl p-2 border border-gray-200">
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Response Received</p>
                                <p className="text-xs text-gray-700">{esc.response}</p>
                              </div>
                            )}
                            <p className="text-[10px] text-gray-500 mt-2">Submitted {format(new Date(esc.createdAt), "d MMM yyyy")}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── FLAG DIALOG ───────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showFlagDialog && flagStep && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-end"
              onClick={() => setShowFlagDialog(false)}
            >
              <motion.div
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                className="bg-white rounded-t-3xl w-full p-6 space-y-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-xl text-red-700">🚩 Raise Red Flag</h3>
                  <button onClick={() => setShowFlagDialog(false)}><X className="w-5 h-5" /></button>
                </div>
                <div className="bg-red-50 rounded-2xl p-3 border border-red-200">
                  <p className="text-sm font-bold text-red-800">Step: {flagStep.label}</p>
                  <p className="text-xs text-red-700 mt-1">Responsible: {flagStep.actorLabel}</p>
                  <p className="text-xs text-red-600 mt-1">After raising this flag, it will be formally documented and the responsible official notified.</p>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Describe the delay / failure</Label>
                  <Textarea
                    value={flagReason}
                    onChange={e => setFlagReason(e.target.value)}
                    placeholder="e.g. It has been 5 days since the incident and no IO has been assigned. We have called the station 3 times and cannot get through."
                    className="mt-2 rounded-2xl text-sm resize-none"
                    rows={4}
                  />
                </div>
                <Button
                  className="w-full rounded-2xl h-12 font-bold bg-red-600 hover:bg-red-700"
                  onClick={submitFlag}
                  disabled={!flagReason.trim()}
                >
                  <Flag className="w-4 h-4 mr-2" /> Raise Red Flag — Document This
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ESCALATE DIALOG ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {showEscalateDialog && escalateStep && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-end"
              onClick={() => setShowEscalateDialog(false)}
            >
              <motion.div
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                className="bg-white rounded-t-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-xl text-orange-700">🚨 Escalate to Authority</h3>
                  <button onClick={() => setShowEscalateDialog(false)}><X className="w-5 h-5" /></button>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Escalate to</Label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(ESCALATION_BODIES).map(([key, body]) => (
                      <button
                        key={key}
                        onClick={() => setEscalateBody(key as EscalationBody)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all ${
                          escalateBody === key ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${escalateBody === key ? "border-primary" : "border-gray-300"}`}>
                            {escalateBody === key && <div className="w-2 h-2 bg-primary rounded-full" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold">{body.label}</p>
                            <p className="text-[10px] text-gray-500">{body.forWhat}</p>
                          </div>
                          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            body.level >= 6 ? "bg-red-100 text-red-700" :
                            body.level >= 4 ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            L{body.level}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full reason for escalation</Label>
                  <Textarea
                    value={escalateReason}
                    onChange={e => setEscalateReason(e.target.value)}
                    placeholder="Provide a full, factual description of what has happened, what has been delayed, when it should have been done, and what attempts you have made to resolve it..."
                    className="mt-2 rounded-2xl text-sm resize-none"
                    rows={5}
                  />
                </div>

                {ESCALATION_BODIES[escalateBody] && (
                  <div className="bg-orange-50 rounded-2xl p-3 border border-orange-200">
                    <p className="text-xs text-orange-800 font-medium">
                      Contact: <span className="font-bold">{ESCALATION_BODIES[escalateBody].phone}</span>
                      {ESCALATION_BODIES[escalateBody].email && ` | ${ESCALATION_BODIES[escalateBody].email}`}
                    </p>
                    <p className="text-[10px] text-orange-700 mt-1">
                      Your escalation will be formally documented. Keep a reference number.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full rounded-2xl h-12 font-bold bg-orange-600 hover:bg-orange-700"
                  onClick={submitEscalation}
                  disabled={!escalateReason.trim() || submittingEscalation}
                >
                  {submittingEscalation ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertOctagon className="w-4 h-4 mr-2" />}
                  Submit Escalation — Document Formally
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DOCUMENT VIEWER ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {viewingDoc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 bg-black/80">
                <p className="text-white font-bold">Document Preview</p>
                <button onClick={() => setViewingDoc(null)}><X className="w-6 h-6 text-white" /></button>
              </div>
              <DocumentViewer caseId={id} docId={viewingDoc} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}

function DocumentViewer({ caseId, docId }: { caseId: string; docId: string }) {
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  useEffect(() => {
    fetch(`${BASE}/api/cases/${caseId}/documents/${docId}/file`)
      .then(r => r.json())
      .then(d => {
        setFileData(d.fileData);
        setFileType(d.fileType);
      })
      .catch(() => {});
  }, [caseId, docId, BASE]);

  if (!fileData) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>;

  if (fileType?.startsWith("image/")) {
    return <div className="flex-1 overflow-auto flex items-center justify-center p-4"><img src={fileData} alt="Document" className="max-w-full object-contain rounded-xl" /></div>;
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <iframe src={fileData} className="w-full h-full rounded-xl" title="Document" />
    </div>
  );
}
