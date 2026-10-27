import { useState, useEffect, useRef, useCallback } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAccessibility } from "@/context/AccessibilityContext";
import { getSessionId } from "@/lib/trackEvent";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Search, BookOpen, Video, Headphones, FileText, Newspaper, Gamepad2,
  Bookmark, BookmarkCheck, Download, ExternalLink, Sparkles, Star,
  Lock, Coins, ChevronRight, Volume2, Captions, X, Filter,
  GraduationCap, Globe, Archive, Loader2, RefreshCw, ArrowLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContentItem {
  id: string;
  title: string;
  contentType: string;
  contentSource: string;
  contentUrl: string;
  downloadUrl?: string | null;
  thumbnailUrl?: string | null;
  author?: string;
  year?: string;
  description?: string;
  topic?: string;
  gradeLevel?: string;
  hasCaptions?: boolean;
}

interface PremiumItem {
  id: string;
  title: string;
  description: string;
  contentType: string;
  provider: string;
  pointsCost: number;
  directPurchaseUrl?: string | null;
  thumbnailUrl?: string | null;
  topic: string;
  gradeLevels: string[];
  tags: string[];
  hasCaptions?: boolean;
  hasAudioDescription?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { id: "all", label: "All", icon: <Globe className="w-4 h-4" /> },
  { id: "video", label: "Videos", icon: <Video className="w-4 h-4" /> },
  { id: "book", label: "Books", icon: <BookOpen className="w-4 h-4" /> },
  { id: "audiobook", label: "Audio", icon: <Headphones className="w-4 h-4" /> },
  { id: "document", label: "Docs", icon: <FileText className="w-4 h-4" /> },
  { id: "article", label: "Articles", icon: <Newspaper className="w-4 h-4" /> },
  { id: "tutorial", label: "Tutorials", icon: <Gamepad2 className="w-4 h-4" /> },
];

const TOPICS = ["All Topics", "Human Rights", "SA Law", "Children's Rights", "SRGBV", "International Law", "Gender Rights", "Online Safety", "Disability Rights"];

const GRADE_OPTIONS = [
  { id: "all", label: "All Ages" },
  { id: "grade_1_2", label: "Gr 1–2" },
  { id: "grade_3_5", label: "Gr 3–5" },
  { id: "grade_6_7", label: "Gr 6–7" },
  { id: "grade_8_12", label: "Gr 8–12" },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="w-4 h-4" />,
  book: <BookOpen className="w-4 h-4" />,
  audiobook: <Headphones className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  article: <Newspaper className="w-4 h-4" />,
  tutorial: <Gamepad2 className="w-4 h-4" />,
  course: <GraduationCap className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  video: "bg-red-50 text-red-700 border-red-200",
  book: "bg-blue-50 text-blue-700 border-blue-200",
  audiobook: "bg-purple-50 text-purple-700 border-purple-200",
  document: "bg-amber-50 text-amber-700 border-amber-200",
  article: "bg-teal-50 text-teal-700 border-teal-200",
  tutorial: "bg-green-50 text-green-700 border-green-200",
  course: "bg-pink-50 text-pink-700 border-pink-200",
};

const SECTION_TABS = [
  { id: "discover", label: "🔍 Discover" },
  { id: "library", label: "📚 My Library" },
  { id: "premium", label: "⭐ Premium" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function University() {
  const { prefs, speak } = useAccessibility();
  const sessionId = getSessionId();
  const gradeFromStorage = localStorage.getItem("mteto_grade") || "all";

  const [, navigate] = useLocation();
  const [sectionTab, setSectionTab] = useState("discover");
  const [contentType, setContentType] = useState("all");
  const [topic, setTopic] = useState("All Topics");
  const [gradeLevel, setGradeLevel] = useState(gradeFromStorage);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [savedContent, setSavedContent] = useState<ContentItem[]>([]);
  const [premiumContent, setPremiumContent] = useState<PremiumItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch featured content
  useEffect(() => {
    setLoadingFeatured(true);
    fetch(`${BASE_URL}/api/university/featured?gradeLevel=${gradeLevel}&contentType=${contentType}`)
      .then(r => r.json())
      .then(d => { setFeaturedContent(d.results || []); setLoadingFeatured(false); })
      .catch(() => setLoadingFeatured(false));
  }, [gradeLevel, contentType]);

  // Fetch saved content
  useEffect(() => {
    if (!sessionId) return;
    fetch(`${BASE_URL}/api/university/saved?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(d => {
        setSavedContent(d.saved || []);
        setSavedIds(new Set((d.saved || []).map((s: any) => s.contentId)));
      })
      .catch(() => {});
  }, [sessionId]);

  // Fetch premium content
  useEffect(() => {
    if (sectionTab !== "premium") return;
    fetch(`${BASE_URL}/api/university/premium`)
      .then(r => r.json())
      .then(d => setPremiumContent(d.items || []))
      .catch(() => {});
  }, [sectionTab]);

  const handleSearch = useCallback(async (q?: string) => {
    const query = q ?? searchQuery;
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    setAiSummary(null);
    try {
      const res = await fetch(`${BASE_URL}/api/university/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query, gradeLevel, contentType,
          topic: topic !== "All Topics" ? topic : undefined,
        }),
      });
      const data = await res.json();
      setSearchResults(data.results || []);
      setAiSummary(data.aiSummary || null);
      if (data.aiSummary && prefs.tts) speak(data.aiSummary);
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  }, [searchQuery, gradeLevel, contentType, topic, prefs.tts, speak]);

  const saveContent = async (item: ContentItem) => {
    if (savedIds.has(item.id)) return;
    try {
      const res = await fetch(`${BASE_URL}/api/university/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, contentId: item.id, contentUrl: item.contentUrl,
          contentTitle: item.title, contentType: item.contentType,
          contentSource: item.contentSource, thumbnailUrl: item.thumbnailUrl || null,
          author: item.author || null, year: item.year || null,
          description: item.description || null, topic: item.topic || null,
          gradeLevel: item.gradeLevel || null, downloadUrl: item.downloadUrl || null,
          hasCaptions: item.hasCaptions ?? false,
        }),
      });
      const data = await res.json();
      if (data.saved) {
        setSavedIds(prev => new Set([...prev, item.id]));
        setSavedContent(prev => [data.saved, ...prev]);
      }
    } catch {}
  };

  const removeFromLibrary = async (contentId: string) => {
    await fetch(`${BASE_URL}/api/university/saved/${encodeURIComponent(contentId)}?sessionId=${sessionId}`, { method: "DELETE" });
    setSavedIds(prev => { const n = new Set(prev); n.delete(contentId); return n; });
    setSavedContent(prev => prev.filter(s => s.contentId !== contentId));
  };

  const displayItems = hasSearched ? searchResults : featuredContent;

  return (
    <MobileLayout title="🎓 University">
      {/* Skip to main content for screen readers */}
      <a href="#university-main" className="skip-nav">Skip to content</a>

      <div id="university-main" className="flex flex-col pb-24">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => navigate("/learn")} className="flex items-center gap-1 text-sm text-gray-500 mb-3 hover:text-pink-600 transition-colors" aria-label="Back to Learn">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`font-black text-gray-900 ${prefs.largeText ? "text-2xl" : "text-xl"}`}>M-TETO University</h1>
              <p className="text-xs text-gray-500">Free & Premium Education on Law & Rights</p>
            </div>
          </div>
        </div>

        {/* AI Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search books, videos, laws, rights…"
              aria-label="Search educational content"
              className={`w-full bg-gray-50 border-2 border-gray-200 focus:border-pink-400 rounded-2xl pl-10 pr-12 py-3 text-gray-800 outline-none transition-all ${prefs.largeText ? "text-base" : "text-sm"}`}
            />
            {isSearching ? (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500 animate-spin" />
            ) : (
              <button
                onClick={() => handleSearch()}
                aria-label="Search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl bg-pink-500 flex items-center justify-center"
              >
                <Search className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>

          {/* AI Summary */}
          <AnimatePresence>
            {aiSummary && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-2 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-3 flex items-start gap-2"
                role="status" aria-live="polite"
              >
                <Sparkles className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-pink-800 font-medium">{aiSummary}</p>
                {prefs.tts && (
                  <button onClick={() => speak(aiSummary)} aria-label="Read AI summary aloud" className="shrink-0 ml-auto">
                    <Volume2 className="w-4 h-4 text-purple-500" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section Tabs */}
        <div className="px-4 mb-3" role="tablist" aria-label="University sections">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {SECTION_TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={sectionTab === tab.id}
                onClick={() => setSectionTab(tab.id)}
                className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                  sectionTab === tab.id
                    ? "bg-pink-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        {sectionTab === "discover" && (
          <div className="px-4 space-y-2 mb-3">
            {/* Content Type filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="group" aria-label="Filter by content type">
              {CONTENT_TYPES.map(t => (
                <button
                  key={t.id}
                  aria-pressed={contentType === t.id}
                  onClick={() => setContentType(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border-2 transition-all ${
                    contentType === t.id ? "bg-purple-500 border-purple-500 text-white" : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Topic filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="group" aria-label="Filter by topic">
              {TOPICS.map(t => (
                <button
                  key={t}
                  aria-pressed={topic === t}
                  onClick={() => { setTopic(t); if (hasSearched) handleSearch(searchQuery || t); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border-2 transition-all ${
                    topic === t ? "bg-teal-500 border-teal-500 text-white" : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Grade filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="group" aria-label="Filter by grade">
              {GRADE_OPTIONS.map(g => (
                <button
                  key={g.id}
                  aria-pressed={gradeLevel === g.id}
                  onClick={() => setGradeLevel(g.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border-2 transition-all ${
                    gradeLevel === g.id ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── DISCOVER TAB ─── */}
        {sectionTab === "discover" && (
          <div className="px-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className={`font-black text-gray-800 ${prefs.largeText ? "text-lg" : "text-base"}`}>
                {hasSearched ? `Search Results (${displayItems.length})` : "Featured Content"}
              </h2>
              {hasSearched && (
                <button
                  onClick={() => { setHasSearched(false); setSearchQuery(""); setSearchResults([]); setAiSummary(null); }}
                  className="text-xs text-gray-500 flex items-center gap-1 hover:text-pink-600"
                >
                  <RefreshCw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {loadingFeatured && !hasSearched ? (
              <div className="flex items-center justify-center py-12" role="status" aria-label="Loading content">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : displayItems.length === 0 && hasSearched ? (
              <div className="text-center py-12 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No results found</p>
                <p className="text-sm">Try different search terms or topic filters</p>
              </div>
            ) : (
              <div className="space-y-3" role="list" aria-label="Educational content">
                {displayItems.map(item => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    isSaved={savedIds.has(item.id)}
                    onSave={() => saveContent(item)}
                    onRead={() => setSelectedItem(item)}
                    showCaptions={prefs.alwaysShowCaptions || prefs.deafMode}
                    ttsEnabled={prefs.tts}
                    onSpeak={() => speak(`${item.title}. ${item.description || ""}`)}
                    simplified={prefs.simplifiedView}
                  />
                ))}
              </div>
            )}

            {/* Quick search prompts */}
            {!hasSearched && !loadingFeatured && (
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Explore Topics</p>
                <div className="flex flex-wrap gap-2">
                  {["Children's rights", "SA Constitution", "Stop bullying", "Gender equality", "Domestic violence", "Digital rights"].map(q => (
                    <button
                      key={q}
                      onClick={() => { setSearchQuery(q); handleSearch(q); }}
                      className="px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-full text-xs font-medium text-pink-700 hover:bg-pink-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── MY LIBRARY TAB ─── */}
        {sectionTab === "library" && (
          <div className="px-4 space-y-3">
            <h2 className={`font-black text-gray-800 ${prefs.largeText ? "text-lg" : "text-base"}`}>
              My Saved Library ({savedContent.length})
            </h2>
            {savedContent.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-400">Your library is empty</p>
                <p className="text-sm text-gray-400 mt-1">Save content from Discover to read it later</p>
                <Button onClick={() => setSectionTab("discover")} className="mt-4 bg-pink-500 text-white rounded-full">
                  Browse Content
                </Button>
              </div>
            ) : (
              <div className="space-y-3" role="list">
                {savedContent.map(item => (
                  <SavedContentCard
                    key={item.id}
                    item={item}
                    onRemove={() => removeFromLibrary(item.contentId || item.id)}
                    showCaptions={prefs.alwaysShowCaptions || prefs.deafMode}
                    ttsEnabled={prefs.tts}
                    onSpeak={() => speak(`${item.contentTitle}. ${item.description || ""}`)}
                    simplified={prefs.simplifiedView}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── PREMIUM TAB ─── */}
        {sectionTab === "premium" && (
          <div className="px-4 space-y-4">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-amber-500" />
                <h2 className={`font-black text-gray-900 ${prefs.largeText ? "text-lg" : "text-base"}`}>Premium Content</h2>
              </div>
              <p className="text-xs text-gray-600">
                Use your M-TETO points to unlock premium educational materials — or buy directly.
                Earn points by reading articles, completing quizzes, and helping your community.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-700">Your points: check your profile</span>
              </div>
            </div>

            <div className="space-y-3" role="list">
              {premiumContent.length === 0 ? (
                <div className="flex items-center justify-center py-8" role="status">
                  <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                </div>
              ) : premiumContent.map(item => (
                <PremiumCard key={item.id} item={item} simplified={prefs.simplifiedView} ttsEnabled={prefs.tts} onSpeak={() => speak(`${item.title}. ${item.description}`)} />
              ))}
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-200">
              <p className="text-sm text-blue-800 font-semibold">💡 How to earn points</p>
              <p className="text-xs text-blue-600 mt-1">Read articles (+5pts) · Complete quizzes (+10pts) · Write a review (+15pts) · Refer a friend (+20pts)</p>
              <button
                onClick={() => navigate("/square")}
                className="mt-3 px-5 py-2 bg-blue-500 text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-colors"
              >
                Go to The Square →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <ContentModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            isSaved={savedIds.has(selectedItem.id)}
            onSave={() => saveContent(selectedItem)}
            showCaptions={prefs.alwaysShowCaptions || prefs.deafMode}
            ttsEnabled={prefs.tts}
            onSpeak={() => speak(`${selectedItem.title}. ${selectedItem.description || ""}`)}
          />
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────────
function ContentCard({
  item, isSaved, onSave, onRead, showCaptions, ttsEnabled, onSpeak, simplified
}: {
  item: ContentItem; isSaved: boolean; onSave: () => void; onRead: () => void;
  showCaptions: boolean; ttsEnabled: boolean; onSpeak: () => void; simplified: boolean;
}) {
  const typeColor = TYPE_COLORS[item.contentType] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <article
      className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden hover:border-pink-200 transition-all"
      role="listitem"
      aria-label={`${item.contentType}: ${item.title}`}
    >
      {item.thumbnailUrl && item.contentType === "video" && (
        <div className="relative w-full h-36 bg-gray-900">
          <img src={item.thumbnailUrl} alt={`Thumbnail for ${item.title}`} className="w-full h-full object-cover opacity-90" loading="lazy" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Video className="w-6 h-6 text-red-500" aria-hidden="true" />
            </div>
          </div>
          {(showCaptions || item.hasCaptions) && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <Captions className="w-3 h-3" /> CC
            </span>
          )}
        </div>
      )}
      {item.thumbnailUrl && item.contentType !== "video" && (
        <img src={item.thumbnailUrl} alt={`Cover of ${item.title}`} className="w-full h-28 object-cover" loading="lazy" />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColor}`}>
                {TYPE_ICONS[item.contentType] || <FileText className="w-3 h-3" />}
                {item.contentType}
              </span>
              {item.contentSource && (
                <span className="text-xs text-gray-400 font-medium">{item.contentSource}</span>
              )}
              {item.year && <span className="text-xs text-gray-400">{item.year}</span>}
            </div>
            <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{item.title}</h3>
            {item.author && <p className="text-xs text-gray-500 mt-0.5">by {item.author}</p>}
          </div>
          <button
            onClick={onSave}
            aria-label={isSaved ? "Already saved to your library" : "Save to library"}
            aria-pressed={isSaved}
            className={`p-2 rounded-xl transition-all shrink-0 ${isSaved ? "bg-pink-50 text-pink-500" : "bg-gray-50 text-gray-400 hover:text-pink-500"}`}
          >
            {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>

        {!simplified && item.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRead}
            className="flex-1 py-2 bg-pink-500 text-white rounded-xl text-xs font-bold text-center hover:bg-pink-600 transition-colors"
            aria-label={`Open ${item.title}`}
          >
            Open
          </button>
          {item.downloadUrl && (
            <a
              href={item.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Download ${item.title}`}
              className="p-2 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
          {ttsEnabled && (
            <button
              onClick={onSpeak}
              aria-label={`Read ${item.title} aloud`}
              className="p-2 bg-violet-100 rounded-xl text-violet-600 hover:bg-violet-200 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Saved Content Card ───────────────────────────────────────────────────────
function SavedContentCard({ item, onRemove, showCaptions, ttsEnabled, onSpeak, simplified }: {
  item: any; onRemove: () => void; showCaptions: boolean; ttsEnabled: boolean;
  onSpeak: () => void; simplified: boolean;
}) {
  const typeColor = TYPE_COLORS[item.contentType] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <article className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4" role="listitem">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${typeColor} border shrink-0`}>
          {TYPE_ICONS[item.contentType] || <FileText className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-gray-400 font-medium">{item.contentSource || item.contentType}</span>
            {(showCaptions && item.hasCaptions) && <span className="text-xs bg-black text-white px-1.5 py-0.5 rounded font-bold">CC</span>}
          </div>
          <h3 className="font-bold text-sm text-gray-900 line-clamp-2">{item.contentTitle || item.title}</h3>
          {item.author && <p className="text-xs text-gray-500 mt-0.5">by {item.author}</p>}
        </div>
        <button onClick={onRemove} aria-label="Remove from library" className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <a href={item.contentUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 py-2 bg-pink-500 text-white rounded-xl text-xs font-bold text-center hover:bg-pink-600 transition-colors flex items-center justify-center gap-1">
          <ExternalLink className="w-3.5 h-3.5" /> Open
        </a>
        {item.downloadUrl && (
          <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer"
            aria-label="Download" className="p-2 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200">
            <Download className="w-4 h-4" />
          </a>
        )}
        {ttsEnabled && (
          <button onClick={onSpeak} aria-label="Read aloud" className="p-2 bg-violet-100 rounded-xl text-violet-600">
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Premium Card ─────────────────────────────────────────────────────────────
function PremiumCard({ item, simplified, ttsEnabled, onSpeak }: {
  item: PremiumItem; simplified: boolean; ttsEnabled: boolean; onSpeak: () => void;
}) {
  const typeColor = TYPE_COLORS[item.contentType] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <article className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-4" role="listitem">
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${typeColor} border shrink-0`}>
          {TYPE_ICONS[item.contentType] || <GraduationCap className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColor}`}>{item.contentType}</span>
            <span className="text-xs text-gray-400">{item.provider}</span>
            {item.hasCaptions && <span className="text-xs bg-black text-white px-1.5 py-0.5 rounded font-bold">CC</span>}
            {item.hasAudioDescription && <span className="text-xs bg-violet-900 text-white px-1.5 py-0.5 rounded font-bold">AD</span>}
          </div>
          <h3 className="font-bold text-sm text-gray-900">{item.title}</h3>
          {!simplified && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="font-black text-amber-700 text-sm">{item.pointsCost} pts</span>
        </div>
        <button
          className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          aria-label={`Unlock ${item.title} for ${item.pointsCost} points`}
        >
          <Lock className="w-4 h-4" /> Unlock with Points
        </button>
        {item.directPurchaseUrl && (
          <a
            href={item.directPurchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy directly"
            className="p-2.5 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {ttsEnabled && (
          <button onClick={onSpeak} aria-label="Read description aloud" className="p-2.5 bg-violet-100 rounded-xl text-violet-600">
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Content Detail Modal ─────────────────────────────────────────────────────
function ContentModal({ item, onClose, isSaved, onSave, showCaptions, ttsEnabled, onSpeak }: {
  item: ContentItem; onClose: () => void; isSaved: boolean; onSave: () => void;
  showCaptions: boolean; ttsEnabled: boolean; onSpeak: () => void;
}) {
  const isVideo = item.contentType === "video";
  const isYouTube = item.contentUrl.includes("youtube.com/embed");

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={item.title}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="relative bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">{item.contentSource}</p>
            <h2 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{item.title}</h2>
          </div>
          <button onClick={onSave} aria-label={isSaved ? "Saved" : "Save to library"} aria-pressed={isSaved}
            className={`p-2 rounded-xl ${isSaved ? "bg-pink-50 text-pink-500" : "bg-gray-50 text-gray-400"}`}>
            {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Video embed */}
          {isVideo && isYouTube && (
            <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={`${item.contentUrl}${showCaptions ? "?cc_load_policy=1&cc_lang_pref=en" : ""}`}
                title={item.title}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {/* Thumbnail for non-video */}
          {!isVideo && item.thumbnailUrl && (
            <img src={item.thumbnailUrl} alt={`Cover of ${item.title}`} className="w-full h-40 object-cover rounded-2xl" />
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${TYPE_COLORS[item.contentType] || ""}`}>
              {TYPE_ICONS[item.contentType]} {item.contentType}
            </span>
            {item.year && <Badge variant="outline" className="text-xs">{item.year}</Badge>}
            {item.topic && <Badge variant="outline" className="text-xs">{item.topic}</Badge>}
            {showCaptions && item.hasCaptions && <Badge className="text-xs bg-black text-white">CC Available</Badge>}
          </div>

          {item.author && <p className="text-sm text-gray-600"><span className="font-semibold">Author:</span> {item.author}</p>}

          {item.description && (
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">About this resource</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Accessibility info */}
          {(showCaptions || ttsEnabled) && (
            <div className="bg-violet-50 rounded-xl p-3 border border-violet-200">
              <p className="text-xs font-bold text-violet-800 mb-1">♿ Accessibility</p>
              {item.hasCaptions && showCaptions && <p className="text-xs text-violet-700">✓ Closed captions available for this content</p>}
              {ttsEnabled && <p className="text-xs text-violet-700">✓ Text-to-speech is active — tap the speaker icon to listen</p>}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <a
              href={item.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-pink-500 text-white rounded-2xl font-bold text-sm text-center hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
              aria-label={`Open ${item.title} in new tab`}
            >
              <ExternalLink className="w-4 h-4" />
              Open Resource
            </a>
            {item.downloadUrl && (
              <a
                href={item.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
                aria-label={`Download ${item.title}`}
              >
                <Download className="w-4 h-4" /> Download
              </a>
            )}
            {ttsEnabled && (
              <button
                onClick={onSpeak}
                aria-label="Read content aloud"
                className="p-3 bg-violet-100 text-violet-700 rounded-2xl hover:bg-violet-200 transition-colors"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">Source: {item.contentSource} · Free to access · M-TETO University</p>
        </div>
      </motion.div>
    </div>
  );
}
