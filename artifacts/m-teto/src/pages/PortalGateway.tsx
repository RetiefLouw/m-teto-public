import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const PORTALS = [
  {
    id: "learner",
    emoji: "🐣",
    title: "M-TETO",
    subtitle: "For Children & Young People",
    description:
      "Meet TETO the phoenix — your justice companion and friend here to help you learn, grow and become the ultimate human rights defender. Free lawyers, emergency contacts, case tracking and AI-powered rights guidance.",
    badge: "TETO guides you through setup",
    badgeCls: "bg-pink-500/20 text-pink-300 border border-pink-500/30",
    cta: "Enter M-TETO",
    ctaCls: "bg-[#E8215D] hover:bg-[#c81a4f] text-white",
    href: `${BASE}/explore`,
    gradient: "from-[#E8215D]/20 to-[#F4826C]/10",
    border: "border-[#E8215D]/30 hover:border-[#E8215D]/60",
    iconBg: "bg-[#E8215D]",
    tags: ["TETO Onboarding", "AI Search", "Emergency Contacts", "Free Lawyers", "Case Tracker"],
  },
  {
    id: "sp",
    emoji: "🏛️",
    title: "Service Provider Portal",
    subtitle: "For Officials, NGOs & NPOs",
    description:
      "Log case progress, update SA Justice Value Chain steps, report non-compliant officials and blow the whistle on corruption. Secure and confidential.",
    badge: "Sign-in required",
    badgeCls: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    cta: "Enter SP Portal",
    ctaCls: "bg-blue-600 hover:bg-blue-500 text-white",
    href: `${BASE}/service-provider/`,
    gradient: "from-blue-600/20 to-blue-400/10",
    border: "border-blue-500/30 hover:border-blue-500/60",
    iconBg: "bg-blue-600",
    tags: ["Case Tracking", "Step Updates", "Accountability", "Whistleblower", "Justice Timeline"],
  },
  {
    id: "admin",
    emoji: "⚙️",
    title: "Admin Portal",
    subtitle: "For System Administrators",
    description:
      "Full system oversight — manage service providers and officials, review accountability ratings, run intelligence reports and monitor the platform.",
    badge: "Admin access only",
    badgeCls: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
    cta: "Enter Admin Portal",
    ctaCls: "bg-slate-600 hover:bg-slate-500 text-white",
    href: `${BASE}/admin-portal/`,
    gradient: "from-slate-600/20 to-slate-400/10",
    border: "border-slate-500/30 hover:border-slate-500/60",
    iconBg: "bg-slate-600",
    tags: ["Provider Management", "Official Ratings", "Intelligence", "Analytics", "Legal Docs"],
  },
];

export default function PortalGateway() {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col overflow-auto">
      {/* Hero */}
      <div className="text-center pt-14 pb-10 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14 }}
          className="inline-flex items-center gap-3 mb-6"
        >
          <div className="text-5xl">🐦</div>
          <div className="text-left">
            <h1 className="text-3xl font-black text-white tracking-tight">M-TETO</h1>
            <p className="text-xs text-slate-400 font-medium">SRGBV Platform · South Africa</p>
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed"
        >
          Choose your portal below. Each section is designed for a different audience.
        </motion.p>
      </div>

      {/* Portal Cards */}
      <div className="flex-1 px-4 pb-12 max-w-4xl mx-auto w-full">
        <div className="grid gap-4 md:grid-cols-3">
          {PORTALS.map((p, i) => (
            <motion.a
              key={p.id}
              href={p.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className={`block rounded-2xl border bg-gradient-to-br ${p.gradient} ${p.border} p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30 group`}
            >
              {/* Icon + title */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl ${p.iconBg} flex items-center justify-center text-xl flex-shrink-0 shadow-lg`}>
                  {p.emoji}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-white leading-tight">{p.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{p.subtitle}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{p.description}</p>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {p.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/8 text-slate-400 border border-white/10">
                    {t}
                  </span>
                ))}
              </div>

              {/* Access badge */}
              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${p.badgeCls} mb-4`}>
                {p.badge}
              </span>

              {/* CTA */}
              <div className={`w-full py-2.5 rounded-xl text-center text-sm font-bold ${p.ctaCls} transition-colors`}>
                {p.cta} →
              </div>
            </motion.a>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-600 mt-10">
          © Adv. Thando Gumede ZA · M-TETO™ · All Rights Reserved · Combating SRGBV in South Africa
        </p>
      </div>
    </div>
  );
}
