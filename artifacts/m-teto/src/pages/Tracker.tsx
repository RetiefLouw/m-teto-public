import { useState } from "react";
import { Link } from "wouter";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useListCases, useCreateCase, getListCasesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Shield, ChevronRight, Clock, FileText, Eye, AlertTriangle, CheckCircle2, Circle, Lock, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const STAGES = [
  { id: "incident", label: "Incident" },
  { id: "case_opened", label: "Case Opened" },
  { id: "investigation", label: "Investigation" },
  { id: "court", label: "Court" },
  { id: "sentencing", label: "Sentencing" },
  { id: "closed", label: "Closed" },
];

const DEMO_CHECKLIST: Record<string, { id: string; label: string }[]> = {
  incident: [
    { id: "safety", label: "Reached a safe place" },
    { id: "j88", label: "J88 medical form completed by doctor" },
    { id: "trusted_adult", label: "Told a trusted adult" },
  ],
  case_opened: [
    { id: "cas", label: "Received CAS number from SAPS" },
    { id: "statement", label: "Official statement given at police station" },
    { id: "io", label: "Investigating Officer assigned" },
  ],
  investigation: [
    { id: "witnesses", label: "Witness statements collected" },
    { id: "evidence", label: "Evidence preserved and logged" },
  ],
  court: [
    { id: "date", label: "Court date received" },
    { id: "prosecutor", label: "Met with prosecutor" },
    { id: "appeared", label: "Appeared in court" },
  ],
};

const DEMO_CASES = [
  {
    id: "demo-1",
    title: "School Assault — Station Road",
    incidentType: "assault",
    stage: "investigation",
    casNumber: "CAS-2024-0847-JHB",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    checklist: { safety: true, j88: true, trusted_adult: true, cas: true, statement: true, io: true, witnesses: false, evidence: false },
    notes: "Investigating Officer: Sgt. Dlamini (082-555-0847). Case under investigation. DNA evidence collected.",
    contacts: [{ name: "Childline SA", number: "116" }, { name: "SAPS FCS Unit", number: "10111" }],
    antiCorruption: { flagged: false, lastUpdate: "2 days ago", ioContacted: true },
  },
  {
    id: "demo-2",
    title: "Sexual Harassment — WhatsApp",
    incidentType: "other",
    stage: "case_opened",
    casNumber: "CAS-2024-1203-TSH",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    checklist: { safety: true, j88: false, trusted_adult: true, cas: true, statement: false, io: false },
    notes: "Screenshots of messages submitted as evidence. Need to return to station to give written statement.",
    contacts: [{ name: "GBV Command Centre", number: "0800 428 428" }, { name: "Legal Aid SA", number: "0800 110 110" }],
    antiCorruption: { flagged: true, flagReason: "Police station did not accept report on first attempt", lastUpdate: "Yesterday", ioContacted: false },
  },
  {
    id: "demo-3",
    title: "Teacher Misconduct — SRGBV",
    incidentType: "domestic_violence",
    stage: "court",
    casNumber: "CAS-2023-0594-EKU",
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    checklist: { safety: true, j88: true, trusted_adult: true, cas: true, statement: true, io: true, witnesses: true, evidence: true, date: true, prosecutor: true, appeared: false },
    notes: "Court date: 28 March 2026. Legal Aid attorney assigned. J88 evidence submitted. Prosecutor briefed.",
    contacts: [{ name: "Legal Aid SA", number: "0800 110 110" }, { name: "Childline", number: "116" }],
    antiCorruption: { flagged: false, lastUpdate: "3 hours ago", ioContacted: true },
  },
];

const STAGE_COLORS: Record<string, string> = {
  incident: "bg-red-100 text-red-700 border-red-200",
  case_opened: "bg-orange-100 text-orange-700 border-orange-200",
  investigation: "bg-amber-100 text-amber-700 border-amber-200",
  court: "bg-blue-100 text-blue-700 border-blue-200",
  sentencing: "bg-purple-100 text-purple-700 border-purple-200",
  closed: "bg-green-100 text-green-700 border-green-200",
};

const INCIDENT_LABELS: Record<string, string> = {
  rape: "Rape / Sexual Assault",
  domestic_violence: "Domestic Violence / SRGBV",
  assault: "Physical Assault",
  other: "Other",
};

function DemoCaseCard({ c }: { c: typeof DEMO_CASES[0] }) {
  const [expanded, setExpanded] = useState(false);
  const stageIndex = STAGES.findIndex((s) => s.id === c.stage);
  const stageChecklist = DEMO_CHECKLIST[c.stage] ?? [];
  const checklistItems = Object.entries(c.checklist);
  const doneCount = checklistItems.filter(([, v]) => v).length;

  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
      <Card className={`rounded-3xl border overflow-hidden shadow-sm ${c.antiCorruption?.flagged ? "border-red-300" : "border-border"}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <Badge className="text-[9px] bg-yellow-100 text-yellow-700 border-yellow-200 font-bold px-2">DEMO</Badge>
                <Badge variant="outline" className={`text-[9px] font-bold ${STAGE_COLORS[c.stage] ?? ""}`}>
                  {STAGES[stageIndex]?.label ?? c.stage}
                </Badge>
                {c.antiCorruption?.flagged && (
                  <Badge className="text-[9px] bg-red-100 text-red-700 border-red-200 font-bold px-2 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> Flagged
                  </Badge>
                )}
              </div>
              <h4 className="font-bold text-base truncate">{c.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{INCIDENT_LABELS[c.incidentType] ?? "Other"}</p>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1 font-mono bg-muted px-2 py-0.5 rounded-md">{c.casNumber}</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              {doneCount}/{checklistItems.length} done
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            {STAGES.slice(0, 6).map((s, i) => (
              <div key={s.id} className={`h-1.5 rounded-full flex-1 ${i <= stageIndex ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-muted-foreground">Start</span>
            <span className="text-[8px] text-primary font-bold">{STAGES[stageIndex]?.label}</span>
            <span className="text-[8px] text-muted-foreground">Closed</span>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/60 space-y-4">
                  {c.antiCorruption?.flagged && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
                      <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Corruption / Misconduct Flag
                      </p>
                      <p className="text-xs text-red-600 mt-1">{c.antiCorruption.flagReason}</p>
                      <p className="text-xs text-red-500 mt-1 font-medium">This flag has been escalated to the relevant oversight body.</p>
                    </div>
                  )}

                  <div>
                    <p className="font-bold text-sm mb-2">Stage Checklist</p>
                    <div className="space-y-2">
                      {stageChecklist.map((item) => {
                        const done = (c.checklist as Record<string, boolean>)[item.id] ?? false;
                        return (
                          <div key={item.id} className="flex items-center gap-2.5">
                            {done
                              ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                              : <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                            <span className={`text-xs ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-muted/40 rounded-2xl p-3">
                    <p className="text-xs font-bold mb-1">Case Notes</p>
                    <p className="text-xs text-muted-foreground">{c.notes}</p>
                  </div>

                  <div>
                    <p className="font-bold text-xs mb-2">Key Contacts</p>
                    {c.contacts.map((ct) => (
                      <div key={ct.name} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                        <span className="text-xs font-medium">{ct.name}</span>
                        <a href={`tel:${ct.number}`} className="text-xs font-bold text-primary">{ct.number}</a>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                    <p className="text-xs font-bold text-amber-700">⚠️ Demo Mode</p>
                    <p className="text-xs text-amber-600 mt-0.5">This is a sample case. Log in to create and manage real private cases with full anti-corruption tracking.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Tracker() {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [incidentType, setIncidentType] = useState<string>("other");
  const [demoMode, setDemoMode] = useState(false);

  const { data, isLoading } = useListCases({
    query: { enabled: isAuthenticated }
  });

  const createCaseMutation = useCreateCase({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCasesQueryKey() });
        setIsCreateOpen(false);
        setTitle("");
        setIncidentType("other");
      }
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCaseMutation.mutate({ data: { title, incidentType } });
  };

  if (!isAuthenticated && !demoMode) {
    return (
      <MobileLayout title="Case Tracker">
        <div className="flex flex-col items-center p-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5 mt-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2 text-center">Secure Case Tracker</h2>
          <p className="text-muted-foreground text-sm mb-5 text-center">
            Track your case privately from incident to sentencing. Encrypted, private, and always accessible to you.
          </p>

          <div className="w-full space-y-2.5 mb-6">
            {[
              { icon: "🔒", label: "100% private — only you can see your cases" },
              { icon: "⏰", label: "Deadline alerts so nothing is missed" },
              { icon: "📋", label: "Stage-by-stage checklists aligned with SA law" },
              { icon: "⚠️", label: "Flag corruption and official inaction directly" },
              { icon: "📞", label: "Key contacts saved for each stage of your case" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 text-left bg-muted/30 rounded-2xl p-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>

          <Button onClick={login} className="w-full rounded-2xl py-6 font-bold shadow-lg shadow-primary/20 text-lg mb-3">
            <UserCheck className="w-5 h-5 mr-2" /> Log In to Start Tracking
          </Button>

          <button
            onClick={() => setDemoMode(true)}
            className="w-full py-4 rounded-2xl font-bold text-sm border-2 border-primary/30 text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" /> Explore Demo Mode
          </button>
          <p className="text-xs text-muted-foreground mt-2 text-center">See how case tracking and anti-corruption reporting works with sample cases</p>
        </div>
      </MobileLayout>
    );
  }

  if (!isAuthenticated && demoMode) {
    return (
      <MobileLayout title="Case Tracker — Demo">
        <div className="px-4 pt-4 pb-8 space-y-4">
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-yellow-800">Demo Mode — Sample Cases</p>
              <p className="text-xs text-yellow-600">Log in to create real private cases with full tracking.</p>
            </div>
            <Button size="sm" onClick={login} className="shrink-0 text-xs h-8 rounded-xl px-3">Login</Button>
          </div>

          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-base">Sample Cases</h3>
            <button onClick={() => setDemoMode(false)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" /> Exit Demo
            </button>
          </div>

          <div className="space-y-4">
            {DEMO_CASES.map((c) => (
              <DemoCaseCard key={c.id} c={c} />
            ))}
          </div>

          <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-5">
              <h4 className="font-bold text-sm mb-1 text-primary flex items-center gap-2">
                <Shield className="w-4 h-4" /> Anti-Corruption Case Management
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                M-TETO assigns every case a unique CAS reference number. Children can flag corruption, inaction, or delays by officials — reports are escalated to the relevant oversight body.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "📋", label: "CAS Number Tracking" },
                  { icon: "⚠️", label: "Flag Official Inaction" },
                  { icon: "🔒", label: "Encrypted & Private" },
                  { icon: "📡", label: "Escalation Chain" },
                ].map((f) => (
                  <div key={f.label} className="bg-white rounded-xl p-2.5 flex items-center gap-2 shadow-sm">
                    <span className="text-base">{f.icon}</span>
                    <span className="text-[11px] font-bold">{f.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="My Cases">
      <div className="px-4 pt-6 pb-8 space-y-6">
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 py-8 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
        >
          <Plus className="w-6 h-6" /> Start New Case Tracker
        </Button>

        <div className="space-y-4 mt-8">
          <h3 className="font-bold text-lg px-2">Active Trackers</h3>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className="rounded-3xl border-border p-6 h-32 animate-pulse bg-muted/20" />
              ))}
            </div>
          ) : data?.cases.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-border/60 rounded-3xl">
              <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="font-bold text-muted-foreground">No cases tracked yet</h4>
              <p className="text-sm text-muted-foreground/70 mt-1">Tap the button above to start tracking.</p>
            </div>
          ) : (
            data?.cases.map((c, idx) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                <Link href={`/tracker/${c.id}`} className="block group">
                  <Card className="rounded-3xl border border-border/60 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 relative overflow-hidden bg-card">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-3xl" />
                    <CardContent className="p-5 pl-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase tracking-wider text-[10px] font-bold">
                            {c.incidentType?.replace("_", " ") || "Case"}
                          </Badge>
                          <Badge variant="secondary" className="uppercase tracking-wider text-[10px] font-bold">
                            {c.stage.replace("_", " ")}
                          </Badge>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h4 className="font-display font-bold text-lg mb-2 line-clamp-1">{c.title}</h4>
                      <div className="flex items-center text-xs font-medium text-muted-foreground gap-4">
                        {c.casNumber && (
                          <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md font-mono">CAS: {c.casNumber}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Updated {formatDistanceToNow(new Date(c.updatedAt))} ago
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* Demo cases banner */}
        <Link href="/demo-cases">
          <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center hover:bg-primary/10 transition-all cursor-pointer active:scale-[0.98]">
            <div className="text-3xl mb-2">📋</div>
            <h4 className="font-display font-bold text-base text-primary mb-1">Browse 100 Demo Cases</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              See how the justice tracker works with real SA scenarios — assault, rape, IPV, GBV, SRGBV and more. Each shows the full justice value chain with delays, flags and escalations.
            </p>
          </div>
        </Link>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-[400px] w-[95vw] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Start New Tracker</DialogTitle>
            <DialogDescription>
              Create a private record to track the timeline, required documents, and important contacts for your case.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-bold">Case Nickname / Reference</Label>
              <Input
                id="title"
                placeholder="e.g. Incident at Station Road"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl h-12 bg-muted/30 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="font-bold">Incident Type (Optional)</Label>
              <Select value={incidentType} onValueChange={setIncidentType}>
                <SelectTrigger id="type" className="rounded-xl h-12 bg-muted/30 border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="rape">Rape / Sexual Assault</SelectItem>
                  <SelectItem value="domestic_violence">Domestic Violence / SRGBV</SelectItem>
                  <SelectItem value="assault">Physical Assault</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={createCaseMutation.isPending || !title} className="w-full rounded-xl py-6 font-bold text-base shadow-lg">
                {createCaseMutation.isPending ? "Creating..." : "Create Tracker"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
