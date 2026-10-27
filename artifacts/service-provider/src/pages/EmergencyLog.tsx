/**
 * M-TETO SP Emergency Log — GCS Panic Button Events
 * Every emergency panic button press from end-users is logged here.
 * Officials record outcomes: was child helped, incident nature, case opened?
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */
import { useState, useEffect, useCallback } from "react";
import { spApi } from "@/lib/api";
import {
  AlertOctagon, MapPin, CheckCircle2, XCircle, Clock, RefreshCw,
  User, Shield, ExternalLink, ChevronDown, ChevronUp,
  FileText, Phone, Heart, AlertTriangle, Save, Flag,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface EmergencyEvent {
  id: string;
  type: string;
  status: string;
  urgency: string;
  contact_name: string;
  contact_phone: string;
  subject: string;
  body: string;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_address: string | null;
  is_read: boolean;
  responded_at: string | null;
  resolved_at: string | null;
  created_at: string;
  // Outcome fields
  was_helped: boolean | null;
  incident_nature: string | null;
  case_opened: boolean | null;
  cas_number: string | null;
  child_safe: boolean | null;
  hospitalised: boolean | null;
  perpetrator_apprehended: boolean | null;
  response_time_minutes: number | null;
  attending_officer: string | null;
  attending_org: string | null;
  recorded_at: string | null;
  follow_up_required: boolean | null;
  follow_up_notes: string | null;
}

type OutcomeForm = {
  wasHelped: boolean | undefined;
  incidentNature: string;
  incidentDescription: string;
  caseOpened: boolean;
  casNumber: string;
  attendingOfficer: string;
  attendingOfficerBadge: string;
  attendingOrg: string;
  responseTimeMinutes: string;
  childSafe: boolean | undefined;
  hospitalised: boolean;
  perpetratorApprehended: boolean;
  followUpRequired: boolean;
  followUpNotes: string;
  recordedBy: string;
};

// ── Helpers ───────────────────────────────────────────────────
function fmtDateTime(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-ZA", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeSince(s: string) {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 3600000);
  if (d < 1) return "< 1h ago";
  if (d < 24) return `${d}h ago`;
  return `${Math.floor(d / 24)}d ago`;
}

const INCIDENT_TYPES = [
  "Sexual assault by peer",
  "Sexual assault by adult",
  "Physical assault by educator",
  "Physical assault by adult",
  "Sexual harassment by educator",
  "Corporal punishment",
  "Attempted abduction",
  "Domestic violence — child witness",
  "Online sexual exploitation",
  "Grooming",
  "Bullying (severe)",
  "Child in immediate danger",
  "Other",
];

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  open:        { cls: "text-amber-400",   label: "Open — Awaiting Response" },
  in_progress: { cls: "text-blue-400",    label: "In Progress" },
  resolved:    { cls: "text-emerald-400", label: "Resolved" },
  escalated:   { cls: "text-red-400",     label: "Escalated" },
};

const EMPTY_FORM: OutcomeForm = {
  wasHelped: undefined, incidentNature: "", incidentDescription: "",
  caseOpened: false, casNumber: "", attendingOfficer: "", attendingOfficerBadge: "",
  attendingOrg: "", responseTimeMinutes: "", childSafe: undefined,
  hospitalised: false, perpetratorApprehended: false,
  followUpRequired: false, followUpNotes: "", recordedBy: "SP Official",
};

// ── Component ─────────────────────────────────────────────────
export function EmergencyLog() {
  const [events, setEvents]             = useState<EmergencyEvent[]>([]);
  const [loading, setLoading]           = useState(true);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [formId, setFormId]             = useState<string | null>(null);
  const [form, setForm]                 = useState<OutcomeForm>(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await spApi.getEmergencyEvents();
      setEvents(r.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openForm(ev: EmergencyEvent) {
    setFormId(ev.id);
    setForm({
      wasHelped: ev.was_helped ?? undefined,
      incidentNature: ev.incident_nature ?? "",
      incidentDescription: "",
      caseOpened: ev.case_opened ?? false,
      casNumber: ev.cas_number ?? "",
      attendingOfficer: ev.attending_officer ?? "",
      attendingOfficerBadge: "",
      attendingOrg: ev.attending_org ?? "",
      responseTimeMinutes: ev.response_time_minutes != null ? String(ev.response_time_minutes) : "",
      childSafe: ev.child_safe ?? undefined,
      hospitalised: ev.hospitalised ?? false,
      perpetratorApprehended: ev.perpetrator_apprehended ?? false,
      followUpRequired: ev.follow_up_required ?? false,
      followUpNotes: ev.follow_up_notes ?? "",
      recordedBy: "SP Official",
    });
  }

  async function handleSave() {
    if (!formId) return;
    setSaving(true); setSaveMsg("");
    try {
      await spApi.recordEmergencyOutcome(formId, {
        wasHelped: form.wasHelped,
        incidentNature: form.incidentNature || undefined,
        incidentDescription: form.incidentDescription || undefined,
        caseOpened: form.caseOpened,
        casNumber: form.casNumber || undefined,
        attendingOfficer: form.attendingOfficer || undefined,
        attendingOfficerBadge: form.attendingOfficerBadge || undefined,
        attendingOrg: form.attendingOrg || undefined,
        responseTimeMinutes: form.responseTimeMinutes ? parseFloat(form.responseTimeMinutes) : undefined,
        childSafe: form.childSafe,
        hospitalised: form.hospitalised,
        perpetratorApprehended: form.perpetratorApprehended,
        followUpRequired: form.followUpRequired,
        followUpNotes: form.followUpNotes || undefined,
        recordedBy: form.recordedBy,
      });
      setSaveMsg("Outcome recorded successfully.");
      setFormId(null);
      await load();
    } catch {
      setSaveMsg("Failed to save. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 5000);
    }
  }

  // ── Summary stats ─────────────────────────────────────────
  const stats = {
    total:           events.length,
    helped:          events.filter(e => e.was_helped === true).length,
    notHelped:       events.filter(e => e.was_helped === false).length,
    casesOpened:     events.filter(e => e.case_opened).length,
    withOutcome:     events.filter(e => e.recorded_at !== null).length,
    noOutcome:       events.filter(e => e.recorded_at === null).length,
    apprehended:     events.filter(e => e.perpetrator_apprehended).length,
    hospitalised:    events.filter(e => e.hospitalised).length,
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-16">
      {/* Page title */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-bold text-foreground flex items-center gap-2">
            <AlertOctagon size={18} className="text-red-400" />
            Emergency Log — GCS Panic Button
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            All panic button activations. Record the outcome for every event.
          </p>
        </div>
        <button onClick={load} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Emergencies",  value: stats.total,       cls: "text-foreground" },
          { label: "Child Was Helped",   value: stats.helped,      cls: "text-emerald-400" },
          { label: "Not Helped",         value: stats.notHelped,   cls: "text-red-400" },
          { label: "Cases Opened",       value: stats.casesOpened, cls: "text-blue-400" },
          { label: "Outcomes Recorded",  value: stats.withOutcome, cls: "text-emerald-400" },
          { label: "Outcomes Pending",   value: stats.noOutcome,   cls: "text-amber-400" },
          { label: "Perpetrators Apprehended", value: stats.apprehended, cls: "text-emerald-400" },
          { label: "Hospitalised",       value: stats.hospitalised,cls: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-3">
            <p className={`text-xl font-black ${s.cls}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Save message */}
      {saveMsg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${saveMsg.includes("success") ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
          {saveMsg}
        </div>
      )}

      {/* Event list */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-xs">Loading emergency events…</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-xs">
          <AlertOctagon size={32} className="mx-auto mb-3 opacity-20" />
          <p>No emergency events logged yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => {
            const isExpanded = expandedId === ev.id;
            const hasOutcome = ev.recorded_at !== null;
            const sc = STATUS_CFG[ev.status] ?? STATUS_CFG.open;

            return (
              <div key={ev.id} className={`rounded-2xl border transition-all ${hasOutcome ? "border-border bg-[hsl(218,25%,14%)]" : "border-red-500/40 bg-red-500/5"}`}>
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                    <AlertOctagon size={15} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-bold text-foreground">{ev.subject}</p>
                      {!hasOutcome && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                          Outcome Pending
                        </span>
                      )}
                      {hasOutcome && ev.was_helped && (
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">Child Helped ✓</span>
                      )}
                      {hasOutcome && ev.was_helped === false && (
                        <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">Not Helped ✗</span>
                      )}
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground flex-wrap">
                      <span className={sc.cls}>{sc.label}</span>
                      <span>{timeSince(ev.created_at)}</span>
                      {ev.geo_address && <span className="flex items-center gap-0.5"><MapPin size={8} />{ev.geo_address}</span>}
                      {ev.contact_name && <span className="flex items-center gap-0.5"><User size={8} />{ev.contact_name}</span>}
                      {ev.response_time_minutes != null && <span className="flex items-center gap-0.5"><Clock size={8} />Response: {ev.response_time_minutes.toFixed(0)}min</span>}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0 mt-1" />}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
                    {/* Event detail */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1 font-semibold">Event Details</p>
                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed bg-white/5 rounded-lg p-3">{ev.body}</p>
                      </div>
                      {ev.geo_lat && ev.geo_lng && (
                        <div className="col-span-2">
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs">
                            <p className="text-red-400 font-semibold mb-1 flex items-center gap-1.5"><MapPin size={11} /> Location</p>
                            <p className="text-foreground/80">{ev.geo_address || `${ev.geo_lat.toFixed(6)}, ${ev.geo_lng.toFixed(6)}`}</p>
                            <a
                              href={`https://www.google.com/maps?q=${ev.geo_lat},${ev.geo_lng}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-red-400 hover:text-red-300 mt-1 text-xs font-semibold"
                            >
                              <ExternalLink size={10} /> Open in Google Maps
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Existing outcome */}
                    {hasOutcome && (
                      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                        <p className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-1.5"><CheckCircle2 size={12} /> Recorded Outcome</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                          {[
                            { label: "Child Was Helped",    value: ev.was_helped ? "Yes ✓" : "No ✗",         cls: ev.was_helped ? "text-emerald-400" : "text-red-400" },
                            { label: "Case Opened",         value: ev.case_opened ? "Yes" : "No",            cls: ev.case_opened ? "text-blue-400" : "text-muted-foreground" },
                            { label: "CAS Number",          value: ev.cas_number || "—",                     cls: "text-foreground" },
                            { label: "Incident Nature",     value: ev.incident_nature || "—",                cls: "text-foreground" },
                            { label: "Child Safe",          value: ev.child_safe == null ? "—" : ev.child_safe ? "Yes ✓" : "No ✗", cls: ev.child_safe ? "text-emerald-400" : "text-red-400" },
                            { label: "Hospitalised",        value: ev.hospitalised ? "Yes" : "No",           cls: ev.hospitalised ? "text-amber-400" : "text-muted-foreground" },
                            { label: "Perpetrator Apprehended", value: ev.perpetrator_apprehended ? "Yes ✓" : "No ✗", cls: ev.perpetrator_apprehended ? "text-emerald-400" : "text-red-400" },
                            { label: "Response Time",       value: ev.response_time_minutes != null ? `${ev.response_time_minutes.toFixed(0)} min` : "—", cls: "text-foreground" },
                            { label: "Attending Officer",   value: ev.attending_officer || "—",              cls: "text-foreground" },
                            { label: "Attending Organisation", value: ev.attending_org || "—",               cls: "text-foreground" },
                            { label: "Recorded At",         value: fmtDateTime(ev.recorded_at),              cls: "text-muted-foreground" },
                            { label: "Follow-Up Required",  value: ev.follow_up_required ? "Yes ⚠️" : "No",  cls: ev.follow_up_required ? "text-amber-400" : "text-muted-foreground" },
                          ].map(f => (
                            <div key={f.label} className="space-y-0.5">
                              <p className="text-muted-foreground">{f.label}</p>
                              <p className={`font-semibold ${f.cls}`}>{f.value}</p>
                            </div>
                          ))}
                        </div>
                        {ev.follow_up_notes && (
                          <p className="mt-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">{ev.follow_up_notes}</p>
                        )}
                      </div>
                    )}

                    {/* Outcome form */}
                    {formId === ev.id ? (
                      <div className="rounded-xl bg-[hsl(218,30%,12%)] border border-border p-4 space-y-4">
                        <p className="text-xs font-bold text-foreground">{hasOutcome ? "Update Outcome" : "Record Outcome"}</p>

                        {/* Was helped */}
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground mb-2">Was the child helped?</p>
                          <div className="flex gap-2">
                            {[{ v: true, l: "Yes — Child Was Helped", cls: "bg-emerald-600/20 border-emerald-500/40 text-emerald-400" },
                              { v: false, l: "No — Child Was Not Helped", cls: "bg-red-600/20 border-red-500/40 text-red-400" }].map(o => (
                              <button
                                key={String(o.v)}
                                onClick={() => setForm(f => ({ ...f, wasHelped: o.v }))}
                                className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-colors ${form.wasHelped === o.v ? o.cls : "bg-white/5 border-border text-muted-foreground hover:text-foreground"}`}
                              >
                                {o.l}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Incident nature */}
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Incident Nature *</label>
                            <select
                              value={form.incidentNature}
                              onChange={e => setForm(f => ({ ...f, incidentNature: e.target.value }))}
                              className="w-full px-2.5 py-1.5 text-xs bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground focus:outline-none focus:border-blue-500"
                            >
                              <option value="">— Select —</option>
                              {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>

                          {/* Response time */}
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Response Time (minutes)</label>
                            <input
                              type="number" min="0"
                              value={form.responseTimeMinutes}
                              onChange={e => setForm(f => ({ ...f, responseTimeMinutes: e.target.value }))}
                              placeholder="e.g. 12"
                              className="w-full px-2.5 py-1.5 text-xs bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          {/* Attending officer */}
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Attending Officer</label>
                            <input
                              value={form.attendingOfficer}
                              onChange={e => setForm(f => ({ ...f, attendingOfficer: e.target.value }))}
                              placeholder="Full name + rank"
                              className="w-full px-2.5 py-1.5 text-xs bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          {/* Attending org */}
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Attending Organisation</label>
                            <input
                              value={form.attendingOrg}
                              onChange={e => setForm(f => ({ ...f, attendingOrg: e.target.value }))}
                              placeholder="e.g. SAPS Tembisa FCS"
                              className="w-full px-2.5 py-1.5 text-xs bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Incident description */}
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Incident Description</label>
                          <textarea
                            value={form.incidentDescription}
                            onChange={e => setForm(f => ({ ...f, incidentDescription: e.target.value }))}
                            placeholder="Describe what happened, what was found, what was done…"
                            rows={3}
                            className="w-full px-2.5 py-2 text-xs bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground focus:outline-none focus:border-blue-500 resize-none"
                          />
                        </div>

                        {/* Checkboxes */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { key: "caseOpened",             label: "Case opened (CAS)" },
                            { key: "childSafe",              label: "Child is now safe" },
                            { key: "hospitalised",           label: "Child hospitalised" },
                            { key: "perpetratorApprehended", label: "Perpetrator apprehended" },
                            { key: "followUpRequired",       label: "Follow-up required" },
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={!!(form as any)[key]}
                                onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                                className="rounded"
                              />
                              {label}
                            </label>
                          ))}
                        </div>

                        {/* CAS number if case opened */}
                        {form.caseOpened && (
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">CAS Number</label>
                            <input
                              value={form.casNumber}
                              onChange={e => setForm(f => ({ ...f, casNumber: e.target.value }))}
                              placeholder="e.g. CAS/2026/0189"
                              className="w-full px-2.5 py-1.5 text-xs bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        )}

                        {/* Follow-up notes */}
                        {form.followUpRequired && (
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Follow-Up Notes</label>
                            <textarea
                              value={form.followUpNotes}
                              onChange={e => setForm(f => ({ ...f, followUpNotes: e.target.value }))}
                              placeholder="What follow-up is required? Who is responsible?"
                              rows={2}
                              className="w-full px-2.5 py-2 text-xs bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground focus:outline-none focus:border-blue-500 resize-none"
                            />
                          </div>
                        )}

                        {/* Recorded by */}
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Recorded By</label>
                          <input
                            value={form.recordedBy}
                            onChange={e => setForm(f => ({ ...f, recordedBy: e.target.value }))}
                            placeholder="Your name + role"
                            className="w-full px-2.5 py-1.5 text-xs bg-[hsl(218,25%,14%)] border border-border rounded-lg text-foreground focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleSave}
                            disabled={saving || form.wasHelped === undefined || !form.incidentNature}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition-colors"
                          >
                            <Save size={13} /> {saving ? "Saving…" : "Save Outcome"}
                          </button>
                          <button
                            onClick={() => setFormId(null)}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openForm(ev)}
                        className="w-full py-2 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-600/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <Flag size={13} /> {hasOutcome ? "Update Outcome" : "Record Outcome Now"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
