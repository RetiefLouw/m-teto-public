import { useEffect, useState } from "react";
import { FileText, Download, BarChart3, Users, AlertTriangle, Search, Activity, Printer } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area,
} from "recharts";
import { fetchAdmin } from "../lib/api";
import { GRADE_LABELS, CHART_COLORS, RISK_COLORS } from "../lib/demoData";

interface ReportData {
  generatedAt: string;
  totals: {
    totalSessions: number;
    riskCount: number;
    avgKnowledge: number;
    assessmentsCompleted: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  byGrade: any[];
  byProvince: any[];
  byAreaType: any[];
  topSearches: any[];
  eventTypeSummary: any[];
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<"collective" | "session">("collective");
  const [sessionId, setSessionId] = useState("");
  const [sessionReport, setSessionReport] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  useEffect(() => {
    fetchAdmin("/admin/reports/collective")
      .then((d: any) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadSessionReport = () => {
    if (!sessionId.trim()) return;
    setSessionLoading(true);
    fetchAdmin(`/admin/reports/session/${sessionId.trim()}`)
      .then((d: any) => setSessionReport(d))
      .catch(() => setSessionReport(null))
      .finally(() => setSessionLoading(false));
  };

  const printReport = () => window.print();

  const gradeData = (data?.byGrade ?? []).map((g: any) => ({
    name: GRADE_LABELS[g.gradeLevel] ?? g.gradeLevel ?? "—",
    sessions: Number(g.count),
    risk: Number(g.riskCount),
    knowledge: Number(g.avgKnowledge ?? 0),
  }));

  const provinceData = (data?.byProvince ?? []).map((p: any) => ({
    name: p.province ?? "—",
    sessions: Number(p.count),
    risk: Number(p.riskCount),
  }));

  const eventData = (data?.eventTypeSummary ?? []).slice(0, 10).map((e: any, i: number) => ({
    name: e.eventType?.replace(/_/g, " ") ?? "—",
    count: Number(e.count),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Reports</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Generate and print collective or individual session reports
          </p>
        </div>
        <button
          onClick={printReport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / Export
        </button>
      </div>

      {/* Report type selector */}
      <div className="flex gap-3 print:hidden">
        {[
          { id: "collective" as const, label: "Collective Report", icon: BarChart3, desc: "Aggregated data for all users" },
          { id: "session" as const, label: "Individual Session", icon: Users, desc: "Single anonymous user journey" },
        ].map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id)}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all text-left ${
              activeReport === r.id
                ? "border-[#E8215D] bg-[#E8215D08]"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <r.icon className={`w-5 h-5 ${activeReport === r.id ? "text-[#E8215D]" : "text-gray-400"}`} />
            <div>
              <p className={`text-sm font-bold ${activeReport === r.id ? "text-[#E8215D]" : "text-gray-700"}`}>{r.label}</p>
              <p className="text-[11px] text-gray-400">{r.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {activeReport === "collective" && (
        <>
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Generating report...</div>
          ) : !data ? (
            <div className="text-center py-12 text-gray-400 text-sm">Report data unavailable</div>
          ) : (
            <div className="space-y-6" id="collective-report">
              {/* Report header */}
              <div className="bg-[#0F172A] text-white rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-black">M-TETO Platform — Collective Data Report</h1>
                    <p className="text-slate-400 text-sm mt-1">Anonymous & Aggregated · South Africa SRGBV Response Platform</p>
                    <p className="text-slate-500 text-xs mt-2">Generated: {new Date(data.generatedAt).toLocaleString("en-ZA")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">{data.totals.totalSessions}</p>
                    <p className="text-slate-400 text-xs">Total Sessions</p>
                  </div>
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Assessments Completed", value: data.totals.assessmentsCompleted, color: "#16A34A" },
                  { label: "Sessions with Risk Flags", value: `${data.totals.riskCount} (${data.totals.totalSessions ? Math.round((data.totals.riskCount / data.totals.totalSessions) * 100) : 0}%)`, color: "#EF4444" },
                  { label: "Avg Knowledge Score", value: `${data.totals.avgKnowledge ?? 0}%`, color: "#7C3AED" },
                  { label: "High Risk Cases", value: data.totals.highRisk, color: "#DC2626" },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="text-2xl font-black" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5 font-medium">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Sessions by Province</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={provinceData} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} width={110} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="sessions" fill="#E8215D" radius={[0, 4, 4, 0]} name="Sessions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Knowledge & Risk by Grade</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={gradeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="knowledge" fill="#7C3AED" name="Avg Knowledge %" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="risk" fill="#EF4444" name="Risk Flags" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Top 10 Search Queries</h3>
                  <div className="space-y-2">
                    {(data.topSearches ?? []).slice(0, 10).map((q: any, i: number) => {
                      const max = data.topSearches[0]?.count ?? 1;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 w-4">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs text-gray-700 truncate pr-2">"{q.query}"</span>
                              <span className="text-xs font-bold text-gray-600 flex-shrink-0">{q.count}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${(q.count / max) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Platform Interactions by Type</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={eventData} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} width={130} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Count">
                        {eventData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500">
                  <strong>CONFIDENTIAL</strong> — M-TETO Platform Collective Report · All data is anonymised and aggregated · No personally identifiable information is stored or displayed · For authorised stakeholders only
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {activeReport === "session" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Session ID</label>
            <div className="flex gap-3">
              <input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="e.g. anon_1773654000_abc123ef"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-[#E8215D] transition-colors"
              />
              <button
                onClick={loadSessionReport}
                disabled={!sessionId.trim() || sessionLoading}
                className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#E8215D" }}
              >
                {sessionLoading ? "Loading..." : "Generate"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Find session IDs in the User Journeys page</p>
          </div>

          {sessionReport && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="bg-[#0F172A] text-white rounded-lg p-4">
                <h3 className="font-black text-base">Individual Session Report</h3>
                <p className="text-slate-400 text-xs mt-0.5">Anonymous · {new Date().toLocaleDateString("en-ZA")}</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Grade", value: GRADE_LABELS[sessionReport.profile?.gradeLevel] ?? sessionReport.profile?.gradeLevel ?? "—" },
                  { label: "Province", value: sessionReport.profile?.province ?? "—" },
                  { label: "Knowledge Score", value: sessionReport.profile?.knowledgeScore != null ? `${sessionReport.profile.knowledgeScore}%` : "—" },
                  { label: "Risk Level", value: sessionReport.profile?.riskLevel ?? "—" },
                  { label: "Total Events", value: sessionReport.eventCount ?? 0 },
                  { label: "Total Searches", value: sessionReport.searches?.length ?? 0 },
                  { label: "Journey (mins)", value: sessionReport.journeyDuration ?? 0 },
                  { label: "Adaptive Level", value: sessionReport.profile?.adaptiveLevel ?? "—" },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{String(item.value)}</p>
                  </div>
                ))}
              </div>
              {sessionReport.eventTimeline && Object.keys(sessionReport.eventTimeline).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Interaction Summary</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(sessionReport.eventTimeline).map(([type, count]) => (
                      <span key={type} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                        {type.replace(/_/g, " ")} × {String(count)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sessionReport.searches?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Search Queries ({sessionReport.searches.length})</h4>
                  <div className="space-y-1">
                    {sessionReport.searches.map((s: any, i: number) => (
                      <p key={i} className="text-xs text-gray-600">· "{s.query}"</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
