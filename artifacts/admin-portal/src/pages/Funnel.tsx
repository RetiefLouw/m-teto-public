import { useEffect, useState } from "react";
import { TrendingDown, Users, Activity, ChevronDown } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { fetchAdmin } from "../lib/api";

interface FunnelStep {
  step: string;
  count: number;
  pct: number;
}

const STEP_COLORS = [
  "#E8215D", "#F43F5E", "#FB923C", "#FBBF24",
  "#A3E635", "#34D399", "#22D3EE", "#818CF8",
];

export default function Funnel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmin("/admin/funnel")
      .then((d: any) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const funnel: FunnelStep[] = data?.funnel ?? [];
  const dailyNew = data?.dailyNewSessions ?? [];
  const engagementBuckets = data?.engagementBuckets ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Funnel & Engagement</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Where users drop off, daily growth, and engagement depth across all app functions
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading funnel data...</div>
      ) : (
        <>
          {/* Funnel visualisation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-5">
              <TrendingDown className="w-4 h-4 text-[#E8215D]" />
              <h3 className="font-bold text-gray-900">User Engagement Funnel</h3>
              <span className="text-xs text-gray-400 ml-auto">% of all sessions that reached each step</span>
            </div>
            <div className="space-y-2.5">
              {funnel.map((step, i) => {
                const prev = i > 0 ? funnel[i - 1].pct : 100;
                const dropOff = prev - step.pct;
                return (
                  <div key={step.step} className="relative">
                    <div className="flex items-center gap-3 mb-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0"
                        style={{ background: STEP_COLORS[i % STEP_COLORS.length] }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-700 flex-1">{step.step}</span>
                      <span className="text-sm font-black text-gray-900">{step.count.toLocaleString()}</span>
                      <span className="text-sm font-black w-12 text-right" style={{ color: STEP_COLORS[i % STEP_COLORS.length] }}>
                        {step.pct}%
                      </span>
                      {i > 0 && dropOff > 5 && (
                        <span className="text-[10px] font-bold bg-red-50 text-red-500 px-1.5 py-0.5 rounded-md flex-shrink-0">
                          -{dropOff}%
                        </span>
                      )}
                    </div>
                    <div className="ml-9 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${step.pct}%`,
                          background: STEP_COLORS[i % STEP_COLORS.length],
                          opacity: 0.8,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily new sessions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-bold text-gray-900">Daily New Sessions</h3>
              </div>
              {dailyNew.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No session data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={dailyNew}>
                    <defs>
                      <linearGradient id="sessionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} fill="url(#sessionGrad)" name="New sessions" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Engagement depth */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-bold text-gray-900">Engagement Depth</h3>
              </div>
              {engagementBuckets.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No engagement data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={engagementBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "#64748B" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Sessions">
                      {engagementBuckets.map((_: any, i: number) => (
                        <Cell key={i} fill={STEP_COLORS[i % STEP_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Drop-off analysis */}
          {funnel.length > 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Drop-off Analysis</h3>
              <div className="space-y-2">
                {funnel.slice(1).map((step, i) => {
                  const prev = funnel[i];
                  const dropOff = prev.pct - step.pct;
                  const lost = prev.count - step.count;
                  if (dropOff < 1) return null;
                  return (
                    <div key={step.step} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {prev.step} → {step.step}
                        </p>
                      </div>
                      <span className="text-sm font-black text-red-500">-{dropOff}%</span>
                      <span className="text-xs text-gray-400">{lost.toLocaleString()} sessions lost</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
