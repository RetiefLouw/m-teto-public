import { useState } from "react";
import type { SPUser } from "@/App";
import { Shield, Eye, EyeOff, Lock, UserPlus, LogIn, AlertTriangle, CheckCircle } from "lucide-react";

interface LoginProps {
  onLogin: (user: SPUser) => void;
}

const ACCOUNTS_KEY = "mteto_sp_accounts";

interface SPAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  organisation: string;
  department: string;
  role: "sp" | "admin";
  status: "active" | "pending";
  createdAt: string;
}

async function hashPassword(password: string): Promise<string> {
  const buf = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function loadAccounts(): SPAccount[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]"); } catch { return []; }
}

function saveAccounts(accounts: SPAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

const DEPARTMENTS = [
  "Case Management", "Legal Aid", "Social Work", "Child Protection",
  "Gender-Based Violence Unit", "Victim Support", "Community Outreach",
  "School-Based Support", "Health Services", "Counselling",
  "Administration", "Management", "Other",
];

const ROLES = [
  { value: "sp", label: "Service Provider / Official" },
  { value: "admin", label: "System Administrator" },
];

export function Login({ onLogin }: LoginProps) {
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regOrg, setRegOrg] = useState("");
  const [regDept, setRegDept] = useState("");
  const [regRole, setRegRole] = useState<"sp" | "admin">("sp");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    await new Promise(r => setTimeout(r, 500));

    // Try registered accounts first
    const accounts = loadAccounts();
    const hash = await hashPassword(password.trim());
    const match = accounts.find(a => a.email.toLowerCase() === email.toLowerCase().trim() && a.passwordHash === hash);

    if (match) {
      if (match.status === "pending") {
        setLoginError("Your account is pending approval. Contact your system administrator.");
        setLoginLoading(false);
        return;
      }
      onLogin({ pin: match.id, role: match.role, name: match.name, organisation: match.organisation, department: match.department });
      setLoginLoading(false);
      return;
    }

    // Fallback: legacy PIN check (email field used as PIN for backward compat)
    const pinInput = email.trim();
    try {
      const response = await fetch("/api/sp/inquiry-stats", {
        headers: { "x-sp-pin": pinInput },
        credentials: "include",
      });
      if (response.ok) {
        onLogin({ pin: pinInput, role: "sp", name: "Service Provider", organisation: "M-TETO Network", department: "Case Management" });
        setLoginLoading(false);
        return;
      }
    } catch {
      // Show the same generic login error for unavailable and rejected credentials.
    }

    setLoginError("Incorrect email or password. If you haven't registered yet, please create an account.");
    setLoginLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");

    if (!regName.trim() || !regEmail.trim() || !regOrg.trim() || !regDept.trim()) {
      setRegError("Please fill in all required fields.");
      return;
    }
    if (regPassword.length < 8) {
      setRegError("Password must be at least 8 characters.");
      return;
    }
    if (regPassword !== regPassword2) {
      setRegError("Passwords do not match.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setRegError("Please enter a valid email address.");
      return;
    }

    const accounts = loadAccounts();
    if (accounts.some(a => a.email.toLowerCase() === regEmail.toLowerCase().trim())) {
      setRegError("An account with this email already exists. Please log in.");
      return;
    }

    setRegLoading(true);
    const hash = await hashPassword(regPassword);
    const newAccount: SPAccount = {
      id: `sp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      email: regEmail.trim().toLowerCase(),
      passwordHash: hash,
      name: regName.trim(),
      organisation: regOrg.trim(),
      department: regDept,
      role: regRole,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    saveAccounts([...accounts, newAccount]);
    setRegLoading(false);
    setRegSuccess(true);

    // Auto-login after 1.5s
    setTimeout(() => {
      onLogin({ pin: newAccount.id, role: newAccount.role, name: newAccount.name, organisation: newAccount.organisation, department: newAccount.department });
    }, 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(218,30%,8%)] px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-900/40">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">M-TETO</h1>
          <p className="text-sm text-muted-foreground mt-1">Service Provider Tracking System</p>
          <p className="text-xs text-muted-foreground/50 mt-0.5">Authorised Personnel Only · All access is logged</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-5">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "login" ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground hover:text-white"}`}
            aria-pressed={tab === "login"}
          >
            <LogIn size={14} /> Log In
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "register" ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground hover:text-white"}`}
            aria-pressed={tab === "register"}
          >
            <UserPlus size={14} /> Create Account
          </button>
        </div>

        {/* ── LOGIN TAB ── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="bg-[hsl(218,25%,14%)] rounded-2xl p-6 border border-border space-y-4">
            <div>
              <label htmlFor="sp-email" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="sp-email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setLoginError(""); }}
                placeholder="your@organisation.gov.za"
                autoComplete="email"
                required
                className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="sp-password" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  id="sp-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginError(""); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  aria-describedby={loginError ? "sp-login-error" : undefined}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div id="sp-login-error" role="alert" className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                {loginError}
              </div>
            )}

            <button type="submit" disabled={loginLoading} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              <LogIn size={14} />
              {loginLoading ? "Verifying..." : "Log In"}
            </button>

            <p className="text-center text-xs text-muted-foreground/60">
              No account?{" "}
              <button type="button" onClick={() => setTab("register")} className="text-blue-400 hover:text-blue-300 underline font-semibold">
                Create one here
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER TAB ── */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="bg-[hsl(218,25%,14%)] rounded-2xl p-6 border border-border space-y-4">
            {regSuccess ? (
              <div className="text-center py-4" role="status" aria-live="polite">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-white font-bold text-base">Account created!</p>
                <p className="text-muted-foreground text-sm mt-1">Logging you in…</p>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Full Name <span className="text-red-400">*</span></label>
                  <input id="reg-name" type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Your full legal name" autoComplete="name" required
                    className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Work Email Address <span className="text-red-400">*</span></label>
                  <input id="reg-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@organisation.gov.za" autoComplete="email" required
                    className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div>
                  <label htmlFor="reg-org" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Organisation <span className="text-red-400">*</span></label>
                  <input id="reg-org" type="text" value={regOrg} onChange={e => setRegOrg(e.target.value)} placeholder="e.g. Dept. of Justice, SAPS, Legal Aid SA" autoComplete="organization" required
                    className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div>
                  <label htmlFor="reg-dept" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Department / Role <span className="text-red-400">*</span></label>
                  <select id="reg-dept" value={regDept} onChange={e => setRegDept(e.target.value)} required
                    className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="">Select department…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="reg-role" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Account Type <span className="text-red-400">*</span></label>
                  <select id="reg-role" value={regRole} onChange={e => setRegRole(e.target.value as "sp" | "admin")}
                    className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground focus:outline-none focus:border-blue-500 transition-colors">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="reg-pw" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Password (min. 8 characters) <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input id="reg-pw" type={showRegPw ? "text" : "password"} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Create a strong password" autoComplete="new-password" required minLength={8}
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors" />
                    <button type="button" onClick={() => setShowRegPw(v => !v)} aria-label={showRegPw ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showRegPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-pw2" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Confirm Password <span className="text-red-400">*</span></label>
                  <input id="reg-pw2" type="password" value={regPassword2} onChange={e => setRegPassword2(e.target.value)} placeholder="Repeat your password" autoComplete="new-password" required
                    className="w-full px-3 py-2.5 rounded-lg bg-[hsl(218,20%,18%)] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                {regError && (
                  <div role="alert" className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {regError}
                  </div>
                )}

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
                  <strong>Note:</strong> By creating an account you confirm you are an authorised service provider, government official, NGO or NPO representative. All activity is logged and monitored. False registration is a criminal offence.
                </div>

                <button type="submit" disabled={regLoading} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <UserPlus size={14} />
                  {regLoading ? "Creating Account…" : "Create My Account"}
                </button>

                <p className="text-center text-xs text-muted-foreground/60">
                  Already registered?{" "}
                  <button type="button" onClick={() => setTab("login")} className="text-blue-400 hover:text-blue-300 underline font-semibold">Log in here</button>
                </p>
              </>
            )}
          </form>
        )}

        <p className="text-center text-[10px] text-muted-foreground/40 mt-6">
          © Adv. Thando Gumede ZA · M-TETO™ · All Rights Reserved<br />
          Unauthorised access is prohibited and monitored.
        </p>
      </div>
    </div>
  );
}
