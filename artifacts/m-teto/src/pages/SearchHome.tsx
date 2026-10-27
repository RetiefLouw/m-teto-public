import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@workspace/replit-auth-web";
import { Coins } from "lucide-react";
import { useGetPoints } from "@workspace/api-client-react";

const POPULAR_SEARCHES = [
  "What is SRGBV?",
  "My rights at school",
  "How to report abuse",
  "What is a J88 form?",
  "Childline South Africa",
  "Protection order",
  "HIV rights",
  "Bullying help",
  "Free legal help",
  "What is consent?",
];

const STAR_POSITIONS = [
  { top: "8%", left: "5%", size: "text-xl", delay: 0 },
  { top: "12%", left: "90%", size: "text-2xl", delay: 0.3 },
  { top: "25%", left: "3%", size: "text-sm", delay: 0.6 },
  { top: "20%", left: "95%", size: "text-lg", delay: 0.9 },
  { top: "65%", left: "2%", size: "text-xl", delay: 1.2 },
  { top: "70%", left: "94%", size: "text-sm", delay: 0.5 },
  { top: "80%", left: "8%", size: "text-2xl", delay: 1.5 },
  { top: "85%", left: "88%", size: "text-lg", delay: 0.2 },
  { top: "45%", left: "1%", size: "text-xs", delay: 0.8 },
  { top: "50%", left: "97%", size: "text-xs", delay: 1.1 },
];

const NAV_TABS = [
  { label: "🔍 All", href: null },
  { label: "🎓 University", href: "/learn" },
  { label: "👥 Helpers", href: "/directory" },
  { label: "🛍 The Square", href: "/square" },
  { label: "🛡 Tracker", href: "/tracker" },
];

export default function SearchHome() {
  const [query, setQuery] = useState("");
  const [gradeLevel, setGradeLevel] = useState<string>("all");
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, login, logout, user } = useAuth();

  const { data: pointsData } = useGetPoints({
    query: { enabled: isAuthenticated }
  });

  useEffect(() => {
    const savedGrade = localStorage.getItem("mteto_grade");
    if (savedGrade) setGradeLevel(savedGrade);
  }, []);

  const handleSearch = (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&grade=${gradeLevel}`);
  };

  const apiPoints = pointsData?.totalPoints ?? 0;
  const localCoins = parseInt(localStorage.getItem("mteto_earned_coins") || "0", 10);
  const totalPoints = isAuthenticated ? apiPoints : localCoins;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(180deg, #fff8fe 0%, #ffffff 40%, #f0f8ff 100%)" }}>
      {/* Floating stars */}
      {STAR_POSITIONS.map((star, i) => (
        <motion.div
          key={i}
          className={`absolute pointer-events-none select-none ${star.size} opacity-30`}
          style={{ top: star.top, left: star.left }}
          animate={{
            y: [0, -8, 0],
            rotate: [0, 20, -20, 0],
            opacity: [0.25, 0.55, 0.25],
          }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: star.delay }}
        >
          {i % 3 === 0 ? "✦" : i % 3 === 1 ? "★" : "✧"}
        </motion.div>
      ))}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-1.5">
          {totalPoints > 0 && (
            <button
              onClick={() => navigate("/square")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #E8215D, #F4826C, #F7B56A)" }}
              title="TETO Coins — spend at The Square!"
            >
              <Coins className="w-3.5 h-3.5" /> {totalPoints}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30"
              title={`Logged in as ${user?.firstName}`}
            >
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={`${user.name ?? "Your"} profile picture`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full brand-gradient flex items-center justify-center text-white text-xs font-bold">
                  {(user?.firstName?.[0] || "U").toUpperCase()}
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={login}
              className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #E8215D, #F4826C)" }}
            >
              Log In
            </button>
          )}
        </div>
      </div>

      {/* Main search area */}
      <div className="flex flex-col items-center justify-center min-h-screen px-5" style={{ paddingTop: "40px", paddingBottom: "100px" }}>
        {/* Logo block */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="flex flex-col items-center mb-8"
        >
          <motion.img
            src={`${import.meta.env.BASE_URL}images/mteto-logo.png`}
            alt="M-TETO Logo"
            className="w-28 h-28 object-contain drop-shadow-xl"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <h1 className="font-display font-bold text-4xl mt-2 brand-gradient-text tracking-wide">
            M-TETO
          </h1>
          <p className="font-sans text-sm font-bold tracking-widest uppercase text-muted-foreground mt-0.5">
            Search Engine
          </p>
          <p className="font-sans text-[11px] text-muted-foreground/70 mt-1">
            Conquering SRGBV, One Search at a Time
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="w-full max-w-[380px] relative"
        >
          {/* Sparkle decorations */}
          <span className="absolute -top-3 -left-3 text-yellow-400 text-xl animate-spin" style={{ animationDuration: "4s" }}>✦</span>
          <span className="absolute -top-2 -right-4 text-pink-400 text-sm animate-bounce">★</span>

          <div
            className="flex items-center gap-3 rounded-full border-2 px-5 py-3.5 bg-white shadow-xl transition-all duration-300"
            style={{
              borderColor: query ? "#E8215D" : "#e5e7eb",
              boxShadow: query ? "0 4px 32px rgba(232,33,93,0.2)" : "0 4px 24px rgba(0,0,0,0.08)",
            }}
          >
            <span className="text-xl">🔍</span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search your rights, get help..."
              aria-label="Search M-TETO — type what you need help with"
              className="flex-1 bg-transparent outline-none text-foreground font-sans text-base placeholder:text-muted-foreground/60"
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-muted-foreground/60 hover:text-foreground text-lg"
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </div>

          {/* Search buttons */}
          <div className="flex gap-2 justify-center mt-4">
            <button
              onClick={() => handleSearch()}
              className="px-6 py-2.5 rounded-full font-display font-bold text-sm text-white shadow-md transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #E8215D, #F4826C, #F7B56A)" }}
            >
              M-TETO Search
            </button>
            <button
              onClick={() => handleSearch(POPULAR_SEARCHES[Math.floor(Math.random() * POPULAR_SEARCHES.length)])}
              className="px-6 py-2.5 rounded-full font-display font-bold text-sm border-2 border-primary/30 text-primary bg-white shadow-sm transition-all hover:scale-105 active:scale-95 hover:border-primary"
            >
              Feeling Lucky ✨
            </button>
          </div>
        </motion.div>

        {/* Tab navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-1 mt-6 flex-wrap justify-center"
        >
          {NAV_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => tab.href ? navigate(tab.href) : inputRef.current?.focus()}
              className="px-3 py-1.5 rounded-full text-xs font-bold font-sans transition-all hover:scale-105 active:scale-95"
              style={{
                background: !tab.href ? "linear-gradient(135deg, #E8215D20, #F4826C20)" : "transparent",
                color: !tab.href ? "#E8215D" : "#6b7280",
                border: !tab.href ? "1.5px solid #E8215D40" : "1.5px solid #e5e7eb",
              }}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Popular searches */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-8 w-full max-w-[380px]"
        >
          <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            🔥 Popular Searches
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {POPULAR_SEARCHES.slice(0, 6).map((s, i) => {
              const colors = [
                "bg-pink-100 text-pink-600 border-pink-200",
                "bg-cyan-100 text-cyan-600 border-cyan-200",
                "bg-purple-100 text-purple-600 border-purple-200",
                "bg-orange-100 text-orange-600 border-orange-200",
                "bg-lime-100 text-lime-700 border-lime-200",
                "bg-rose-100 text-rose-600 border-rose-200",
              ];
              return (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all hover:scale-105 active:scale-95 ${colors[i % colors.length]}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Anti-Corruption Trust Strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 w-full max-w-[380px]"
        >
          <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            🛡️ Anti-Corruption Features
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "📋", label: "Case Tracking", desc: "Track from incident to sentencing", href: "/tracker" },
              { icon: "⭐", label: "Rate Officials", desc: "Uber-style accountability ratings", href: "/directory" },
              { icon: "⚠️", label: "Flag Corruption", desc: "Report inaction & misconduct", href: "/tracker" },
              { icon: "⚖️", label: "Legal Docs", desc: "Know your rights in plain language", href: "/legal-docs" },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => navigate(f.href)}
                className="flex flex-col items-start gap-1 p-3 rounded-2xl border border-border/60 bg-white/80 text-left hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95 shadow-sm"
              >
                <span className="text-lg">{f.icon}</span>
                <span className="text-[11px] font-bold text-foreground">{f.label}</span>
                <span className="text-[9px] text-muted-foreground leading-tight">{f.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grade indicator */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          onClick={() => setShowAge(true)}
          className="mt-5 flex items-center gap-1.5 text-[11px] font-sans font-semibold text-muted-foreground/60 hover:text-primary transition-colors"
        >
          <span>📚</span>
          <span>Grade: {gradeLevel === "all" ? "All Ages" : gradeLevel.replace("grade_", "Gr ").replace("_", "–")} (change)</span>
        </motion.button>
      </div>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-border/60 px-4 pt-1.5 pb-2 rounded-t-3xl shadow-lg">
        <p className="text-center text-[8px] text-muted-foreground/40 font-sans tracking-wide pb-1 select-none">
          © {new Date().getFullYear()} Adv. Thando Gumede ZA · M-TETO™
        </p>
        <div className="mx-auto max-w-[430px] flex items-center justify-around">
          {[
            { icon: "🏠", label: "Home", href: "/" },
            { icon: "👥", label: "Helpers", href: "/directory" },
            { icon: "🚨", label: "Emergency", href: "/emergency" },
            { icon: "🎓", label: "Learn", href: "/learn" },
            { icon: "🛍", label: "Square", href: "/square" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.href)}
              aria-label={item.label}
              aria-current={item.href === "/" ? "page" : undefined}
              className="flex flex-col items-center gap-0.5 transition-all"
            >
              <div className={`p-1.5 rounded-2xl ${item.href === "/" ? "brand-gradient shadow-sm" : ""}`}>
                <span className={`text-base ${item.href === "/" ? "" : "grayscale-[50%]"}`}>{item.icon}</span>
              </div>
              <span className={`text-[9px] font-bold ${item.href === "/" ? "brand-gradient-text" : "text-muted-foreground"}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

    </div>
  );
}
