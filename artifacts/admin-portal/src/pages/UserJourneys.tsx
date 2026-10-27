import { useEffect, useState } from "react";
import { Users, Activity, AlertTriangle, Search, BookOpen, MapPin, ChevronRight, Clock, Brain, X } from "lucide-react";
import { fetchAdmin } from "../lib/api";
import { GRADE_LABELS, RISK_COLORS } from "../lib/demoData";

interface SessionProfile {
  sessionId: string;
  gradeLevel?: string;
  province?: string;
  areaType?: string;
  riskLevel?: string;
  hasRiskFlags?: boolean;
  knowledgeScore?: number;
  adaptiveLevel?: string;
  totalEvents?: number;
  totalSearches?: number;
  totalArticleReads?: number;
  totalProviderViews?: number;
  totalTetoMessages?: number;
  assessmentCompleted?: boolean;
  topicsExplored?: string[];
  pagesVisited?: string[];
  lastActive?: string;
  createdAt?: string;
}

interface SessionDetail {
  profile: SessionProfile | null;
  events: any[];
  searches: any[];
  assessment: any | null;
}

const EVENT_ICONS: Record<string, string> = {
  page_view: "📄",
  search: "🔍",
  article_read: "📖",
  provider_view: "🏥",
  official_view: "👤",
  review_submit: "⭐",
  teto_chat: "🐦",
  quiz_answer: "❓",
  assessment_step: "📝",
  assessment_complete: "✅",
  emergency_visit: "🚨",
  university_lesson: "🎓",
  tracker_action: "📋",
  square_browse: "🛍",
  knowledge_badge: "🏅",
  case_created: "📁",
  profile_update: "👤",
};

const EVENT_COLORS: Record<string, string> = {
  emergency_visit: "#EF4444",
  assessment_complete: "#16A34A",
  review_submit: "#F59E0B",
  teto_chat: "#7C3AED",
  search: "#2563EB",
  provider_view: "#0891B2",
  article_read: "#16A34A",
  default: "#94A3B8",
};

function maskSessionId(id: string): string {
  if (!id) return "—";
  const short = id.replace("anon_", "").slice(0, 12);
  return `SID-${short.toUpperCase()}`;
}

export default function UserJourneys() {
  const [sessions, setSessions] = useState<SessionProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState({ riskLevel: "", gradeLevel: "" });

  const loadSessions = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.riskLevel) params.set("riskLevel", filter.riskLevel);
    if (filter.gradeLevel) params.set("gradeLevel", filter.gradeLevel);
    params.set("limit", "50");

    fetchAdmin(`/admin/sessions?${params.toString()}`)
      .then((d: any) => {
        setSessions(d.sessions ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSessions(); }, [filter]);

  const openSession = (sessionId: string) => {
    setSelectedSession(sessionId);
    setDetailLoading(true);
    fetchAdmin(`/admin/sessions/${sessionId}`)
      .then((d: any) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900">User Journeys</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {total} anonymous sessions — full interaction history per user (no PII)
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={filter.riskLevel}
            onChange={(e) => setFilter((f) => ({ ...f, riskLevel: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8215D] bg-white"
          >
            <option value="">All risk levels</option>
            <option value="high">High risk</option>
            <option value="medium">Medium risk</option>
            <option value="low">Low risk</option>
            <option value="none">No risk</option>
          </select>
          <select
            value={filter.gradeLevel}
            onChange={(e) => setFilter((f) => ({ ...f, gradeLevel: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8215D] bg-white"
          >
            <option value="">All grades</option>
            {Object.entries(GRADE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions", value: total, icon: Users, color: "#E8215D" },
          { label: "With Risk Flags", value: sessions.filter(s => s.hasRiskFlags).length, icon: AlertTriangle, color: "#EF4444" },
          { label: "Assessment Done", value: sessions.filter(s => s.assessmentCompleted).length, icon: Brain, color: "#7C3AED" },
          { label: "Active (Today)", value: sessions.filter(s => s.lastActive && new Date(s.lastActive) > new Date(Date.now() - 86400000)).length, icon: Activity, color: "#16A34A" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" style={{ background: `${stat.color}15` }}>
              <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-black text-gray-900">{stat.value}</div>
            <div className="text-xs font-semibold text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Anonymous Sessions</h3>
          <p className="text-xs text-gray-400 mt-0.5">Click any session to view full interaction timeline</p>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No sessions yet — events will appear here once users interact with the app</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sessions.map((s) => (
              <button
                key={s.sessionId}
                onClick={() => openSession(s.sessionId)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: RISK_COLORS[s.riskLevel ?? "none"] ?? "#9CA3AF" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-semibold text-gray-700">{maskSessionId(s.sessionId)}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {s.gradeLevel && <span className="text-[11px] text-gray-400">{GRADE_LABELS[s.gradeLevel] ?? s.gradeLevel}</span>}
                    {s.province && <span className="text-[11px] text-gray-400">· {s.province}</span>}
                    {s.areaType && <span className="text-[11px] text-gray-400">· {s.areaType}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-5 flex-shrink-0 text-center">
                  <div>
                    <div className="text-sm font-black text-gray-800">{s.totalEvents ?? 0}</div>
                    <div className="text-[10px] text-gray-400">events</div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-800">{s.totalSearches ?? 0}</div>
                    <div className="text-[10px] text-gray-400">searches</div>
                  </div>
                  <div>
                    <div className="text-sm font-black" style={{ color: s.knowledgeScore ? (s.knowledgeScore >= 70 ? "#16A34A" : s.knowledgeScore >= 40 ? "#F97316" : "#EF4444") : "#9CA3AF" }}>
                      {s.knowledgeScore != null ? `${s.knowledgeScore}%` : "—"}
                    </div>
                    <div className="text-[10px] text-gray-400">knowledge</div>
                  </div>
                  {s.hasRiskFlags && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md flex-shrink-0">RISK</span>
                  )}
                  {s.assessmentCompleted && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md flex-shrink-0">✓</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Session Detail Drawer */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedSession(null)} />
          <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto z-10">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Session Detail</h3>
                <p className="text-xs font-mono text-gray-400">{maskSessionId(selectedSession)}</p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading journey...</div>
            ) : !detail ? (
              <div className="p-8 text-center text-gray-400 text-sm">No data available</div>
            ) : (
              <div className="p-5 space-y-5">
                {/* Profile summary */}
                {detail.profile && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Grade", value: GRADE_LABELS[detail.profile.gradeLevel ?? ""] ?? detail.profile.gradeLevel ?? "—" },
                      { label: "Province", value: detail.profile.province ?? "—" },
                      { label: "Area Type", value: detail.profile.areaType ?? "—" },
                      { label: "Knowledge", value: detail.profile.knowledgeScore != null ? `${detail.profile.knowledgeScore}%` : "—" },
                      { label: "Risk Level", value: detail.profile.riskLevel ?? "—" },
                      { label: "Adaptive Level", value: detail.profile.adaptiveLevel ?? "—" },
                      { label: "Total Events", value: String(detail.profile.totalEvents ?? 0) },
                      { label: "Assessment", value: detail.profile.assessmentCompleted ? "Completed" : "Incomplete" },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{item.label}</p>
                        <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Topics explored */}
                {detail.profile?.topicsExplored && detail.profile.topicsExplored.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Topics Explored</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.profile.topicsExplored.map((t) => (
                        <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Searches */}
                {detail.searches.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Search Queries ({detail.searches.length})</h4>
                    <div className="space-y-1.5">
                      {detail.searches.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Search className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span className="text-gray-700 flex-1">"{s.query}"</span>
                          <span className="text-[10px] text-gray-400">{new Date(s.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event timeline */}
                {detail.events.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Event Timeline ({detail.events.length})</h4>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                      <div className="space-y-3 pl-10">
                        {detail.events.map((e, i) => {
                          const color = EVENT_COLORS[e.eventType] ?? EVENT_COLORS.default;
                          const icon = EVENT_ICONS[e.eventType] ?? "📌";
                          return (
                            <div key={i} className="relative">
                              <div
                                className="absolute -left-6 w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white shadow-sm"
                                style={{ background: `${color}20` }}
                              >
                                {icon}
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-700">{e.eventType.replace(/_/g, " ")}</span>
                                  <span className="text-[10px] text-gray-400">{new Date(e.createdAt).toLocaleTimeString()}</span>
                                </div>
                                {e.eventData && Object.keys(e.eventData).length > 0 && (
                                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                    {JSON.stringify(e.eventData).slice(0, 80)}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
