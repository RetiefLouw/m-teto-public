import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TetoAvatar } from "@/components/Teto/TetoAvatar";
import { Eye, EyeOff, Lock, User, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";

// ── Storage ────────────────────────────────────────────────────────────────
const ACCOUNTS_KEY = "mteto_accounts";
const SESSION_KEY  = "mteto_session";

interface MtetoAccount {
  alias: string;
  passwordHash: string;
  createdAt: string;
}

function loadAccounts(): MtetoAccount[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]"); } catch { return []; }
}
function saveAccounts(a: MtetoAccount[]) { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a)); }
export function getSession(): string | null { return localStorage.getItem(SESSION_KEY); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

async function hashPw(pw: string): Promise<string> {
  const buf = new TextEncoder().encode(pw);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Helpers ───────────────────────────────────────────────────────────────
const ALIAS_TIPS = ["StarFighter99", "BlueLion27", "JusticeHero5", "FirePhoenix3", "SafeGuard77"];

interface Props {
  onSignedIn: (alias: string, isNew: boolean) => void;
}

export function TetoSignIn({ onSignedIn }: Props) {
  const [tab, setTab] = useState<"signup" | "login">("signup");

  // Shared
  const [alias, setAlias]     = useState("");
  const [pw, setPw]           = useState("");
  const [pw2, setPw2]         = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [talking, setTalking] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setTalking(false), 3000);
    return () => clearTimeout(t);
  }, [tab]);

  function resetFields() {
    setAlias(""); setPw(""); setPw2(""); setError("");
  }

  function switchTab(t: "signup" | "login") {
    setTab(t);
    setTalking(true);
    resetFields();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimAlias = alias.trim();
    if (trimAlias.length < 3)        { setError("Your alias needs at least 3 characters!"); return; }
    if (trimAlias.length > 30)       { setError("Alias is too long (max 30 characters)."); return; }
    if (/\s/.test(trimAlias))        { setError("No spaces in your alias — try StarFighter99 style!"); return; }
    if (pw.length < 6)               { setError("Password must be at least 6 characters."); return; }
    if (pw !== pw2)                  { setError("Passwords don't match — check again!"); return; }

    const accounts = loadAccounts();
    if (accounts.some(a => a.alias.toLowerCase() === trimAlias.toLowerCase())) {
      setError("That alias is already taken! Try a different one.");
      return;
    }

    setLoading(true);
    const hash = await hashPw(pw);
    const newAccount: MtetoAccount = { alias: trimAlias, passwordHash: hash, createdAt: new Date().toISOString() };
    saveAccounts([...accounts, newAccount]);
    localStorage.setItem(SESSION_KEY, trimAlias);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => onSignedIn(trimAlias, true), 1200);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimAlias = alias.trim();
    if (!trimAlias || !pw) { setError("Please fill in both your alias and password."); return; }

    setLoading(true);
    const hash = await hashPw(pw);
    const accounts = loadAccounts();
    const match = accounts.find(a => a.alias.toLowerCase() === trimAlias.toLowerCase() && a.passwordHash === hash);

    if (!match) {
      setError("Alias or password is wrong. Try again, or create a new account!");
      setLoading(false);
      return;
    }

    localStorage.setItem(SESSION_KEY, match.alias);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => onSignedIn(match.alias, false), 800);
  }

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-gradient-to-b from-[#E8215D] to-[#C01040]"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="min-h-full flex flex-col items-center px-5 py-8">

        {/* TETO avatar + title */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex flex-col items-center mt-4 mb-6"
        >
          <TetoAvatar grade="grade_3_5" size={100} animated />
          <h1
            className="text-4xl font-black text-white mt-3 tracking-tight"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            M-TETO
          </h1>
          <p className="text-white/70 text-sm mt-0.5">South Africa's Justice Search Engine</p>
        </motion.div>

        {/* TETO speech bubble */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="w-full max-w-sm bg-white/20 border border-white/30 rounded-3xl px-5 py-4 mb-5 text-center"
          >
            <p className="text-white font-bold text-sm leading-relaxed">
              {tab === "signup"
                ? <>Hi! I'm <strong>TETO</strong> the phoenix 🔥 — your justice companion! Create a <em>secret alias</em> and a password to get started safely.</>
                : <>Welcome back, hero! Enter your alias and password and I'll take you right in 🦅</>
              }
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex w-full max-w-sm bg-white/15 border border-white/20 rounded-2xl p-1 mb-5">
          <button
            onClick={() => switchTab("signup")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
              tab === "signup" ? "bg-white text-[#E8215D] shadow-md" : "text-white/80 hover:text-white"
            }`}
          >
            🦸 New Hero
          </button>
          <button
            onClick={() => switchTab("login")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
              tab === "login" ? "bg-white text-[#E8215D] shadow-md" : "text-white/80 hover:text-white"
            }`}
          >
            🔑 Sign In
          </button>
        </div>

        {/* Form card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: tab === "signup" ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tab === "signup" ? 40 : -40 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm bg-white/15 border border-white/25 rounded-3xl p-6"
          >
            {success ? (
              <div className="flex flex-col items-center py-4 gap-3" role="status" aria-live="polite">
                <CheckCircle size={48} className="text-white" />
                <p className="text-white font-black text-lg">
                  {tab === "signup" ? "Account created! 🎉" : "Welcome back! 🦅"}
                </p>
                <p className="text-white/70 text-sm">Getting TETO ready…</p>
              </div>
            ) : (
              <form onSubmit={tab === "signup" ? handleSignUp : handleLogin} className="space-y-4">

                {/* Alias field */}
                <div>
                  <label
                    htmlFor="teto-alias"
                    className="block text-white/80 text-xs font-black uppercase tracking-wider mb-2"
                  >
                    <User size={11} className="inline mr-1" />
                    Your Secret Alias
                  </label>
                  <input
                    id="teto-alias"
                    type="text"
                    value={alias}
                    onChange={e => { setAlias(e.target.value); setError(""); }}
                    placeholder="e.g. StarFighter99"
                    maxLength={30}
                    autoComplete="username"
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/50 font-bold focus:outline-none focus:ring-2 focus:ring-white/50 text-base"
                  />
                  {tab === "signup" && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ALIAS_TIPS.map(tip => (
                        <button
                          type="button"
                          key={tip}
                          onClick={() => { setAlias(tip); setError(""); }}
                          className="px-2.5 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[10px] font-bold hover:bg-white/25 active:scale-95 transition-all"
                        >
                          {tip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <label
                    htmlFor="teto-pw"
                    className="block text-white/80 text-xs font-black uppercase tracking-wider mb-2"
                  >
                    <Lock size={11} className="inline mr-1" />
                    Password {tab === "signup" && <span className="normal-case font-normal">(min. 6 characters)</span>}
                  </label>
                  <div className="relative">
                    <input
                      id="teto-pw"
                      type={showPw ? "text" : "password"}
                      value={pw}
                      onChange={e => { setPw(e.target.value); setError(""); }}
                      placeholder="Create a password"
                      autoComplete={tab === "signup" ? "new-password" : "current-password"}
                      className="w-full pl-4 pr-11 py-3 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/50 font-bold focus:outline-none focus:ring-2 focus:ring-white/50 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password (sign-up only) */}
                {tab === "signup" && (
                  <div>
                    <label
                      htmlFor="teto-pw2"
                      className="block text-white/80 text-xs font-black uppercase tracking-wider mb-2"
                    >
                      <Lock size={11} className="inline mr-1" />
                      Confirm Password
                    </label>
                    <input
                      id="teto-pw2"
                      type="password"
                      value={pw2}
                      onChange={e => { setPw2(e.target.value); setError(""); }}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      className="w-full px-4 py-3 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/50 font-bold focus:outline-none focus:ring-2 focus:ring-white/50 text-base"
                    />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="flex items-start gap-2 bg-yellow-400/20 border border-yellow-400/40 rounded-2xl px-4 py-3"
                  >
                    <AlertTriangle size={15} className="text-yellow-300 shrink-0 mt-0.5" />
                    <p className="text-yellow-100 text-sm font-bold leading-relaxed">🔥 TETO says: {error}</p>
                  </motion.div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-white text-[#E8215D] font-black text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform disabled:opacity-60"
                >
                  {loading ? "One moment…" : tab === "signup" ? <>Create My Account <ChevronRight size={20} /></> : <>Sign In <ChevronRight size={20} /></>}
                </button>

                {/* Switch prompt */}
                <p className="text-center text-white/60 text-xs">
                  {tab === "signup"
                    ? <>Already have an account?{" "}<button type="button" onClick={() => switchTab("login")} className="text-white font-black underline">Sign in here</button></>
                    : <>No account yet?{" "}<button type="button" onClick={() => switchTab("signup")} className="text-white font-black underline">Create one here</button></>
                  }
                </p>
              </form>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Always-available emergency strip */}
        <div className="w-full max-w-sm mt-6 bg-black/20 border border-white/15 rounded-2xl p-4">
          <p className="text-white/60 text-[11px] font-bold uppercase tracking-wider mb-3 text-center">
            Emergency — no sign-in needed
          </p>
          <div className="grid grid-cols-2 gap-2">
            <a href="tel:10111" className="flex items-center justify-center gap-1.5 bg-red-600 text-white text-xs font-black py-2.5 rounded-xl active:scale-95 transition-transform">
              🚨 SAPS 10111
            </a>
            <a href="tel:116" className="flex items-center justify-center gap-1.5 bg-[#E8215D] text-white text-xs font-black py-2.5 rounded-xl active:scale-95 transition-transform">
              📞 Childline 116
            </a>
            <a href="tel:0800428428" className="col-span-2 flex items-center justify-center gap-1.5 bg-blue-700 text-white text-xs font-black py-2.5 rounded-xl active:scale-95 transition-transform">
              💙 GBV Helpline 0800 428 428 — FREE 24/7
            </a>
          </div>
        </div>

        <p className="text-white/30 text-[10px] text-center mt-5 pb-4">
          © Adv. Thando Gumede ZA · M-TETO™ · All Rights Reserved
        </p>
      </div>
    </div>
  );
}
