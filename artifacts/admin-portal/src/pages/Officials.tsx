import { useEffect, useState } from "react";
import { BadgeCheck, AlertTriangle, Star, Flag, Users, Trophy, ShieldCheck } from "lucide-react";
import { fetchPublic } from "../lib/api";

interface OfficialReview {
  review: {
    id: string;
    officialId: string;
    score: number;
    comment?: string;
    tags?: string;
    conductFlag?: string;
    verifiedBadge?: boolean;
    createdAt: string;
  };
  officialName: string;
  officialTitle: string;
  providerName: string;
}

interface Official {
  id: string;
  name: string;
  title: string;
  role: string;
  badgeNumber?: string;
  isOnDuty: boolean;
  averageScore?: number;
  reviewCount?: number;
  flagCount?: number;
  recognitionCount?: number;
  providerName?: string;
}

const CONDUCT_FLAG_LABELS: Record<string, string> = {
  unprofessional: "Unprofessional",
  refused_help: "Refused Help",
  hostile: "Hostile",
  discriminatory: "Discriminatory",
  abusive: "Abusive",
};

const ROLE_COLORS: Record<string, string> = {
  director: "#7C3AED",
  manager: "#2563EB",
  supervisor: "#16A34A",
  frontline: "#64748B",
};

export default function Officials() {
  const [reviews, setReviews] = useState<OfficialReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"misconduct" | "top" | "all">("misconduct");

  useEffect(() => {
    fetchPublic("/admin/official-reviews")
      .then((data: any) => {
        setReviews(Array.isArray(data) ? data : data.reviews ?? []);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const officialMap = new Map<string, Official & { reviews: OfficialReview[] }>();

  reviews.forEach((r) => {
    const id = r.review?.officialId;
    if (!id) return;
    if (!officialMap.has(id)) {
      officialMap.set(id, {
        id,
        name: r.officialName,
        title: r.officialTitle,
        role: "frontline",
        isOnDuty: false,
        providerName: r.providerName,
        averageScore: 0,
        reviewCount: 0,
        flagCount: 0,
        recognitionCount: 0,
        reviews: [],
      });
    }
    const entry = officialMap.get(id)!;
    entry.reviews.push(r);
    entry.reviewCount = (entry.reviewCount ?? 0) + 1;
    entry.averageScore = entry.reviews.reduce((s, rv) => s + Number(rv.review?.score ?? 0), 0) / entry.reviews.length;
    if (r.review?.conductFlag && r.review.conductFlag !== "none") {
      entry.flagCount = (entry.flagCount ?? 0) + 1;
    }
  });

  const allOfficials = Array.from(officialMap.values());
  const misconductOfficials = allOfficials
    .filter((o) => (o.flagCount ?? 0) >= 2)
    .sort((a, b) => (b.flagCount ?? 0) - (a.flagCount ?? 0));
  const topRated = [...allOfficials]
    .filter((o) => (o.reviewCount ?? 0) > 0)
    .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))
    .slice(0, 10);

  const flaggedReviews = reviews.filter(
    (r) => r.review?.conductFlag && r.review.conductFlag !== "none"
  );

  const TABS = [
    { id: "misconduct" as const, label: "Misconduct Alerts", icon: AlertTriangle, count: misconductOfficials.length },
    { id: "top" as const, label: "Top Rated", icon: Trophy, count: topRated.length },
    { id: "all" as const, label: "All Reviews", icon: Star, count: reviews.length },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Officials Accountability</h2>
        <p className="text-gray-500 text-sm mt-0.5">Misconduct monitoring, top-rated officials, and community review history</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600">{misconductOfficials.length}</div>
          <div className="text-xs font-semibold text-gray-600 mt-0.5">Misconduct Flags</div>
          <div className="text-[11px] text-gray-400">≥ 2 conduct flags</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center mb-3">
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">{reviews.length}</div>
          <div className="text-xs font-semibold text-gray-600 mt-0.5">Total Reviews</div>
          <div className="text-[11px] text-gray-400">Submitted by users</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
            <BadgeCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">{allOfficials.length}</div>
          <div className="text-xs font-semibold text-gray-600 mt-0.5">Reviewed Officials</div>
          <div className="text-[11px] text-gray-400">Have ≥ 1 review</div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === t.id
                ? "border-[#E8215D] text-[#E8215D]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${
                activeTab === t.id ? "bg-[#E8215D] text-white" : "bg-gray-100 text-gray-600"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Loading data...</p>
        </div>
      )}

      {!loading && activeTab === "misconduct" && (
        <div className="space-y-4">
          {misconductOfficials.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="font-semibold text-emerald-800">No misconduct alerts at this time</p>
              <p className="text-sm text-emerald-600 mt-1">Officials with 2 or more conduct flags will appear here</p>
            </div>
          ) : (
            misconductOfficials.map((official) => (
              <div key={official.id} className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900">{official.name}</h4>
                      <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        ⚑ {official.flagCount} flags
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{official.title} · {official.providerName}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-bold text-gray-700">{(official.averageScore ?? 0).toFixed(1)}/5</span>
                      </div>
                      <span className="text-xs text-gray-400">{official.reviewCount} review{official.reviewCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {official.reviews
                    .filter((r) => r.review?.conductFlag && r.review.conductFlag !== "none")
                    .map((r, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border border-red-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-red-600">
                            ⚑ {CONDUCT_FLAG_LABELS[r.review.conductFlag ?? ""] ?? r.review.conductFlag?.replace(/_/g, " ")}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-bold">{r.review.score}/5</span>
                          </div>
                        </div>
                        {r.review.comment && (
                          <p className="text-xs text-gray-600 italic">"{r.review.comment}"</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === "top" && (
        <div className="space-y-3">
          {topRated.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
              <Star className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-500">No ratings yet.</p>
            </div>
          ) : (
            topRated.map((official, i) => (
              <div key={official.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                  style={{ background: i === 0 ? "#EAB308" : i === 1 ? "#9CA3AF" : i === 2 ? "#B45309" : "#E8215D" }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{official.name}</p>
                  <p className="text-xs text-gray-500 truncate">{official.title} · {official.providerName}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 gap-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-black text-gray-900">{(official.averageScore ?? 0).toFixed(1)}</span>
                    <span className="text-xs text-gray-400">/ 5</span>
                  </div>
                  <span className="text-xs text-gray-400">{official.reviewCount} review{official.reviewCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === "all" && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
              <Star className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-500">No official reviews submitted yet.</p>
              <p className="text-xs text-gray-400 mt-1">Reviews appear here when users rate officials after service visits.</p>
            </div>
          ) : (
            reviews.slice(0, 50).map((r) => {
              const isFlagged = r.review?.conductFlag && r.review.conductFlag !== "none";
              return (
                <div
                  key={r.review?.id}
                  className={`rounded-xl p-4 border ${isFlagged ? "bg-red-50 border-red-100" : "bg-white border-gray-100 shadow-sm"}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{r.officialName}</p>
                      <p className="text-xs text-gray-500">{r.officialTitle} · {r.providerName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded-lg">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-black text-gray-800">{r.review?.score}/5</span>
                      </div>
                      {isFlagged && (
                        <span className="text-[11px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-lg">
                          ⚑ {CONDUCT_FLAG_LABELS[r.review.conductFlag ?? ""] ?? r.review.conductFlag?.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.review?.comment && (
                    <p className="text-sm text-gray-600 italic">"{r.review.comment}"</p>
                  )}
                  {r.review?.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {r.review.tags.split(",").filter(Boolean).map((tag: string) => (
                        <span key={tag} className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <strong>Privacy:</strong> All official reviews are anonymous. No personal data is linked to reviewers. Misconduct flags with 2 or more reports should be escalated to the relevant programme coordinator for investigation.
        </p>
      </div>
    </div>
  );
}
