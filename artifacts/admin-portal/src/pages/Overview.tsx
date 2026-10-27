import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, AlertTriangle, BookOpen, Search, Activity, TrendingUp, ShieldCheck, Info } from "lucide-react";
import { fetchAdmin } from "../lib/api";
import { DEMO_DATA, RISK_COLORS } from "../lib/demoData";

function StatCard({ label, value, sub, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-gray-900">{value}</div>
      <div className="text-sm font-semibold text-gray-700 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const [data, setData] = useState<typeof DEMO_DATA | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchAdmin("/admin/overview"),
      fetchAdmin("/admin/demographics"),
      fetchAdmin("/admin/risk"),
      fetchAdmin("/admin/knowledge"),
      fetchAdmin("/admin/searches"),
    ])
      .then(([overview, demographics, risk, knowledge, searches]) => {
        setData({ overview, demographics, risk, knowledge, searches });
        setIsDemo(false);
      })
      .catch(() => {
        setData(DEMO_DATA);
        setIsDemo(true);
      });
  }, []);

  const d = data ?? DEMO_DATA;

  const riskPie = d.overview.riskByLevel
    .filter((r) => r.riskLevel)
    .map((r) => ({
      name: (r.riskLevel ?? "").charAt(0).toUpperCase() + (r.riskLevel ?? "").slice(1) + " Risk",
      value: Number(r.count),
      color: RISK_COLORS[r.riskLevel ?? "none"] ?? "#9CA3AF",
    }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 text-sm mt-0.5">Anonymous & aggregated — no personal data stored</p>
        </div>
        {isDemo && (
          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Info className="w-3 h-3" /> Demo data
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assessments" value={d.overview.totals.assessments} sub="Total completed" icon={Users} color="#E8215D" trend="+12% this week" />
        <StatCard label="Risk Flags" value={d.overview.totals.withRiskFlags} sub={`of ${d.overview.totals.assessments} total`} icon={AlertTriangle} color="#EF4444" />
        <StatCard label="Avg Knowledge" value={`${d.overview.totals.avgKnowledgeScore}%`} sub="Across all grades" icon={BookOpen} color="#7C3AED" trend="+3pts" />
        <StatCard label="Searches" value={d.overview.totals.searches} sub="Total search queries" icon={Search} color="#2563EB" trend="+28% this month" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#E8215D]" />
            <h3 className="font-bold text-gray-900">Daily Assessments — Last 14 Days</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d.overview.recentActivity}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8215D" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E8215D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#E8215D" strokeWidth={2} fill="url(#areaGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-gray-900">Risk Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={riskPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                {riskPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {riskPie.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                  <span className="text-gray-600">{r.name}</span>
                </div>
                <span className="font-bold text-gray-800">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <strong>Data protection:</strong> All data displayed is anonymous and aggregated. No personally identifiable information (PII) is stored or accessible. This dashboard may be used by authorised stakeholders (UN, UNFPA, SA Government Departments, SAPS, NGOs) for policy development and SRGBV response resource allocation.
        </p>
      </div>
    </div>
  );
}
