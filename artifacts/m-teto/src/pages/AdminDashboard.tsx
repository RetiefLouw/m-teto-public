import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, AlertTriangle, BookOpen, Search, TrendingUp, LogOut, Lock, ChevronRight, BarChart3, MapPin, Activity, Star, BadgeCheck, Flag } from "lucide-react";

const API_BASE = "/api";

const GRADE_LABELS: Record<string, string> = {
  grade_1_2: "Grade 1–2",
  grade_3_5: "Grade 3–5",
  grade_6_7: "Grade 6–7",
  grade_8_12: "Grade 8–12",
};

const RISK_COLORS: Record<string, string> = {
  high: "#EF4444",
  medium: "#F97316",
  low: "#EAB308",
  none: "#22C55E",
};

const DEMO_DATA = {
  overview: {
    totals: {
      assessments: 142,
      withRiskFlags: 23,
      avgKnowledgeScore: 58,
      completed: 119,
      searches: 487,
    },
    riskByLevel: [
      { riskLevel: "high", count: 18 },
      { riskLevel: "medium", count: 31 },
      { riskLevel: "low", count: 44 },
      { riskLevel: "none", count: 49 },
    ],
    recentActivity: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split("T")[0],
      count: Math.floor(Math.random() * 15) + 3,
    })),
  },
  demographics: {
    byProvince: [
      { province: "Gauteng", count: 48, riskCount: 9 },
      { province: "Western Cape", count: 32, riskCount: 5 },
      { province: "KwaZulu-Natal", count: 27, riskCount: 6 },
      { province: "Eastern Cape", count: 18, riskCount: 4 },
      { province: "Limpopo", count: 11, riskCount: 3 },
      { province: "Mpumalanga", count: 6, riskCount: 2 },
    ],
    byGrade: [
      { gradeLevel: "grade_1_2", count: 22 },
      { gradeLevel: "grade_3_5", count: 45 },
      { gradeLevel: "grade_6_7", count: 38 },
      { gradeLevel: "grade_8_12", count: 37 },
    ],
    byGender: [
      { gender: "Girl", count: 68 },
      { gender: "Boy", count: 44 },
      { gender: "Non-binary/Gender non-conforming", count: 18 },
      { gender: "Prefer not to say", count: 12 },
    ],
    byRace: [
      { race: "Black African", count: 82 },
      { race: "Coloured", count: 28 },
      { race: "Indian/Asian", count: 17 },
      { race: "White", count: 10 },
      { race: "Other", count: 5 },
    ],
    byAreaType: [
      { areaType: "township", count: 55 },
      { areaType: "city", count: 42 },
      { areaType: "town", count: 28 },
      { areaType: "rural", count: 17 },
    ],
    bySchoolType: [
      { schoolType: "Public school", count: 103 },
      { schoolType: "Private school", count: 24 },
      { schoolType: "Home schooled", count: 11 },
      { schoolType: "Other", count: 4 },
    ],
  },
  risk: {
    hotspots: [
      { province: "Gauteng", areaType: "township", total: 28, riskCount: 8, highRisk: 4, mediumRisk: 4 },
      { province: "KwaZulu-Natal", areaType: "rural", total: 15, riskCount: 5, highRisk: 3, mediumRisk: 2 },
      { province: "Eastern Cape", areaType: "township", total: 12, riskCount: 4, highRisk: 2, mediumRisk: 2 },
      { province: "Western Cape", areaType: "city", total: 22, riskCount: 3, highRisk: 1, mediumRisk: 2 },
    ],
    flagCounts: [
      { flag: "witnessed_violence_at_home", count: 14 },
      { flag: "experienced_violence_at_school", count: 12 },
      { flag: "not_feel_safe_at_school", count: 11 },
      { flag: "experienced_online_harassment", count: 9 },
      { flag: "not_know_who_to_tell", count: 8 },
    ],
    riskByGrade: [
      { gradeLevel: "grade_1_2", highRisk: 3, mediumRisk: 5, lowRisk: 7, noRisk: 7, total: 22 },
      { gradeLevel: "grade_3_5", highRisk: 5, mediumRisk: 12, lowRisk: 15, noRisk: 13, total: 45 },
      { gradeLevel: "grade_6_7", highRisk: 6, mediumRisk: 9, lowRisk: 12, noRisk: 11, total: 38 },
      { gradeLevel: "grade_8_12", highRisk: 4, mediumRisk: 5, lowRisk: 10, noRisk: 18, total: 37 },
    ],
  },
  knowledge: {
    byGrade: [
      { gradeLevel: "grade_1_2", avgScore: 38, count: 22, high: 3, medium: 8, low: 11 },
      { gradeLevel: "grade_3_5", avgScore: 52, count: 45, high: 14, medium: 19, low: 12 },
      { gradeLevel: "grade_6_7", avgScore: 64, count: 38, high: 18, medium: 14, low: 6 },
      { gradeLevel: "grade_8_12", avgScore: 72, count: 37, high: 22, medium: 11, low: 4 },
    ],
    histogram: [
      { range: "0-10", count: 4 },
      { range: "11-20", count: 8 },
      { range: "21-30", count: 11 },
      { range: "31-40", count: 18 },
      { range: "41-50", count: 22 },
      { range: "51-60", count: 27 },
      { range: "61-70", count: 24 },
      { range: "71-80", count: 16 },
      { range: "81-90", count: 8 },
      { range: "91-100", count: 4 },
    ],
  },
  searches: {
    topQueries: [
      { query: "what is srgbv", count: 34 },
      { query: "how to report abuse", count: 28 },
      { query: "childline south africa", count: 24 },
      { query: "children's rights", count: 22 },
      { query: "what is consent", count: 19 },
      { query: "gender based violence", count: 17 },
      { query: "protection order", count: 15 },
      { query: "bullying at school", count: 14 },
      { query: "sanitary pads free", count: 11 },
      { query: "mental health support", count: 10 },
    ],
    byGrade: [
      { gradeLevel: "grade_1_2", count: 62 },
      { gradeLevel: "grade_3_5", count: 148 },
      { gradeLevel: "grade_6_7", count: 143 },
      { gradeLevel: "grade_8_12", count: 134 },
    ],
    byProvince: [
      { province: "Gauteng", count: 182 },
      { province: "Western Cape", count: 108 },
      { province: "KwaZulu-Natal", count: 97 },
      { province: "Eastern Cape", count: 55 },
      { province: "Limpopo", count: 45 },
    ],
    recentSearches: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split("T")[0],
      count: Math.floor(Math.random() * 40) + 15,
    })),
  },
};

function BarChart({ items, labelKey, valueKey, maxValue, color = "#E8215D", showPercent = false }: any) {
  const max = maxValue ?? Math.max(...items.map((i: any) => i[valueKey]));
  return (
    <div className="space-y-2">
      {items.map((item: any, i: number) => {
        const pct = max > 0 ? (item[valueKey] / max) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="w-32 flex-shrink-0 text-xs text-gray-600 truncate text-right">
              {item[labelKey]}
            </div>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <motion.div
                className="h-full rounded-full flex items-center pl-2"
                style={{ background: color, width: `${pct}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              />
            </div>
            <div className="w-10 text-right text-xs font-bold text-gray-700">
              {showPercent ? `${item[valueKey]}%` : item[valueKey]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutSlice({ pct, offset, color }: { pct: number; offset: number; color: string }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  return (
    <circle
      cx="50" cy="50" r={r}
      fill="none"
      stroke={color}
      strokeWidth="18"
      strokeDasharray={`${(pct / 100) * circ} ${circ}`}
      strokeDashoffset={-((offset / 100) * circ)}
      transform="rotate(-90 50 50)"
    />
  );
}

function MiniDonut({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const parts = slices.map((s) => {
    const pct = (s.value / total) * 100;
    const o = offset;
    offset += pct;
    return { ...s, pct, offset: o };
  });
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 flex-shrink-0">
        {parts.map((p, i) => (
          <DonutSlice key={i} pct={p.pct} offset={p.offset} color={p.color} />
        ))}
      </svg>
      <div className="flex flex-col gap-1">
        {parts.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-xs text-gray-600 truncate">{p.label}</span>
            <span className="text-xs font-bold ml-auto pl-2 text-gray-800">{Math.round(p.pct)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black text-gray-900">{value}</div>
      <div className="text-sm font-semibold text-gray-700 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

type Tab = "overview" | "demographics" | "risk" | "knowledge" | "searches" | "officials";

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("admin_authed") === "1");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<typeof DEMO_DATA | null>(null);
  const [loading, setLoading] = useState(false);
  const [useDemoData, setUseDemoData] = useState(false);
  const [officialsReviewData, setOfficialsReviewData] = useState<any>(null);
  const [officialsLoading, setOfficialsLoading] = useState(false);
  const tryLogin = async () => {
    try {
      const response = await fetch("/api/admin/overview", {
        headers: { "X-Admin-Pin": pin },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Unauthorized");
      sessionStorage.setItem("admin_authed", "1");
      sessionStorage.setItem("mteto_admin_pin", pin);
      setAuthed(true);
      setPinError(false);
    } catch {
      setPinError(true);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const headers = { "X-Admin-Pin": sessionStorage.getItem("mteto_admin_pin") ?? "" };
      const [ov, dem, risk, know, srch] = await Promise.all([
        fetch(`/api/admin/overview`, { headers, credentials: "include" }).then((r) => r.json()),
        fetch(`/api/admin/demographics`, { headers, credentials: "include" }).then((r) => r.json()),
        fetch(`/api/admin/risk`, { headers, credentials: "include" }).then((r) => r.json()),
        fetch(`/api/admin/knowledge`, { headers, credentials: "include" }).then((r) => r.json()),
        fetch(`/api/admin/searches`, { headers, credentials: "include" }).then((r) => r.json()),
      ]);
      setData({ overview: ov, demographics: dem, risk, knowledge: know, searches: srch });
      setUseDemoData(false);
    } catch {
      setData(DEMO_DATA);
      setUseDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficialsData = async () => {
    setOfficialsLoading(true);
    try {
      const [officials, reviews] = await Promise.all([
        fetch(`/api/providers?province=Gauteng&limit=999`, { credentials: "include" }).then((r) => r.json()),
        fetch(`/api/admin/official-reviews`, { credentials: "include" }).then((r) => r.json()),
      ]);
      setOfficialsReviewData({ officials, reviews });
    } catch {
      setOfficialsReviewData(null);
    } finally {
      setOfficialsLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchAll();
  }, [authed]);

  useEffect(() => {
    if (authed && tab === "officials" && !officialsReviewData) {
      fetchOfficialsData();
    }
  }, [authed, tab]);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #0F0C29, #302B63, #24243E)" }}>
        <motion.div
          className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8215D, #7C3AED)" }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-black text-2xl text-gray-900 mb-1">Admin Access</h1>
          <p className="text-sm text-muted-foreground mb-6">M-TETO Analytics Dashboard<br />Enter your admin PIN to continue</p>

          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            placeholder="Enter PIN"
            className="w-full border-2 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest outline-none mb-3 transition-all focus:border-pink-400"
            style={{ borderColor: pinError ? "#EF4444" : "#E5E7EB" }}
            maxLength={20}
          />
          {pinError && <p className="text-red-500 text-xs mb-3">Incorrect PIN. Please try again.</p>}

          <button
            onClick={tryLogin}
            className="w-full py-3 rounded-xl font-display font-bold text-white text-base transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #E8215D, #7C3AED)" }}
          >
            <Lock className="inline w-4 h-4 mr-2" />
            Unlock Dashboard
          </button>
          <p className="text-xs text-muted-foreground mt-4">
            For authorised stakeholders only.<br />UN, UNFPA, Government Departments, NGOs.
          </p>
        </motion.div>
      </div>
    );
  }

  const d = data ?? DEMO_DATA;

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "demographics", label: "Demographics", icon: Users },
    { id: "risk", label: "Risk & Safety", icon: AlertTriangle },
    { id: "knowledge", label: "Knowledge", icon: BookOpen },
    { id: "searches", label: "Searches", icon: Search },
    { id: "officials", label: "Officials", icon: BadgeCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8215D, #7C3AED)" }}>
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-display font-black text-base text-gray-900">M-TETO Analytics</h1>
              <p className="text-[10px] text-muted-foreground">Anonymous • Disaggregated • Protected</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {useDemoData && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">DEMO DATA</span>
            )}
            <button
              onClick={() => { sessionStorage.removeItem("admin_authed"); setAuthed(false); }}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 gap-0 border-t border-gray-100">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold flex-shrink-0 border-b-2 transition-all"
              style={{
                borderColor: tab === t.id ? "#E8215D" : "transparent",
                color: tab === t.id ? "#E8215D" : "#9CA3AF",
              }}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── OVERVIEW ────────────────────────────────────────────────── */}
            {tab === "overview" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Assessments" value={d.overview.totals.assessments} sub="Total completed" icon={Users} color="#E8215D" />
                  <StatCard label="Risk Flags" value={d.overview.totals.withRiskFlags} sub={`of ${d.overview.totals.assessments} total`} icon={AlertTriangle} color="#EF4444" />
                  <StatCard label="Avg. Knowledge" value={`${d.overview.totals.avgKnowledgeScore}%`} sub="Across all grades" icon={BookOpen} color="#7C3AED" />
                  <StatCard label="Searches" value={d.overview.totals.searches} sub="Total search queries" icon={Search} color="#2563EB" />
                </div>

                {/* Risk distribution */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Risk Level Distribution</h3>
                  <MiniDonut
                    slices={d.overview.riskByLevel
                      .filter((r) => r.riskLevel)
                      .map((r) => ({
                        label: r.riskLevel ? r.riskLevel.charAt(0).toUpperCase() + r.riskLevel.slice(1) + " Risk" : "Unknown",
                        value: Number(r.count),
                        color: RISK_COLORS[r.riskLevel ?? "none"] ?? "#9CA3AF",
                      }))}
                  />
                </div>

                {/* Activity trend */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-3">Daily Assessments (14 days)</h3>
                  <div className="flex items-end gap-1 h-24">
                    {d.overview.recentActivity.map((r, i) => {
                      const maxCount = Math.max(...d.overview.recentActivity.map((x) => Number(x.count)));
                      const pct = maxCount > 0 ? (Number(r.count) / maxCount) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <motion.div
                            className="w-full rounded-t-sm"
                            style={{ height: `${pct}%`, background: i === d.overview.recentActivity.length - 1 ? "#E8215D" : "#FECDD3", minHeight: 4 }}
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ duration: 0.5, delay: i * 0.03 }}
                          />
                          {(i === 0 || i === 6 || i === 13) && (
                            <span className="text-[8px] text-gray-400 rotate-45 origin-left mt-1">
                              {r.date.slice(5)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium">
                    🔒 All data is <strong>anonymous and aggregated</strong>. No personally identifiable information is stored or displayed. Data may be used by authorised stakeholders (UN, UNFPA, government departments, SAPS, NGOs) for policy, resource allocation, and SRGBV response.
                  </p>
                </div>
              </div>
            )}

            {/* ── DEMOGRAPHICS ────────────────────────────────────────────── */}
            {tab === "demographics" && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-pink-500" /> By Province
                  </h3>
                  <BarChart
                    items={d.demographics.byProvince}
                    labelKey="province"
                    valueKey="count"
                    color="#E8215D"
                  />
                  <div className="mt-3 text-xs text-muted-foreground">
                    Risk flag rate by province shown below
                  </div>
                  <div className="mt-2 space-y-1">
                    {d.demographics.byProvince.map((p: any, i: number) => {
                      const rate = p.count > 0 ? Math.round((Number(p.riskCount) / Number(p.count)) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{p.province}</span>
                          <span className="font-bold" style={{ color: rate > 20 ? "#EF4444" : rate > 10 ? "#F97316" : "#22C55E" }}>
                            {rate}% risk flags
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-4">By Grade Level</h3>
                  <BarChart
                    items={d.demographics.byGrade.map((g: any) => ({ ...g, gradeLabel: GRADE_LABELS[g.gradeLevel] || g.gradeLevel }))}
                    labelKey="gradeLabel"
                    valueKey="count"
                    color="#7C3AED"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Gender Identity</h3>
                    <MiniDonut
                      slices={d.demographics.byGender.map((g: any, i: number) => ({
                        label: g.gender,
                        value: Number(g.count),
                        color: ["#E8215D", "#F4826C", "#7C3AED", "#A78BFA"][i % 4],
                      }))}
                    />
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Racial Group</h3>
                    <BarChart
                      items={d.demographics.byRace}
                      labelKey="race"
                      valueKey="count"
                      color="#F97316"
                    />
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Area Type</h3>
                    <MiniDonut
                      slices={d.demographics.byAreaType.map((a: any, i: number) => ({
                        label: a.areaType?.charAt(0).toUpperCase() + a.areaType?.slice(1),
                        value: Number(a.count),
                        color: ["#2563EB", "#7C3AED", "#E8215D", "#F59E0B"][i % 4],
                      }))}
                    />
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-display font-bold text-sm text-gray-900 mb-4">School Type</h3>
                    <BarChart
                      items={d.demographics.bySchoolType}
                      labelKey="schoolType"
                      valueKey="count"
                      color="#10B981"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── RISK & SAFETY ────────────────────────────────────────────── */}
            {tab === "risk" && (
              <div className="space-y-5">
                {/* Geographic hotspots */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Geographic Risk Hotspots
                  </h3>
                  <div className="space-y-2">
                    {d.risk.hotspots.map((h: any, i: number) => {
                      const riskRate = h.total > 0 ? Math.round((Number(h.riskCount) / Number(h.total)) * 100) : 0;
                      const severity = riskRate > 30 ? "high" : riskRate > 15 ? "medium" : "low";
                      return (
                        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ background: RISK_COLORS[severity] }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">{h.province} — {h.areaType}</p>
                            <p className="text-xs text-muted-foreground">{h.total} assessments • {h.highRisk} high risk, {h.mediumRisk} medium risk</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-black" style={{ color: RISK_COLORS[severity] }}>
                              {riskRate}%
                            </div>
                            <div className="text-[10px] text-muted-foreground">risk rate</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Risk flag types */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Most Common Risk Indicators</h3>
                  <BarChart
                    items={d.risk.flagCounts.map((f: any) => ({
                      ...f,
                      label: f.flag.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
                    }))}
                    labelKey="label"
                    valueKey="count"
                    color="#EF4444"
                  />
                </div>

                {/* Risk by grade */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Risk Level by Grade</h3>
                  <div className="space-y-3">
                    {d.risk.riskByGrade.map((g: any) => {
                      const total = Number(g.total) || 1;
                      return (
                        <div key={g.gradeLevel}>
                          <p className="text-xs font-bold text-gray-700 mb-1.5">{GRADE_LABELS[g.gradeLevel] || g.gradeLevel}</p>
                          <div className="flex rounded-full overflow-hidden h-5">
                            {[
                              { val: Number(g.highRisk), color: "#EF4444", label: "High" },
                              { val: Number(g.mediumRisk), color: "#F97316", label: "Med" },
                              { val: Number(g.lowRisk), color: "#EAB308", label: "Low" },
                              { val: Number(g.noRisk), color: "#22C55E", label: "None" },
                            ].map((seg, i) => {
                              const pct = (seg.val / total) * 100;
                              return pct > 0 ? (
                                <motion.div
                                  key={i}
                                  className="flex items-center justify-center text-[9px] text-white font-bold"
                                  style={{ background: seg.color, width: `${pct}%` }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.5, delay: 0.1 * i }}
                                  title={`${seg.label}: ${seg.val}`}
                                >
                                  {pct > 10 ? seg.val : ""}
                                </motion.div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 mt-3 flex-wrap">
                    {[
                      { color: "#EF4444", label: "High Risk" },
                      { color: "#F97316", label: "Medium Risk" },
                      { color: "#EAB308", label: "Low Risk" },
                      { color: "#22C55E", label: "No Risk" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                        <span className="text-xs text-gray-600">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── KNOWLEDGE ────────────────────────────────────────────────── */}
            {tab === "knowledge" && (
              <div className="space-y-5">
                {/* Average by grade */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Average Knowledge Score by Grade</h3>
                  <div className="flex items-end gap-4 h-36 mb-3">
                    {d.knowledge.byGrade.map((g: any, i: number) => {
                      const pct = g.avgScore;
                      const color = pct >= 70 ? "#22C55E" : pct >= 50 ? "#EAB308" : pct >= 40 ? "#F97316" : "#EF4444";
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-black" style={{ color }}>{g.avgScore}%</span>
                          <motion.div
                            className="w-full rounded-t-xl"
                            style={{ height: `${pct}%`, background: color, minHeight: 8 }}
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                          />
                          <span className="text-[9px] text-muted-foreground text-center leading-tight">
                            {GRADE_LABELS[g.gradeLevel]?.replace("Grade ", "Gr. ") || g.gradeLevel}
                          </span>
                          <span className="text-[9px] text-muted-foreground">n={g.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Score performance breakdown */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Performance Band by Grade</h3>
                  <div className="space-y-3">
                    {d.knowledge.byGrade.map((g: any) => {
                      const total = g.count || 1;
                      return (
                        <div key={g.gradeLevel}>
                          <p className="text-xs font-bold text-gray-700 mb-1.5">{GRADE_LABELS[g.gradeLevel]}</p>
                          <div className="flex rounded-full overflow-hidden h-5">
                            {[
                              { val: Number(g.high), color: "#22C55E", label: "Champion (70%+)" },
                              { val: Number(g.medium), color: "#EAB308", label: "Learner (40-70%)" },
                              { val: Number(g.low), color: "#F97316", label: "Explorer (<40%)" },
                            ].map((seg, i) => {
                              const pct = (seg.val / total) * 100;
                              return pct > 0 ? (
                                <motion.div
                                  key={i}
                                  style={{ background: seg.color, width: `${pct}%` }}
                                  className="flex items-center justify-center text-[9px] text-white font-bold"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.5, delay: i * 0.1 }}
                                  title={seg.label}
                                >
                                  {pct > 12 ? `${Math.round(pct)}%` : ""}
                                </motion.div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-3">
                    {[
                      { color: "#22C55E", label: "Champion (70%+)" },
                      { color: "#EAB308", label: "Learner (40–70%)" },
                      { color: "#F97316", label: "Explorer (<40%)" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                        <span className="text-xs text-gray-600">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score histogram */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Score Distribution (All Users)</h3>
                  <div className="flex items-end gap-1 h-28">
                    {d.knowledge.histogram.map((h: any, i: number) => {
                      const maxCount = Math.max(...d.knowledge.histogram.map((x: any) => Number(x.count)));
                      const pct = maxCount > 0 ? (Number(h.count) / maxCount) * 100 : 0;
                      const hue = (i / d.knowledge.histogram.length) * 120;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <motion.div
                            className="w-full rounded-t-sm"
                            style={{ height: `${pct}%`, background: `hsl(${hue}, 70%, 55%)`, minHeight: 4 }}
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ duration: 0.4, delay: i * 0.04 }}
                          />
                          <span className="text-[8px] text-gray-400">{h.range.split("-")[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Score range (0–100)</p>
                </div>
              </div>
            )}

            {/* ── SEARCHES ─────────────────────────────────────────────────── */}
            {tab === "searches" && (
              <div className="space-y-5">
                {/* Top queries */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" /> Top Search Queries
                  </h3>
                  <div className="space-y-2">
                    {d.searches.topQueries.map((q: any, i: number) => {
                      const maxCount = Number(d.searches.topQueries[0]?.count ?? 1);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-black flex-shrink-0"
                            style={{ background: i < 3 ? "#E8215D" : "#9CA3AF" }}
                          >
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-800 truncate">"{q.query}"</div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: "#2563EB", width: `${(Number(q.count) / maxCount) * 100}%` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(Number(q.count) / maxCount) * 100}%` }}
                                transition={{ duration: 0.5, delay: i * 0.04 }}
                              />
                            </div>
                          </div>
                          <div className="text-xs font-bold text-gray-700 flex-shrink-0">{q.count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Searches by Grade Level</h3>
                  <BarChart
                    items={d.searches.byGrade.map((g: any) => ({
                      ...g,
                      gradeLabel: GRADE_LABELS[g.gradeLevel] || g.gradeLevel,
                    }))}
                    labelKey="gradeLabel"
                    valueKey="count"
                    color="#2563EB"
                  />
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Searches by Province</h3>
                  <BarChart
                    items={d.searches.byProvince}
                    labelKey="province"
                    valueKey="count"
                    color="#7C3AED"
                  />
                </div>

                {/* Search trend */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-display font-bold text-sm text-gray-900 mb-3">Daily Searches (14 days)</h3>
                  <div className="flex items-end gap-1 h-24">
                    {d.searches.recentSearches.map((r: any, i: number) => {
                      const maxCount = Math.max(...d.searches.recentSearches.map((x: any) => Number(x.count)));
                      const pct = maxCount > 0 ? (Number(r.count) / maxCount) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-end">
                          <motion.div
                            className="w-full rounded-t-sm"
                            style={{ height: `${pct}%`, background: i === d.searches.recentSearches.length - 1 ? "#2563EB" : "#BFDBFE", minHeight: 4 }}
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ duration: 0.4, delay: i * 0.03 }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <p className="text-xs text-green-700">
                    ✅ Search queries are stored <strong>anonymously</strong> with only grade level and province metadata. No search history is linked to individual users.
                  </p>
                </div>
              </div>
            )}
            {/* ── OFFICIALS ACCOUNTABILITY ──────────────────────────────── */}
            {tab === "officials" && (
              <div className="space-y-5">
                {officialsLoading ? (
                  <div className="py-16 text-center text-muted-foreground animate-pulse">
                    <BadgeCheck className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Loading officials data…</p>
                  </div>
                ) : !officialsReviewData ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
                    <p className="text-sm text-muted-foreground mb-3">No officials data available yet.</p>
                    <button
                      onClick={fetchOfficialsData}
                      className="text-xs font-bold text-pink-600 underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : (() => {
                  const reviews: any[] = officialsReviewData.reviews?.reviews ?? [];
                  const officialStats = new Map<string, {
                    name: string;
                    title: string;
                    providerName: string;
                    totalReviews: number;
                    avgScore: number;
                    flags: number;
                    recognitions: number;
                    flagTypes: Record<string, number>;
                  }>();

                  reviews.forEach((r: any) => {
                    const key = r.review?.officialId;
                    if (!key) return;
                    const existing = officialStats.get(key);
                    const flag = r.review?.conductFlag;
                    const isFlagged = flag && flag !== "none";
                    const isRecognition = r.review?.score >= 4 && !isFlagged;
                    if (!existing) {
                      officialStats.set(key, {
                        name: r.officialName ?? "Unknown",
                        title: r.officialTitle ?? "",
                        providerName: r.providerName ?? "",
                        totalReviews: 1,
                        avgScore: r.review?.score ?? 0,
                        flags: isFlagged ? 1 : 0,
                        recognitions: isRecognition ? 1 : 0,
                        flagTypes: isFlagged ? { [flag]: 1 } : {},
                      });
                    } else {
                      existing.totalReviews++;
                      existing.avgScore = (existing.avgScore * (existing.totalReviews - 1) + (r.review?.score ?? 0)) / existing.totalReviews;
                      if (isFlagged) {
                        existing.flags++;
                        existing.flagTypes[flag] = (existing.flagTypes[flag] ?? 0) + 1;
                      }
                      if (isRecognition) existing.recognitions++;
                    }
                  });

                  const statsArr = Array.from(officialStats.entries()).map(([id, s]) => ({ id, ...s }));
                  const flagged = statsArr.filter((s) => s.flags >= 2).sort((a, b) => b.flags - a.flags);
                  const topRated = statsArr.filter((s) => s.totalReviews >= 1).sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);
                  const totalFlagged = statsArr.filter((s) => s.flags > 0).length;

                  return (
                    <>
                      {/* Summary stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                          <div className="text-2xl font-black text-gray-900">{reviews.length}</div>
                          <div className="text-xs font-semibold text-gray-600 mt-0.5">Total Reviews</div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                          <div className="text-2xl font-black text-red-600">{flagged.length}</div>
                          <div className="text-xs font-semibold text-gray-600 mt-0.5">With ≥2 Flags</div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                          <div className="text-2xl font-black text-yellow-500">{totalFlagged}</div>
                          <div className="text-xs font-semibold text-gray-600 mt-0.5">Any Flags</div>
                        </div>
                      </div>

                      {/* MISCONDUCT PANEL — officials with ≥2 flags */}
                      {flagged.length > 0 && (
                        <div className="bg-red-50 rounded-2xl p-4 border border-red-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                              <Flag className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <h3 className="font-display font-bold text-sm text-red-800">Misconduct Alerts</h3>
                              <p className="text-[10px] text-red-600">Officials with 2 or more conduct flags — requires follow-up</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {flagged.map((official) => (
                              <div key={official.id} className="bg-white rounded-xl p-3 border border-red-100">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-bold text-sm text-gray-900">{official.name}</p>
                                    <p className="text-xs text-gray-500">{official.title} • {official.providerName}</p>
                                  </div>
                                  <div className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded-lg shrink-0">
                                    <AlertTriangle className="w-3 h-3 text-red-600" />
                                    <span className="text-xs font-black text-red-700">{official.flags}</span>
                                  </div>
                                </div>
                                {Object.keys(official.flagTypes).length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {Object.entries(official.flagTypes).map(([flag, cnt]) => (
                                      <span key={flag} className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                        {flag.replace(/_/g, " ")} ×{cnt as number}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {flagged.length === 0 && (
                        <div className="bg-green-50 rounded-2xl p-4 border border-green-100 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-green-800">No Misconduct Alerts</p>
                            <p className="text-xs text-green-700">No officials have reached the ≥2 flag threshold</p>
                          </div>
                        </div>
                      )}

                      {/* TOP RATED OFFICIALS */}
                      {topRated.length > 0 && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <h3 className="font-display font-bold text-sm text-gray-900">Top-Rated Officials</h3>
                          </div>
                          <div className="space-y-3">
                            {topRated.map((official, i) => (
                              <div key={official.id} className="flex items-center gap-3">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                                  style={{ background: i === 0 ? "#EAB308" : i === 1 ? "#9CA3AF" : i === 2 ? "#B45309" : "#E8215D" }}
                                >
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900 truncate">{official.name}</p>
                                  <p className="text-[11px] text-gray-500 truncate">{official.title} • {official.providerName}</p>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-xs font-black text-gray-900">{official.avgScore.toFixed(1)}</span>
                                    <span className="text-[10px] text-gray-400">/ 5</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400">{official.totalReviews} review{official.totalReviews !== 1 ? "s" : ""}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ALL REVIEWS LIST */}
                      {reviews.length > 0 ? (
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                          <h3 className="font-display font-bold text-sm text-gray-900 mb-3">Recent Official Reviews</h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {reviews.slice(0, 50).map((r: any) => {
                              const isFlagged = r.review?.conductFlag && r.review.conductFlag !== "none";
                              return (
                                <div
                                  key={r.review?.id}
                                  className={`rounded-xl p-3 border ${isFlagged ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div>
                                      <p className="text-xs font-bold text-gray-900">{r.officialName}</p>
                                      <p className="text-[10px] text-gray-500">{r.officialTitle} • {r.providerName}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 px-1.5 py-0.5 rounded">
                                        <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                        <span className="text-[11px] font-black text-gray-800">{r.review?.score}/5</span>
                                      </div>
                                      {isFlagged && (
                                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                                          ⚑ {r.review.conductFlag.replace(/_/g, " ")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {r.review?.comment && (
                                    <p className="text-[11px] text-gray-600 mt-1 italic">"{r.review.comment}"</p>
                                  )}
                                  {r.review?.tags && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {r.review.tags.split(",").filter(Boolean).map((tag: string) => (
                                        <span key={tag} className="text-[9px] font-bold bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                                          {tag.trim()}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
                          <Star className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                          <p className="text-sm text-muted-foreground">No official reviews submitted yet.</p>
                          <p className="text-xs text-muted-foreground mt-1">Reviews appear here when users rate specific officials after service visits.</p>
                        </div>
                      )}

                      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                        <p className="text-xs text-blue-700">
                          🔒 <strong>Privacy</strong>: All official reviews are anonymous. No personal data is linked to reviewers. Misconduct flags are escalated to programme coordinators after review.
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
