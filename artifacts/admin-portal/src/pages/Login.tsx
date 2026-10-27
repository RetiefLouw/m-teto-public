import { useState } from "react";
import { verifyAdminPin } from "@/lib/api";
import { Shield, Lock } from "lucide-react";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const tryLogin = async () => {
    setLoading(true);
    try {
      if (await verifyAdminPin(pin)) {
        sessionStorage.setItem("mteto_admin_authed", "1");
        onLogin();
      } else {
        setError(true);
        setPin("");
      }
    } catch {
      setError(true);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0F172A]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-[#E8215D]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">M-TETO</h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Secure Access</h2>
          <p className="text-sm text-gray-500 mb-6">
            Authorised access for Adv. Thando Gumede ZA and M-TETO Search Engine only. Unauthorised access is prohibited.
          </p>

          <label
            htmlFor="admin-pin-input"
            className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2"
          >
            Admin PIN
          </label>
          <input
            id="admin-pin-input"
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            placeholder="Enter your PIN"
            aria-describedby={error ? "pin-error" : undefined}
            className={`w-full border-2 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest outline-none transition-all mb-3 ${
              error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#E8215D]"
            }`}
            maxLength={20}
            autoFocus
          />
          {error && (
            <p id="pin-error" role="alert" className="text-red-500 text-sm font-medium mb-3 text-center">
              Incorrect PIN. Please try again.
            </p>
          )}

          <button
            onClick={tryLogin}
            disabled={loading || !pin}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #E8215D, #7C3AED)" }}
          >
            <Lock className="w-4 h-4" />
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>

          <p className="text-xs text-gray-400 text-center mt-5">
            This portal is the exclusive property of Adv. Thando Gumede ZA. All access is logged and monitored.
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          M-TETO Search Engine &nbsp;·&nbsp; © Adv. Thando Gumede ZA
        </p>
      </div>
    </div>
  );
}
