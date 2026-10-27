import { useEffect, useState } from "react";
import { Brain, RefreshCw, Lightbulb, TrendingUp, AlertTriangle, BookOpen, Target, FileText } from "lucide-react";
import { fetchAdmin } from "../lib/api";

const STORY_TYPES = [
  { id: "overview", label: "Executive Overview", icon: TrendingUp, color: "#E8215D", desc: "High-level briefing for government & UN stakeholders" },
  { id: "risk", label: "Risk Assessment", icon: AlertTriangle, color: "#EF4444", desc: "Clinical risk briefing for intervention teams" },
  { id: "knowledge", label: "Knowledge Gap Analysis", icon: BookOpen, color: "#7C3AED", desc: "Curriculum intervention memo for Dept. of Education" },
  { id: "intervention", label: "Intervention Brief", icon: Target, color: "#F97316", desc: "Urgent action plan for SAPS, DSD and NGO partners" },
];

interface InsightData {
  narrative: string;
  storyType: string;
  dataSnapshot: {
    totalSessions: number;
    riskRate: number;
    avgKnowledge: number;
    totalSearches: number;
    generatedAt: string;
  };
}

export default function AIInsights() {
  const [activeType, setActiveType] = useState("overview");
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = () => {
    setLoading(true);
    setInsight(null);
    fetchAdmin(`/admin/ai-insights?type=${activeType}`)
      .then((d: any) => {
        setInsight(d);
        setGenerated(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (generated) {
      setInsight(null);
      setGenerated(false);
    }
  }, [activeType]);

  const paragraphs = insight?.narrative
    ? insight.narrative.split("\n\n").filter(Boolean)
    : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">AI Data Insights</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          AI-generated narratives and policy briefs from your platform data — telling the stories behind the numbers
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STORY_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveType(type.id)}
            className={`rounded-xl p-4 text-left transition-all border-2 ${
              activeType === type.id
                ? "shadow-md"
                : "bg-white border-gray-100 hover:border-gray-200"
            }`}
            style={activeType === type.id ? { borderColor: type.color, background: `${type.color}08` } : {}}
          >
            <type.icon className="w-5 h-5 mb-2" style={{ color: type.color }} />
            <p className="text-sm font-bold text-gray-900">{type.label}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{type.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #E8215D, #7C3AED)" }}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating narrative...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Generate {STORY_TYPES.find(t => t.id === activeType)?.label}
            </>
          )}
        </button>
        {insight && (
          <span className="text-xs text-gray-400">
            Generated {new Date(insight.dataSnapshot.generatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {!insight && !loading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <Brain className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="font-semibold text-gray-600">Select a narrative type and click Generate</p>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            The AI will analyse all platform data and generate a policy-grade brief tailored for your selected audience — government departments, UN agencies, or NGO programme coordinators.
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse" style={{ background: "linear-gradient(135deg, #E8215D20, #7C3AED20)" }}>
            <Brain className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <p className="font-semibold text-gray-600">Analysing platform data...</p>
          <p className="text-sm text-gray-400 mt-1">Reading {STORY_TYPES.find(t => t.id === activeType)?.desc?.toLowerCase()}</p>
        </div>
      )}

      {insight && (
        <div className="space-y-4">
          {/* Data snapshot used for the narrative */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Sessions analysed", value: insight.dataSnapshot.totalSessions },
              { label: "Risk rate", value: `${insight.dataSnapshot.riskRate}%` },
              { label: "Avg knowledge", value: `${insight.dataSnapshot.avgKnowledge}%` },
              { label: "Total searches", value: insight.dataSnapshot.totalSearches },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <div className="text-xl font-black text-gray-900">{item.value}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Narrative */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${STORY_TYPES.find(t => t.id === insight.storyType)?.color}15` }}
              >
                {(() => {
                  const t = STORY_TYPES.find(x => x.id === insight.storyType);
                  return t ? <t.icon className="w-4 h-4" style={{ color: t.color }} /> : <FileText className="w-4 h-4" />;
                })()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{STORY_TYPES.find(t => t.id === insight.storyType)?.label}</p>
                <p className="text-xs text-gray-400">M-TETO Platform Intelligence Report · {new Date(insight.dataSnapshot.generatedAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              {paragraphs.map((para, i) => {
                const isHeading = para.startsWith("**") && para.endsWith("**");
                if (isHeading) {
                  return <h3 key={i} className="font-bold text-gray-900 mt-4 mb-2 text-base">{para.replace(/\*\*/g, "")}</h3>;
                }
                // Handle inline bold
                const parts = para.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={i} className="text-gray-700 leading-relaxed mb-3">
                    {parts.map((part, j) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return <strong key={j}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                  </p>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>AI-generated brief:</strong> This narrative is generated from anonymised, aggregated data. All session data is anonymous — no children can be identified. This brief is intended for use by authorised stakeholders in programme planning, policy development, and resource allocation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
