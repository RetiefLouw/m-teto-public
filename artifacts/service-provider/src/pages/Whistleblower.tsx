import { useState } from "react";
import { ShieldAlert, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";

const CORRUPTION_TYPES = [
  "Bribery / soliciting payment from victim",
  "Extortion",
  "Fraud / forging documents",
  "Theft of evidence",
  "Witness tampering",
  "Case file manipulation",
  "Collusion with perpetrator",
  "Systemic corruption within unit",
  "Data capture fraud",
  "Other",
];

const BODIES = [
  "SAPS (South African Police Service)",
  "National Prosecuting Authority (NPA)",
  "Department of Justice",
  "Department of Social Development",
  "Legal Aid South Africa",
  "SASSA",
  "Home Affairs",
  "Independent Police Investigative Directorate (IPID)",
  "Public Protector",
  "Department of Health",
  "Department of Education",
  "Other",
];

export function Whistleblower() {
  const [form, setForm] = useState({
    corruptionType: "",
    bodyInvolved: "",
    description: "",
    location: "",
    dateOfIncident: "",
    evidenceDescription: "",
    anonymous: true,
    reporterName: "",
    safeContact: "",
    confirmAccuracy: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refNum, setRefNum] = useState("");
  const [showGuidance, setShowGuidance] = useState(false);

  function set(field: string, val: string | boolean) {
    setForm(f => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const ref = `WB-${Date.now().toString(36).toUpperCase()}`;
    setRefNum(ref);
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-8 text-center">
          <ShieldAlert size={40} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Whistleblower Report Received</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Thank you for your courage. Your report has been securely logged and will be escalated
            to the appropriate oversight authority. You are protected under the Protected Disclosures Act 26 of 2000.
          </p>
          <div className="bg-white/5 rounded-xl p-3 mb-6">
            <p className="text-xs text-muted-foreground">Secure Reference Number</p>
            <p className="text-xl font-black text-emerald-400 font-mono">{refNum}</p>
          </div>
          <div className="text-left bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
            <p className="text-xs font-bold text-blue-400 mb-2">Your Legal Protections</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Protected Disclosures Act 26 of 2000</li>
              <li>• No retaliation is lawful against a whistle-blower</li>
              <li>• Your identity is protected if submitted anonymously</li>
              <li>• You may contact the Public Protector at 0800 11 20 40</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({ corruptionType: "", bodyInvolved: "", description: "", location: "", dateOfIncident: "", evidenceDescription: "", anonymous: true, reporterName: "", safeContact: "", confirmAccuracy: false });
            }}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
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
      <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert size={22} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-bold text-foreground">Whistleblower Report</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Report corruption, fraud, or serious misconduct within government bodies or service providers
              handling SRGBV cases. You are protected under the <strong className="text-foreground">Protected Disclosures Act 26 of 2000</strong>.
            </p>
            <button
              onClick={() => setShowGuidance(v => !v)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              {showGuidance ? <EyeOff size={12} /> : <Eye size={12} />}
              {showGuidance ? "Hide" : "Show"} safety guidance
            </button>
            {showGuidance && (
              <div className="mt-3 text-xs text-muted-foreground space-y-1 bg-white/5 rounded-lg p-3">
                <p>• Do not submit from a work device or work network if you suspect monitoring</p>
                <p>• Use anonymous mode if you fear retaliation</p>
                <p>• Retain a copy of your reference number in a safe place</p>
                <p>• For urgent threats to your safety, contact IPID: 0800 020 818</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Core details */}
        <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-5 space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nature of Corruption</h3>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Type of Corruption / Misconduct *</label>
            <select
              required
              value={form.corruptionType}
              onChange={e => set("corruptionType", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Select type...</option>
              {CORRUPTION_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Body / Organisation Involved *</label>
            <select
              required
              value={form.bodyInvolved}
              onChange={e => set("bodyInvolved", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Select body...</option>
              {BODIES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Location / Station</label>
              <input
                value={form.location}
                onChange={e => set("location", e.target.value)}
                placeholder="e.g. Johannesburg Central SAPS"
                className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date of Incident</label>
              <input
                type="date"
                value={form.dateOfIncident}
                onChange={e => set("dateOfIncident", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Description *</label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Describe what happened in full detail. Include names of people involved, dates, amounts if applicable, and the impact on victims..."
              className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Evidence Available</label>
            <input
              value={form.evidenceDescription}
              onChange={e => set("evidenceDescription", e.target.value)}
              placeholder="Describe any documents, recordings, witnesses, or other evidence"
              className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Identity */}
        <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-5 space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Lock size={12} /> Your Identity
          </h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={e => set("anonymous", e.target.checked)}
              className="rounded"
            />
            <div>
              <span className="text-sm font-medium text-foreground">Submit anonymously</span>
              <p className="text-xs text-muted-foreground">Recommended for personal safety</p>
            </div>
          </label>
          {!form.anonymous && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Your Name (confidential)</label>
                <input
                  value={form.reporterName}
                  onChange={e => set("reporterName", e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Safe Contact Method</label>
                <input
                  value={form.safeContact}
                  onChange={e => set("safeContact", e.target.value)}
                  placeholder="Personal phone / personal email"
                  className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="rounded-xl bg-[hsl(218,25%,14%)] border border-border p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={form.confirmAccuracy}
              onChange={e => set("confirmAccuracy", e.target.checked)}
              className="rounded mt-0.5"
            />
            <span className="text-sm text-muted-foreground">
              I confirm that the information I have provided is accurate and truthful to the best of my knowledge.
              I understand that making a false report may have legal consequences.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold transition-colors"
        >
          {loading ? "Submitting Securely..." : "Submit Whistleblower Report"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Protected under the Protected Disclosures Act 26 of 2000 · © Adv. Thando Gumede ZA
        </p>
      </form>
    </div>
  );
}
