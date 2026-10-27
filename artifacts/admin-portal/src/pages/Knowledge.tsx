import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { BookOpen, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fetchAdmin } from "../lib/api";
import { DEMO_DATA, GRADE_LABELS } from "../lib/demoData";

type KnowledgeData = typeof DEMO_DATA["knowledge"];

export default function Knowledge() {
  const [data, setData] = useState<KnowledgeData | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetchAdmin("/admin/knowledge")
      .then((d) => { setData(d); setIsDemo(false); })
      .catch(() => { setData(DEMO_DATA.knowledge); setIsDemo(true); });
  }, []);

  const d = data ?? DEMO_DATA.knowledge;

  const gradeScores = d.byGrade.map((g) => ({
    name: GRADE_LABELS[g.gradeLevel] ?? g.gradeLevel,
    score: Number(g.avgScore),
    high: Number(g.high),
    medium: Number(g.medium),
    low: Number(g.low),
  }));

  const radarData = d.byGrade.map((g) => ({
    grade: GRADE_LABELS[g.gradeLevel] ?? g.gradeLevel,
    score: Number(g.avgScore),
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Knowledge Assessment</h2>
          <p className="text-gray-500 text-sm mt-0.5">SRGBV knowledge scores and performance bands by grade</p>
        </div>
        {isDemo && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">Demo data</span>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {gradeScores.map((g, i) => {
          const prev = i > 0 ? gradeScores[i - 1].score : null;
          const diff = prev !== null ? g.score - prev : null;
          return (
            <div key={g.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">{g.name}</p>
              <div className="text-3xl font-black" style={{ color: g.score >= 70 ? "#16A34A" : g.score >= 50 ? "#F97316" : "#EF4444" }}>
                {g.score}%
              </div>
              <p className="text-xs text-gray-400 mt-0.5">avg knowledge score</p>
              {diff !== null && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
                  {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {diff > 0 ? `+${diff}` : diff} pts vs prev grade
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[#7C3AED]" />
            <h3 className="font-bold text-gray-900">Score Distribution (Histogram)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.histogram}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" name="Users" radius={[4, 4, 0, 0]}>
                {d.histogram.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i < 3 ? "#EF4444" : i < 5 ? "#F97316" : i < 7 ? "#EAB308" : "#22C55E"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-center flex-wrap">
            {[
              { label: "Low (0–40)", color: "#EF4444" },
              { label: "Developing (41–60)", color: "#F97316" },
              { label: "Moderate (61–70)", color: "#EAB308" },
              { label: "Strong (71+)", color: "#22C55E" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: b.color }} />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-gray-900">Performance Bands by Grade</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gradeScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="high" stackId="a" fill="#22C55E" name="High (70+)" />
              <Bar dataKey="medium" stackId="a" fill="#F59E0B" name="Medium (40–70)" />
              <Bar dataKey="low" stackId="a" fill="#EF4444" name="Low (<40)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-3">
        <BookOpen className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-purple-800">
          <strong>Recommendation:</strong> Grades with average scores below 50% should receive targeted SRGBV awareness campaigns. Results inform M-TETO University curriculum gaps and content prioritisation.
        </p>
      </div>
    </div>
  );
}
