import { useState, useEffect } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { trackEvent } from "@/lib/trackEvent";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, BookOpen, MapPin, ShoppingBag, Phone } from "lucide-react";
import { aiSearch, type SearchResults as SearchResultsType } from "@workspace/api-client-react";

const TABS = [
  { id: "all", label: "All", icon: "🔍" },
  { id: "university", label: "Learn", icon: "🎓" },
  { id: "helpers", label: "Helpers", icon: "👥" },
  { id: "square", label: "Square", icon: "🛍" },
];

export default function SearchResults() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const query = params.get("q") || "";
  const grade = params.get("grade") || localStorage.getItem("mteto_grade") || "all";

  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState<SearchResultsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;
    setSearchInput(query);
    doSearch(query, grade);
  }, [query, grade]);

  const logSearch = (q: string, g: string, resultCount?: number) => {
    try {
      const sessionId = localStorage.getItem("mteto_session_id") || undefined;
      const province = localStorage.getItem("mteto_province") || undefined;
      fetch("/api/search-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId, query: q, gradeLevel: g, province, resultCount }),
      }).catch(() => {});
    } catch {}
  };

  const doSearch = async (q: string, g: string) => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await aiSearch({ query: q, gradeLevel: g });
      setResults(data);
      // Fire and forget — log the search anonymously
      const count = (data?.results?.length ?? 0) + (data?.aiAnswer ? 1 : 0);
      logSearch(q, g, count);
      trackEvent("search", { query: q, gradeLevel: g, resultCount: count });
    } catch (e) {
      setError("Something went wrong. Please try again! 💙");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchInput.trim())}&grade=${grade}`);
  };

  const totalResults = results
    ? results.articles.length + results.providers.length + results.squareItems.length
    : 0;

  return (
    <div className="mx-auto max-w-[430px] w-full min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Y2K sparkle decorations */}
      <div className="fixed top-20 right-3 text-yellow-400 text-xs pointer-events-none animate-bounce opacity-50">✦</div>
      <div className="fixed top-32 left-3 text-pink-400 text-xs pointer-events-none opacity-40" style={{ animation: "spin 5s linear infinite" }}>★</div>

      {/* Search header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>

          <div
            className="flex-1 flex items-center gap-2 rounded-full border-2 px-4 py-2 bg-white transition-all focus-within:shadow-lg"
            style={{ borderColor: "#E8215D60", boxShadow: "0 2px 12px rgba(232,33,93,0.1)" }}
          >
            <span className="text-base">🔍</span>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              aria-label="Search M-TETO — refine your search"
              className="flex-1 bg-transparent outline-none text-sm font-sans text-foreground"
              placeholder="Search M-TETO..."
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="text-muted-foreground/60 text-lg"
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </div>

          <img
            src={`${import.meta.env.BASE_URL}images/mteto-logo.png`}
            alt="M-TETO"
            className="w-8 h-8 object-contain flex-shrink-0"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
              style={{
                background: activeTab === tab.id
                  ? "linear-gradient(135deg, #E8215D, #F4826C)"
                  : "transparent",
                color: activeTab === tab.id ? "white" : "#6b7280",
                border: activeTab === tab.id ? "none" : "1.5px solid #e5e7eb",
                boxShadow: activeTab === tab.id ? "0 2px 8px rgba(232,33,93,0.3)" : "none",
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-8">
        {/* Results count — announces to screen readers when results load */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {!loading && results && `${totalResults} results found for ${query}`}
          {!loading && results && totalResults === 0 && `No results found for ${query}`}
        </div>
        {!loading && results && (
          <div className="px-4 py-2 text-[11px] text-muted-foreground font-sans border-b border-border/30" aria-hidden="true">
            About <span className="font-semibold">{totalResults}</span> results for{" "}
            <span className="font-bold text-foreground">"{query}"</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="px-4 py-10 flex flex-col items-center gap-4">
            <motion.img
              src={`${import.meta.env.BASE_URL}images/mteto-logo.png`}
              alt=""
              className="w-14 h-14 object-contain"
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ rotate: { duration: 1.2, repeat: Infinity, ease: "linear" }, scale: { duration: 1.5, repeat: Infinity } }}
            />
            <div className="text-center">
              <p className="text-sm font-display font-bold text-primary">Searching M-TETO...</p>
              <p className="text-xs text-muted-foreground mt-1">AI is finding the best answers for you ✨</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-center">
            <p className="text-sm font-sans text-destructive">{error}</p>
            <button
              onClick={() => doSearch(query, grade)}
              className="mt-2 px-4 py-1.5 rounded-full text-xs font-bold text-white brand-gradient"
            >
              Try Again
            </button>
          </div>
        )}

        {/* AI Answer */}
        {results && !loading && activeTab === "all" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-md"
            style={{ border: "2px solid rgba(232,33,93,0.2)" }}
          >
            {/* AI header */}
            <div className="flex items-center gap-2 px-4 py-3 brand-gradient">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">M-TETO AI Answer</span>
              <div className="ml-auto flex gap-0.5">
                {["✦", "★", "✧"].map((s, i) => (
                  <span key={i} className="text-white/50 text-xs">{s}</span>
                ))}
              </div>
            </div>
            {/* AI body */}
            <div className="px-4 py-4 bg-gradient-to-br from-pink-50/80 to-white">
              <p className="text-sm font-sans text-foreground leading-relaxed whitespace-pre-line">
                {results.aiAnswer}
              </p>
            </div>
          </motion.div>
        )}

        {/* Articles / Learn */}
        {results && !loading && (activeTab === "all" || activeTab === "university") && results.articles.length > 0 && (
          <div className="px-4 mt-5">
            <SectionHeader icon={<BookOpen className="w-3.5 h-3.5 text-white" />} label="Learn" count={results.articles.length} color="#E8215D" />
            <div className="flex flex-col gap-2 mt-3">
              {results.articles.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href="/learn">
                    <div className="p-4 rounded-2xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <span className="text-lg">📚</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60 mb-0.5">
                            {a.moduleType === "university" ? "🎓 University" : "📖 Knowledge Base"}
                          </p>
                          <h3 className="font-display font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {a.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.summary}</p>
                          {a.pointsReward > 0 && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              ⭐ +{a.pointsReward} pts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Helpers / Providers */}
        {results && !loading && (activeTab === "all" || activeTab === "helpers") && results.providers.length > 0 && (
          <div className="px-4 mt-5">
            <SectionHeader icon={<MapPin className="w-3.5 h-3.5 text-white" />} label="Helpers Near You" count={results.providers.length} color="#06b6d4" />
            <div className="flex flex-col gap-2 mt-3">
              {results.providers.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/directory/${p.id}`}>
                    <div className="p-4 rounded-2xl border border-border/60 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h3 className="font-display font-bold text-sm group-hover:text-cyan-600 transition-colors line-clamp-1">
                              {p.name}
                            </h3>
                            {p.isProBono && (
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 flex-shrink-0">
                                FREE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{p.suburb}, {p.province}</p>
                          <span className="inline-block mt-1 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-full px-2 py-0.5">
                            {p.type.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>
                        {p.phone && (
                          <a
                            href={`tel:${p.phone.replace(/\s/g, "")}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold text-white flex-shrink-0 shadow-sm"
                            style={{ background: "linear-gradient(135deg, #E8215D, #F4826C)" }}
                          >
                            <Phone className="w-3 h-3" /> Call
                          </a>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Square items */}
        {results && !loading && (activeTab === "all" || activeTab === "square") && results.squareItems.length > 0 && (
          <div className="px-4 mt-5">
            <SectionHeader icon={<ShoppingBag className="w-3.5 h-3.5 text-white" />} label="The Square" count={results.squareItems.length} color="#f59e0b" />
            <div className="flex flex-col gap-2 mt-3">
              {results.squareItems.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href="/square">
                    <div className="p-4 rounded-2xl border border-border/60 hover:border-amber-300 hover:bg-amber-50/50 transition-all cursor-pointer group flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-2xl">
                        {s.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-sm group-hover:text-amber-600 transition-colors line-clamp-1">{s.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                      </div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-1 flex-shrink-0">
                        {s.pointsCost} pts
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {results && !loading && totalResults === 0 && (
          <div className="px-4 py-14 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display font-bold text-lg mb-2">No results found</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Try searching for "my rights", "bullying", "legal help", or "consent"
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 rounded-full font-display font-bold text-sm text-white brand-gradient shadow-md"
            >
              Back to Search
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function SectionHeader({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color }}>
        {icon}
      </div>
      <h2 className="font-display font-bold text-base">{label}</h2>
      <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-semibold">{count}</span>
    </div>
  );
}
