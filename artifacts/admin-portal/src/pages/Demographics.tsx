import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { MapPin } from "lucide-react";
import { fetchAdmin } from "../lib/api";
import { DEMO_DATA, GRADE_LABELS, CHART_COLORS } from "../lib/demoData";

type DemoData = typeof DEMO_DATA;

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function Demographics() {
  const [demo, setDemo] = useState<DemoData["demographics"] | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetchAdmin("/admin/demographics")
      .then((d) => { setDemo(d); setIsDemo(false); })
      .catch(() => { setDemo(DEMO_DATA.demographics); setIsDemo(true); });
  }, []);

  const d = demo ?? DEMO_DATA.demographics;

  const gradeData = d.byGrade.map((g) => ({
    name: GRADE_LABELS[g.gradeLevel] ?? g.gradeLevel,
    count: Number(g.count),
  }));

  const provinceData = d.byProvince.map((p) => ({
    name: p.province,
    count: Number(p.count),
    riskRate: p.count > 0 ? Math.round((Number(p.riskCount) / Number(p.count)) * 100) : 0,
  }));

  const genderPie = d.byGender.map((g, i) => ({
    name: g.gender,
    value: Number(g.count),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const racePie = d.byRace.map((r, i) => ({
    name: r.race,
    value: Number(r.count),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const areaData = d.byAreaType.map((a, i) => ({
    name: a.areaType,
    count: Number(a.count),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const schoolData = d.bySchoolType.map((s, i) => ({
    name: s.schoolType,
    count: Number(s.count),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Demographics</h2>
          <p className="text-gray-500 text-sm mt-0.5">Anonymised user breakdown by province, grade, gender, race and area type</p>
        </div>
        {isDemo && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">Demo data</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Province Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={provinceData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} width={110} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#E8215D" radius={[0, 4, 4, 0]} name="Users" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 border-t border-gray-100 pt-3 grid grid-cols-2 gap-1">
            {provinceData.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs px-1">
                <span className="text-gray-500 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" /> {p.name}
                </span>
                <span
                  className="font-bold"
                  style={{ color: p.riskRate > 20 ? "#EF4444" : p.riskRate > 10 ? "#F97316" : "#16A34A" }}
                >
                  {p.riskRate}% flags
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Grade Level Breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Gender Identity">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={genderPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                  {genderPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {genderPie.map((g) => {
                const total = genderPie.reduce((s, x) => s + x.value, 0) || 1;
                return (
                  <div key={g.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: g.color }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{g.name}</span>
                    <span className="text-xs font-bold text-gray-800">{Math.round((g.value / total) * 100)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Race / Ethnicity">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={racePie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                  {racePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {racePie.map((r) => {
                const total = racePie.reduce((s, x) => s + x.value, 0) || 1;
                return (
                  <div key={r.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: r.color }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{r.name}</span>
                    <span className="text-xs font-bold text-gray-800">{Math.round((r.value / total) * 100)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Area Type">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Users">
                {areaData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="School Type">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={schoolData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} width={110} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
    </div>
  );
}
