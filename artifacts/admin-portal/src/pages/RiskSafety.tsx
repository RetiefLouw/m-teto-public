import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { AlertTriangle, MapPin, Flag } from "lucide-react";
import { fetchAdmin } from "../lib/api";
import { DEMO_DATA, GRADE_LABELS, RISK_COLORS } from "../lib/demoData";

type RiskData = typeof DEMO_DATA["risk"];

export default function RiskSafety() {
  const [data, setData] = useState<RiskData | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetchAdmin("/admin/risk")
      .then((d) => { setData(d); setIsDemo(false); })
      .catch(() => { setData(DEMO_DATA.risk); setIsDemo(true); });
  }, []);

  const d = data ?? DEMO_DATA.risk;

  const gradeRiskData = d.riskByGrade.map((g) => ({
    name: GRADE_LABELS[g.gradeLevel] ?? g.gradeLevel,
    High: Number(g.highRisk),
    Medium: Number(g.mediumRisk),
    Low: Number(g.lowRisk),
    None: Number(g.noRisk),
  }));

  const flagData = d.flagCounts.map((f) => ({
    name: f.flag.replace(/_/g, " "),
    count: Number(f.count),
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Risk & Safety</h2>
          <p className="text-gray-500 text-sm mt-0.5">Geographic hotspots, flag analysis, and risk by grade level</p>
        </div>
        {isDemo && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">Demo data</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-gray-900">Risk Hotspots</h3>
          </div>
          <div className="space-y-3">
            {d.hotspots.map((h, i) => {
              const riskRate = h.total > 0 ? Math.round((Number(h.riskCount) / Number(h.total)) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{h.province}</p>
                    <p className="text-xs text-gray-500 capitalize">{h.areaType} area</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-sm font-black"
                      style={{ color: riskRate > 30 ? "#EF4444" : riskRate > 15 ? "#F97316" : "#EAB308" }}
                    >
                      {riskRate}% flagged
                    </div>
                    <div className="text-xs text-gray-400">{h.total} users</div>
                  </div>
                  <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${riskRate}%`,
                        background: riskRate > 30 ? "#EF4444" : riskRate > 15 ? "#F97316" : "#EAB308",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flag className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-gray-900">Most Common Risk Flags</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={flagData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "#64748B" }}
                width={160}
              />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#F97316" radius={[0, 4, 4, 0]} name="Cases">
                {flagData.map((_, i) => (
                  <Cell key={i} fill={i < 2 ? "#EF4444" : i < 4 ? "#F97316" : "#EAB308"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <h3 className="font-bold text-gray-900">Risk Level by Grade</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={gradeRiskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="High" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Medium" stackId="a" fill="#F97316" />
              <Bar dataKey="Low" stackId="a" fill="#EAB308" />
              <Bar dataKey="None" stackId="a" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-800">
          <strong>Action required:</strong> Hotspots with risk flag rates above 30% should be escalated to provincial SAPS and Department of Social Development. All data is aggregated — individual children are never identified.
        </p>
      </div>
    </div>
  );
}
