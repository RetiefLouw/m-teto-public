import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Search, Hash, TrendingUp } from "lucide-react";
import { fetchAdmin } from "../lib/api";
import { DEMO_DATA, GRADE_LABELS } from "../lib/demoData";

type SearchData = typeof DEMO_DATA["searches"];

export default function Searches() {
  const [data, setData] = useState<SearchData | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetchAdmin("/admin/searches")
      .then((d) => { setData(d); setIsDemo(false); })
      .catch(() => { setData(DEMO_DATA.searches); setIsDemo(true); });
  }, []);

  const d = data ?? DEMO_DATA.searches;

  const gradeData = d.byGrade.map((g) => ({
    name: GRADE_LABELS[g.gradeLevel] ?? g.gradeLevel,
    count: Number(g.count),
  }));

  const provinceData = d.byProvince.map((p) => ({
    name: p.province,
    count: Number(p.count),
  }));

  const maxQuery = Math.max(...d.topQueries.map((q) => Number(q.count)));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Search Analytics</h2>
          <p className="text-gray-500 text-sm mt-0.5">Top search queries, trends, and breakdown by grade and province</p>
        </div>
        {isDemo && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">Demo data</span>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#2563EB]" />
          <h3 className="font-bold text-gray-900">Daily Search Volume — Last 14 Days</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={d.recentSearches}>
            <defs>
              <linearGradient id="searchGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
            <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} fill="url(#searchGradient)" name="Searches" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-[#E8215D]" />
            <h3 className="font-bold text-gray-900">Top 10 Search Queries</h3>
          </div>
          <div className="space-y-2.5">
            {d.topQueries.map((q, i) => {
              const pct = maxQuery > 0 ? (Number(q.count) / maxQuery) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-400 w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-gray-800 truncate pr-2">"{q.query}"</span>
                      <span className="text-xs font-black text-gray-700 flex-shrink-0">{q.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: i === 0 ? "#E8215D" : i < 3 ? "#F97316" : "#3B82F6" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Searches by Grade</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Searches" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Searches by Province</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={provinceData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} name="Searches">
                  {provinceData.map((_, i) => <Cell key={i} fill={i === 0 ? "#2563EB" : "#93C5FD"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
