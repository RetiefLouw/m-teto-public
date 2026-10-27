import { useEffect, useState } from "react";
import { AlertTriangle, Phone, MapPin, Clock, Flag, Users, ShieldAlert, Heart } from "lucide-react";
import { fetchAdmin } from "../lib/api";
import { GRADE_LABELS } from "../lib/demoData";

interface SessionProfile {
  sessionId: string;
  gradeLevel?: string;
  province?: string;
  areaType?: string;
  riskLevel?: string;
  hasRiskFlags?: boolean;
  knowledgeScore?: number;
  totalEvents?: number;
  lastActive?: string;
}

interface FlagBreakdown {
  flag: string;
  count: number;
  provinces: string[];
  grades: string[];
}

const FLAG_LABELS: Record<string, string> = {
  witnessed_violence_at_home: "Witnessed Violence at Home",
  experienced_violence_at_school: "Experienced Violence at School",
  not_feel_safe_at_school: "Doesn't Feel Safe at School",
  experienced_online_harassment: "Experienced Online Harassment",
  not_know_who_to_tell: "Doesn't Know Who to Tell",
  experienced_sexual_violence: "Experienced Sexual Violence",
  experienced_physical_abuse: "Experienced Physical Abuse",
  experienced_emotional_abuse: "Experienced Emotional Abuse",
  experienced_discrimination: "Experienced Discrimination",
  contemplating_self_harm: "At Risk of Self-Harm",
};

const INTERVENTION_AGENCIES: Record<string, string[]> = {
  experienced_sexual_violence: ["Thuthuzela Care Centre", "SAPS FCS Unit", "Teddy Bear Foundation"],
  experienced_physical_abuse: ["DSD Social Workers", "Childline 116", "FAMSA"],
  not_know_who_to_tell: ["Childline 116", "School Social Workers", "RAPCAN"],
  witnessed_violence_at_home: ["DSD", "Lifeline", "POWA (Western Cape)"],
  experienced_online_harassment: ["SAPS Cybercrime Unit", "Childline Online", "FPB"],
  contemplating_self_harm: ["Lifeline 0861 322 322", "SADAG 0800 456 789", "Childline 116"],
};

function maskId(id: string) {
  return `SID-${id.replace("anon_", "").slice(0, 12).toUpperCase()}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Interventions() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"high" | "medium" | "emergency" | "flags">("high");

  useEffect(() => {
    fetchAdmin("/admin/interventions")
      .then((d: any) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: "high" as const, label: "High Risk", icon: ShieldAlert, color: "#EF4444", count: data?.summary?.totalHighRisk ?? 0 },
    { id: "medium" as const, label: "Medium Risk", icon: AlertTriangle, color: "#F97316", count: data?.summary?.totalMediumRisk ?? 0 },
    { id: "emergency" as const, label: "Emergency Visits", icon: Phone, color: "#DC2626", count: data?.summary?.totalEmergencyVisits ?? 0 },
    { id: "flags" as const, label: "Flag Analysis", icon: Flag, color: "#7C3AED", count: data?.flagBreakdown?.length ?? 0 },
  ];

  function SessionCard({ session, riskColor }: { session: SessionProfile; riskColor: string }) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold text-gray-600">{maskId(session.sessionId)}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {session.gradeLevel && <span className="text-xs text-gray-500">{GRADE_LABELS[session.gradeLevel] ?? session.gradeLevel}</span>}
              {session.province && <span className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {session.province}</span>}
              {session.areaType && <span className="text-xs text-gray-400">· {session.areaType}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${riskColor}15`, color: riskColor }}>
              {(session.riskLevel ?? "unknown").toUpperCase()} RISK
            </span>
            {session.lastActive && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> {timeAgo(session.lastActive)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
          {[
            { label: "Knowledge", value: session.knowledgeScore != null ? `${session.knowledgeScore}%` : "—" },
            { label: "Events", value: String(session.totalEvents ?? 0) },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
              <p className="text-sm font-bold text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Interventions</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Sessions requiring attention from service providers, programme coordinators, SAPS or DSD
        </p>
      </div>

      {/* Summary banner */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <div className="text-2xl font-black text-red-700">{data.summary.totalHighRisk}</div>
              <div className="text-xs font-semibold text-red-500">High-risk sessions</div>
              <div className="text-[11px] text-red-400 mt-0.5">Require immediate referral</div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-500 flex-shrink-0" />
            <div>
              <div className="text-2xl font-black text-orange-700">{data.summary.totalMediumRisk}</div>
              <div className="text-xs font-semibold text-orange-500">Medium-risk sessions</div>
              <div className="text-[11px] text-orange-400 mt-0.5">Monitor and support</div>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-3">
            <Phone className="w-8 h-8 text-purple-500 flex-shrink-0" />
            <div>
              <div className="text-2xl font-black text-purple-700">{data.summary.totalEmergencyVisits}</div>
              <div className="text-xs font-semibold text-purple-500">Emergency page visits</div>
              <div className="text-[11px] text-purple-400 mt-0.5">Sought immediate help</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === t.id ? "border-[#E8215D] text-[#E8215D]" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${activeTab === t.id ? "bg-[#E8215D] text-white" : "bg-gray-100 text-gray-600"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading intervention data...</div>}

      {!loading && activeTab === "high" && (
        <div className="space-y-3">
          {(data?.highRiskSessions ?? []).length === 0 ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-8 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="font-semibold text-green-700">No high-risk sessions detected</p>
            </div>
          ) : (
            (data?.highRiskSessions ?? []).map((s: SessionProfile) => (
              <SessionCard key={s.sessionId} session={s} riskColor="#EF4444" />
            ))
          )}
        </div>
      )}

      {!loading && activeTab === "medium" && (
        <div className="space-y-3">
          {(data?.mediumRiskSessions ?? []).length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
              <p className="text-gray-500 text-sm">No medium-risk sessions at this time</p>
            </div>
          ) : (
            (data?.mediumRiskSessions ?? []).map((s: SessionProfile) => (
              <SessionCard key={s.sessionId} session={s} riskColor="#F97316" />
            ))
          )}
        </div>
      )}

      {!loading && activeTab === "emergency" && (
        <div className="space-y-3">
          {(data?.emergencyVisitors ?? []).length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
              <p className="text-gray-500 text-sm">No emergency page visits recorded yet</p>
            </div>
          ) : (
            (data?.emergencyVisitors ?? []).map((v: any) => (
              <div key={v.sessionId} className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4">
                <Phone className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-mono text-xs font-bold text-gray-700">{maskId(v.sessionId)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Visited emergency page {v.visitCount} time{v.visitCount !== 1 ? "s" : ""}</p>
                </div>
                <span className="text-xs text-red-500">{v.lastVisit ? timeAgo(v.lastVisit) : ""}</span>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === "flags" && (
        <div className="space-y-4">
          {(data?.flagBreakdown ?? []).map((f: FlagBreakdown) => {
            const agencies = INTERVENTION_AGENCIES[f.flag] ?? ["DSD Social Services", "Childline 116"];
            return (
              <div key={f.flag} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{FLAG_LABELS[f.flag] ?? f.flag.replace(/_/g, " ")}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {f.provinces.length > 0 && `Provinces: ${f.provinces.slice(0, 3).join(", ")}`}
                      {f.grades.length > 0 && ` · Grades: ${f.grades.slice(0, 3).map(g => GRADE_LABELS[g] ?? g).join(", ")}`}
                    </p>
                  </div>
                  <span className="text-2xl font-black text-red-600 flex-shrink-0">{f.count}</span>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Recommended agencies for referral:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {agencies.map((agency) => (
                      <span key={agency} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold">{agency}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {(data?.flagBreakdown ?? []).length === 0 && (
            <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
              <p className="text-gray-500 text-sm">No risk flags recorded yet</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <strong>Intervention Protocol:</strong> All data shown is anonymous. High-risk sessions should be escalated to provincial DSD, Thuthuzela Care Centres, or NGO partners. Individual children cannot be contacted through this system — escalation works through programme outreach and geographic targeting.
        </p>
      </div>
    </div>
  );
}
