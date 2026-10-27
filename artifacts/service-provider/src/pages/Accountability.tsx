import { useState } from "react";
import { AlertTriangle, CheckCircle2, User, Building2, FileText } from "lucide-react";

const DEPARTMENTS = [
  "SAPS", "Department of Justice", "Department of Social Development",
  "Legal Aid SA", "NPA (National Prosecuting Authority)", "Department of Health",
  "Department of Education", "SASSA", "Home Affairs", "Other"
];

const INCIDENT_TYPES = [
  "Failure to act on report",
  "Delayed processing beyond prescribed timeframe",
  "Victim secondary victimisation",
  "Non-compliance with court order",
  "Case file missing or mishandled",
  "Failure to make referral",
  "Corruption / bribery",
  "Abuse of power",
  "Discrimination",
  "Other",
];

export function Accountability() {
  const [form, setForm] = useState({
    officialName: "",
    department: "",
    caseRef: "",
    incidentType: "",
    description: "",
    evidenceRef: "",
    anonymous: false,
    reporterName: "",
    reporterContact: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refNum, setRefNum] = useState("");

  function set(field: string, val: string | boolean) {
    setForm(f => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const ref = `ACC-${Date.now().toString(36).toUpperCase()}`;
    setRefNum(ref);
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-8 text-center">
          <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Report Submitted</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your accountability report has been logged and will be reviewed by the oversight team.
          </p>
          <div className="bg-white/5 rounded-xl p-3 mb-6">
            <p className="text-xs text-muted-foreground">Reference Number</p>
            <p className="text-xl font-black text-emerald-400 font-mono">{refNum}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Keep this reference number. You may be contacted for further information if you did not submit anonymously.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ officialName: "", department: "", caseRef: "", incidentType: "", description: "", evidenceRef: "", anonymous: false, reporterName: "", reporterContact: "" }); }}
            className="mt-6 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={22} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-bold text-foreground">Report Official Non-Compliance</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Report a government official or service provider who has failed to fulfil their duties,
              causing delays or harm to a victim of SRGBV. All reports are logged and reviewed.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Official */}
        <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-5 space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <User size={13} /> Official Being Reported
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Official's Full Name</label>
              <input
                value={form.officialName}
                onChange={e => set("officialName", e.target.value)}
                placeholder="Full name (if known)"
                className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department / Organisation *</label>
              <select
                required
                value={form.department}
                onChange={e => set("department", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Select department...</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Case Reference Number (if any)</label>
            <input
              value={form.caseRef}
              onChange={e => set("caseRef", e.target.value)}
              placeholder="e.g. CAS 123/2025"
              className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Incident */}
        <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-5 space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText size={13} /> Incident Details
          </h3>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Type of Non-Compliance *</label>
            <select
              required
              value={form.incidentType}
              onChange={e => set("incidentType", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Select type...</option>
              {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description *</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Describe the incident in detail — what happened, when, where, and the impact on the victim..."
              className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Supporting Evidence Reference</label>
            <input
              value={form.evidenceRef}
              onChange={e => set("evidenceRef", e.target.value)}
              placeholder="File number, document name, witness name, etc."
              className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Reporter */}
        <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-5 space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Building2 size={13} /> Reporter Information
          </h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={e => set("anonymous", e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-foreground">Submit anonymously</span>
          </label>
          {!form.anonymous && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Your Name</label>
                <input
                  value={form.reporterName}
                  onChange={e => set("reporterName", e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Contact</label>
                <input
                  value={form.reporterContact}
                  onChange={e => set("reporterContact", e.target.value)}
                  placeholder="Phone or email"
                  className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold transition-colors"
        >
          {loading ? "Submitting..." : "Submit Accountability Report"}
        </button>
      </form>
    </div>
  );
}
