import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetPoints } from "@workspace/api-client-react";
import {
  Bell, BookOpen, ShoppingBag, Shield, MapPin, Pencil, Trash2, Plus,
  CloudSun, Cloud, CloudRain, CloudSnow, Zap, Wind, Droplets, X,
  ChevronRight, Newspaper, GraduationCap, Star, Calendar, AlertTriangle,
  RefreshCw, CheckCircle, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Weather types and helpers ─────────────────────────────────────────────
interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  code: number;
}

function weatherIcon(code: number) {
  if (code === 0) return <CloudSun className="w-8 h-8 text-yellow-400" />;
  if (code <= 3) return <Cloud className="w-8 h-8 text-gray-400" />;
  if (code <= 55) return <CloudRain className="w-8 h-8 text-blue-400" />;
  if (code <= 77) return <CloudSnow className="w-8 h-8 text-sky-300" />;
  if (code <= 82) return <CloudRain className="w-8 h-8 text-blue-500" />;
  return <Zap className="w-8 h-8 text-yellow-500" />;
}

function weatherDesc(code: number): string {
  if (code === 0) return "Clear skies";
  if (code <= 3) return code === 1 ? "Mainly clear" : code === 2 ? "Partly cloudy" : "Overcast";
  if (code <= 55) return "Drizzle";
  if (code <= 65) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Rain showers";
  return "Thunderstorm";
}

// ─── News feed seed ────────────────────────────────────────────────────────
const NEWS_ITEMS = [
  { id: "n1", title: "New GBV resources added for Gauteng schools", source: "M-TETO News", time: "2 hours ago", tag: "Resources" },
  { id: "n2", title: "Thuthuzela Care Centres expand services to Soweto", source: "Health-e News", time: "5 hours ago", tag: "Health" },
  { id: "n3", title: "Children's rights: Know your protections under Section 28", source: "Learn · M-TETO", time: "Yesterday", tag: "Rights" },
  { id: "n4", title: "SA Department of Justice releases new school safety guide", source: "DoJ ZA", time: "2 days ago", tag: "Safety" },
  { id: "n5", title: "How to access legal aid as a young person in Gauteng", source: "Legal Aid SA", time: "3 days ago", tag: "Legal" },
];

// ─── Notification helpers ──────────────────────────────────────────────────
const NOTIF_KEY = "mteto_notifications";
const DIARY_KEY = "mteto_diary";
const REMINDER_KEY = "mteto_reminders";

interface Notif { id: string; type: string; title: string; message: string; time: string; read: boolean; }
interface DiaryEntry { id: string; content: string; mood: string; date: string; }
interface Reminder { id: string; text: string; date: string; done: boolean; }

const DEFAULT_NOTIFS: Notif[] = [
  { id: "dn1", type: "university", title: "New chapter available", message: "Your Rights at School — Chapter 3 is now live in AI University.", time: "Just now", read: false },
  { id: "dn2", type: "square", title: "You earned 20 coins!", message: "You received 20 M-Coins for completing onboarding.", time: "Today", read: false },
  { id: "dn3", type: "provider", title: "Provider update", message: "Legal Aid SA Johannesburg has updated their hours.", time: "Yesterday", read: true },
  { id: "dn4", type: "emergency", title: "Safety tip", message: "Remember: You can call 10111 free from any phone, any time.", time: "2 days ago", read: true },
];

const DEFAULT_REMINDERS: Reminder[] = [
  { id: "dr1", text: "Follow up on Case CAS001 — check status with IO", date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0], done: false },
  { id: "dr2", text: "Complete quiz: Know Your Rights", date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0], done: false },
];

function loadLS<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveLS(key: string, val: unknown) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ } }

// ─── Sub-components ────────────────────────────────────────────────────────
function SectionTitle({ icon, label, count, href }: { icon: React.ReactNode; label: string; count?: number; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-7 h-7 rounded-xl brand-gradient shadow-sm">{icon}</span>
        <span className="font-display font-bold text-sm text-foreground">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      {href && (
        <Link href={href}>
          <span className="text-[11px] text-primary font-semibold flex items-center gap-0.5">See all <ChevronRight className="w-3 h-3" /></span>
        </Link>
      )}
    </div>
  );
}

function NotifIcon({ type }: { type: string }) {
  const cls = "w-4 h-4";
  if (type === "university") return <GraduationCap className={`${cls} text-violet-500`} />;
  if (type === "square") return <ShoppingBag className={`${cls} text-amber-500`} />;
  if (type === "provider") return <MapPin className={`${cls} text-cyan-500`} />;
  if (type === "emergency") return <AlertTriangle className={`${cls} text-red-500`} />;
  return <Bell className={`${cls} text-pink-500`} />;
}

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const { data: pointsData } = useGetPoints({ query: { enabled: isAuthenticated } });

  const name = localStorage.getItem("mteto_name") || user?.firstName || "friend";
  const province = localStorage.getItem("mteto_province") || "Gauteng";

  // ── Weather ──
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherOffline, setWeatherOffline] = useState(false);

  useEffect(() => {
    const cached = loadLS<{ data: WeatherData; ts: number } | null>("mteto_weather_cache", null);
    if (cached && Date.now() - cached.ts < 30 * 60 * 1000) {
      setWeather(cached.data);
      setWeatherLoading(false);
      return;
    }
    fetch("https://api.open-meteo.com/v1/forecast?latitude=-26.2044&longitude=28.0456&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Africa%2FJohannesburg")
      .then(r => r.json())
      .then(d => {
        const w: WeatherData = {
          temp: Math.round(d.current.temperature_2m),
          humidity: d.current.relative_humidity_2m,
          windSpeed: Math.round(d.current.wind_speed_10m),
          code: d.current.weather_code,
        };
        setWeather(w);
        saveLS("mteto_weather_cache", { data: w, ts: Date.now() });
      })
      .catch(() => {
        if (cached) { setWeather(cached.data); } else { setWeatherOffline(true); }
      })
      .finally(() => setWeatherLoading(false));
  }, []);

  // ── Notifications ──
  const [notifs, setNotifs] = useState<Notif[]>(() => {
    const stored = loadLS<Notif[] | null>(NOTIF_KEY, null);
    if (!stored) { saveLS(NOTIF_KEY, DEFAULT_NOTIFS); return DEFAULT_NOTIFS; }
    return stored;
  });

  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = (id: string) => {
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifs(updated); saveLS(NOTIF_KEY, updated);
  };

  const dismissNotif = (id: string) => {
    const updated = notifs.filter(n => n.id !== id);
    setNotifs(updated); saveLS(NOTIF_KEY, updated);
  };

  const markAllRead = () => {
    const updated = notifs.map(n => ({ ...n, read: true }));
    setNotifs(updated); saveLS(NOTIF_KEY, updated);
  };

  // ── Diary ──
  const [diary, setDiary] = useState<DiaryEntry[]>(() => loadLS<DiaryEntry[]>(DIARY_KEY, []));
  const [diaryText, setDiaryText] = useState("");
  const [diaryMood, setDiaryMood] = useState("😊");
  const [showDiaryForm, setShowDiaryForm] = useState(false);

  const addDiaryEntry = () => {
    if (!diaryText.trim()) return;
    const entry: DiaryEntry = {
      id: Date.now().toString(),
      content: diaryText.trim(),
      mood: diaryMood,
      date: new Date().toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }),
    };
    const updated = [entry, ...diary].slice(0, 20);
    setDiary(updated); saveLS(DIARY_KEY, updated);
    setDiaryText(""); setShowDiaryForm(false);
  };

  const deleteDiary = (id: string) => {
    const updated = diary.filter(d => d.id !== id);
    setDiary(updated); saveLS(DIARY_KEY, updated);
  };

  // ── Reminders ──
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const stored = loadLS<Reminder[] | null>(REMINDER_KEY, null);
    if (!stored) { saveLS(REMINDER_KEY, DEFAULT_REMINDERS); return DEFAULT_REMINDERS; }
    return stored;
  });

  const [reminderText, setReminderText] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [showReminderForm, setShowReminderForm] = useState(false);

  const addReminder = () => {
    if (!reminderText.trim()) return;
    const r: Reminder = { id: Date.now().toString(), text: reminderText.trim(), date: reminderDate, done: false };
    const updated = [r, ...reminders];
    setReminders(updated); saveLS(REMINDER_KEY, updated);
    setReminderText(""); setReminderDate(""); setShowReminderForm(false);
  };

  const toggleReminder = (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, done: !r.done } : r);
    setReminders(updated); saveLS(REMINDER_KEY, updated);
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated); saveLS(REMINDER_KEY, updated);
  };

  // ── Points / Progress ──
  const totalPoints = pointsData?.totalPoints ?? 0;
  const transactions = pointsData?.transactions ?? [];
  const level = Math.floor(totalPoints / 100) + 1;
  const levelProgress = totalPoints % 100;

  // ── Greet ──
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <MobileLayout title="My Dashboard">
      <div className="px-3 py-4 space-y-5">

        {/* TETO Greeting Card */}
        <div className="brand-gradient rounded-3xl p-4 flex items-center gap-3 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shrink-0" aria-hidden="true">
            🦅
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-sans font-semibold">{greeting},</p>
            <h1 className="text-white font-display font-bold text-lg leading-tight truncate capitalize">{name}!</h1>
            <p className="text-white/70 text-[11px] font-sans mt-0.5">TETO is here to help you today.</p>
          </div>
          <div className="text-right shrink-0">
            <div className="bg-white/20 rounded-xl px-2.5 py-1.5 text-center">
              <p className="text-white font-bold text-lg leading-none">{totalPoints}</p>
              <p className="text-white/70 text-[10px] font-sans">coins</p>
            </div>
          </div>
        </div>

        {/* Offline banner */}
        {!navigator.onLine && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2" role="alert" aria-live="polite">
            <RefreshCw className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-amber-700 text-xs font-semibold">You're offline — showing cached content. Emergency page still works.</p>
          </div>
        )}

        {/* Emergency Panic Button */}
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 shadow-sm">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">🚨 Emergency Access</p>
          <div className="flex gap-2">
            <a
              href="tel:10111"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-colors"
              aria-label="Call SAPS emergency on 10111"
            >
              <Shield className="w-4 h-4" /> SAPS 10111
            </a>
            <a
              href="tel:0800333177"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-colors"
              aria-label="Call Gauteng Department of Community Safety helpline on 0800 333 177"
            >
              <AlertTriangle className="w-4 h-4" /> GCS 0800
            </a>
            <Link href="/emergency">
              <button className="bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs py-3 px-3 rounded-2xl flex items-center justify-center shadow-lg transition-colors" aria-label="Go to full emergency page">
                All<br />Help
              </button>
            </Link>
          </div>
        </div>

        {/* Weather */}
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-3xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-2">
            🌤 Gauteng Weather · {province}
          </p>
          {weatherLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Fetching weather…</p>
          ) : weatherOffline ? (
            <p className="text-sm text-muted-foreground">Weather unavailable offline.</p>
          ) : weather ? (
            <div className="flex items-center gap-4">
              {weatherIcon(weather.code)}
              <div>
                <p className="text-3xl font-bold text-sky-700">{weather.temp}°C</p>
                <p className="text-xs text-sky-600 font-semibold">{weatherDesc(weather.code)}</p>
              </div>
              <div className="ml-auto text-right space-y-1">
                <div className="flex items-center gap-1 justify-end text-[11px] text-sky-600">
                  <Droplets className="w-3 h-3" /> {weather.humidity}%
                </div>
                <div className="flex items-center gap-1 justify-end text-[11px] text-sky-600">
                  <Wind className="w-3 h-3" /> {weather.windSpeed} km/h
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Notifications */}
        <div>
          <SectionTitle icon={<Bell className="w-3.5 h-3.5 text-white" />} label="Notifications" count={unreadCount} />
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[11px] text-primary font-semibold mb-2 hover:underline">
              Mark all as read
            </button>
          )}
          {notifs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No notifications yet.</p>
          ) : (
            <div className="space-y-2">
              {notifs.slice(0, 4).map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 rounded-2xl px-3 py-2.5 border transition-colors ${n.read ? "bg-background border-border/40" : "bg-primary/5 border-primary/20"}`}
                  onClick={() => markRead(n.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Notification: ${n.title}. ${n.read ? "Read" : "Unread"}`}
                  onKeyDown={e => e.key === "Enter" && markRead(n.id)}
                >
                  <span className="mt-0.5 shrink-0"><NotifIcon type={n.type} /></span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${n.read ? "text-foreground" : "text-primary"}`}>{n.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{n.time}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); dismissNotif(n.id); }} aria-label={`Dismiss notification: ${n.title}`} className="shrink-0 p-1 rounded-full hover:bg-gray-100 text-muted-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Children's News */}
        <div>
          <SectionTitle icon={<Newspaper className="w-3.5 h-3.5 text-white" />} label="Children's Updates & News" />
          <div className="space-y-2">
            {NEWS_ITEMS.map(item => (
              <div key={item.id} className="bg-background border border-border/50 rounded-2xl px-3 py-2.5 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full">{item.tag}</span>
                    <p className="text-xs font-semibold text-foreground mt-1 leading-snug">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.source} · {item.time}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-violet-50 border border-violet-100 rounded-3xl p-4 shadow-sm">
          <SectionTitle icon={<Star className="w-3.5 h-3.5 text-white" />} label="My Progress" href="/profile" />
          <div className="flex items-center gap-4 mb-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-700">{totalPoints}</p>
              <p className="text-[10px] text-violet-500 font-semibold">Total Coins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-700">{level}</p>
              <p className="text-[10px] text-violet-500 font-semibold">Level</p>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-violet-500 font-semibold mb-1">
                <span>Level {level}</span><span>Level {level + 1}</span>
              </div>
              <div className="h-2 bg-violet-200 rounded-full overflow-hidden">
                <div className="h-full brand-gradient rounded-full transition-all duration-500" style={{ width: `${levelProgress}%` }} />
              </div>
              <p className="text-[10px] text-violet-400 mt-0.5">{100 - levelProgress} coins to next level</p>
            </div>
          </div>
          {transactions.length > 0 && (
            <div className="space-y-1">
              {transactions.slice(0, 3).map((t: { id: string; reason: string; amount: number; createdAt: string }) => (
                <div key={t.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-violet-600 capitalize">{t.reason.replace("_", " ")}</span>
                  <span className="font-bold text-violet-700">+{t.amount} 🪙</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/profile">
            <button className="mt-3 w-full text-center text-[11px] font-bold text-violet-600 hover:underline">
              View full progress timeline →
            </button>
          </Link>
        </div>

        {/* University Notifications */}
        <div>
          <SectionTitle icon={<GraduationCap className="w-3.5 h-3.5 text-white" />} label="AI University" href="/university" />
          <div className="space-y-2">
            {[
              { title: "Your Rights at School — Chapter 3", sub: "Available now · 5 min read", coins: 5 },
              { title: "What is SRGBV? — Quiz available", sub: "Test your knowledge · 10 coins", coins: 10 },
              { title: "How to Report — New audio guide", sub: "Deaf-accessible · 8 min", coins: 5 },
            ].map((item, i) => (
              <Link href="/university" key={i}>
                <div className="flex items-center gap-3 bg-background border border-border/50 rounded-2xl px-3 py-2.5 hover:border-violet-200 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 shrink-0">+{item.coins}🪙</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div>
          <SectionTitle icon={<Calendar className="w-3.5 h-3.5 text-white" />} label="Reminders" />
          {showReminderForm && (
            <div className="bg-background border border-primary/20 rounded-2xl p-3 mb-3 space-y-2">
              <input
                type="text"
                aria-label="Reminder text"
                placeholder="What do you need to remember?"
                value={reminderText}
                onChange={e => setReminderText(e.target.value)}
                className="w-full text-xs border border-border/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                type="date"
                aria-label="Reminder date"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                className="w-full text-xs border border-border/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addReminder} className="flex-1 rounded-xl text-xs brand-gradient border-0 text-white">Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReminderForm(false)} className="rounded-xl text-xs">Cancel</Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {reminders.slice(0, 5).map(r => (
              <div key={r.id} className={`flex items-start gap-2 rounded-2xl px-3 py-2.5 border ${r.done ? "bg-gray-50 border-gray-100 opacity-60" : "bg-background border-border/50"}`}>
                <button onClick={() => toggleReminder(r.id)} aria-label={r.done ? `Mark "${r.text}" as not done` : `Mark "${r.text}" as done`} className="mt-0.5 shrink-0">
                  {r.done ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground/40" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${r.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{r.text}</p>
                  {r.date && <p className="text-[10px] text-muted-foreground">{r.date}</p>}
                </div>
                <button onClick={() => deleteReminder(r.id)} aria-label={`Delete reminder: ${r.text}`} className="shrink-0 p-1 rounded-full hover:bg-gray-100 text-muted-foreground">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {reminders.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No reminders yet.</p>}
          </div>
          <button onClick={() => setShowReminderForm(true)} className="mt-2 flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add reminder
          </button>
        </div>

        {/* Diary */}
        <div>
          <SectionTitle icon={<Pencil className="w-3.5 h-3.5 text-white" />} label="My Diary" />
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 mb-3">
            <p className="text-[10px] text-amber-700 font-semibold mb-2">Your diary is private and stored only on this device.</p>
            {showDiaryForm ? (
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {["😊", "😢", "😡", "😰", "💪", "❤️", "🙏", "🌈"].map(m => (
                    <button key={m} onClick={() => setDiaryMood(m)} aria-label={`Mood: ${m}`} className={`text-lg rounded-xl p-1 transition-all ${diaryMood === m ? "bg-amber-200 scale-110" : "hover:bg-amber-100"}`}>{m}</button>
                  ))}
                </div>
                <textarea
                  aria-label="Diary entry text"
                  placeholder="What happened today? How are you feeling?"
                  value={diaryText}
                  onChange={e => setDiaryText(e.target.value)}
                  className="w-full text-xs border border-amber-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addDiaryEntry} className="flex-1 rounded-xl text-xs bg-amber-500 hover:bg-amber-600 border-0 text-white">Save entry</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowDiaryForm(false)} className="rounded-xl text-xs">Cancel</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDiaryForm(true)} className="flex items-center gap-2 text-xs text-amber-700 font-semibold hover:underline">
                <Plus className="w-3.5 h-3.5" /> Write today's entry
              </button>
            )}
          </div>
          <div className="space-y-2">
            {diary.slice(0, 3).map(d => (
              <div key={d.id} className="bg-background border border-border/50 rounded-2xl px-3 py-2.5 flex items-start gap-2">
                <span className="text-xl shrink-0" aria-hidden="true">{d.mood}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground line-clamp-2">{d.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{d.date}</p>
                </div>
                <button onClick={() => deleteDiary(d.id)} aria-label="Delete diary entry" className="shrink-0 p-1 rounded-full hover:bg-gray-100 text-muted-foreground">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {diary.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No diary entries yet. Your thoughts are safe here.</p>}
          </div>
        </div>

        {/* The Square Notifications */}
        <div>
          <SectionTitle icon={<ShoppingBag className="w-3.5 h-3.5 text-white" />} label="The Square" href="/square" />
          <div className="space-y-2">
            {[
              { title: "New item: Know Your Rights booklet", sub: "15 coins · Available now" },
              { title: "Limited: SRGBV Awareness wristband", sub: "50 coins · 12 left" },
            ].map((item, i) => (
              <Link href="/square" key={i}>
                <div className="flex items-center gap-3 bg-background border border-border/50 rounded-2xl px-3 py-2.5 hover:border-amber-200 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Service Provider Notifications */}
        <div>
          <SectionTitle icon={<MapPin className="w-3.5 h-3.5 text-white" />} label="Service Provider Updates" href="/directory" />
          <div className="space-y-2">
            {[
              { name: "Legal Aid SA — Johannesburg", update: "Now accepting walk-in clients Mon–Fri 8am–3pm", type: "Legal" },
              { name: "Thuthuzela Care Centre · Soweto", update: "New forensic nurse on duty — shorter wait times", type: "Health" },
              { name: "Lifeline SA — Gauteng", update: "24/7 crisis counselling: 0861 322 322", type: "Support" },
            ].map((sp, i) => (
              <Link href="/directory" key={i}>
                <div className="bg-background border border-border/50 rounded-2xl px-3 py-2.5 hover:border-cyan-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded-full">{sp.type}</span>
                    <p className="text-xs font-semibold text-foreground truncate">{sp.name}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{sp.update}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Copyright footer */}
        <p className="text-center text-[10px] text-muted-foreground/50 font-sans pb-2">
          © {new Date().getFullYear()} Adv. Thando Gumede ZA · M-TETO™
        </p>
      </div>
    </MobileLayout>
  );
}
