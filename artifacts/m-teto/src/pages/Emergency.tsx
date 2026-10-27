import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Heart, Shield, AlertTriangle, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/trackEvent";

const EMERGENCY_CONTACTS = [
  {
    category: "Immediate Emergency",
    urgent: true,
    contacts: [
      { name: "Police Service (SAPS)", number: "10111", icon: "🚨", free: true, desc: "For immediate danger, crimes in progress" },
      { name: "Ambulance / Medical", number: "10177", icon: "🚑", free: true, desc: "Life-threatening injuries or medical emergencies" },
      { name: "Childline South Africa", number: "116", icon: "📞", free: true, desc: "24/7 support for children — ALWAYS FREE" },
    ],
  },
  {
    category: "Gender-Based Violence",
    urgent: true,
    contacts: [
      { name: "GBV Command Centre", number: "0800 428 428", icon: "💙", free: true, desc: "Free 24/7 GBV support and counselling" },
      { name: "Stop GBV Helpline", number: "0800 150 150", icon: "🛡️", free: true, desc: "Counselling, support and referrals" },
      { name: "Lifeline South Africa", number: "0861 322 322", icon: "🌸", free: false, desc: "Crisis counselling and trauma support" },
    ],
  },
  {
    category: "Sexual Violence",
    urgent: true,
    contacts: [
      { name: "TEARS Foundation", number: "010 590 5920", icon: "💜", free: false, desc: "SMS 'HELP' to 085 1301 also works" },
      { name: "Rape Crisis Cape Town", number: "021 447 9762", icon: "🌺", free: false, desc: "24hr crisis support for Western Cape" },
      { name: "People Opposing Women Abuse", number: "011 642 4345", icon: "✊", free: false, desc: "Counselling and shelter for Gauteng" },
    ],
  },
  {
    category: "Mental Health & Wellbeing",
    urgent: false,
    contacts: [
      { name: "South African Depression & Anxiety Group", number: "0800 456 789", icon: "🧠", free: true, desc: "SADAG — 24/7 mental health support" },
      { name: "Suicide Crisis Line", number: "0800 567 567", icon: "💚", free: true, desc: "24/7 crisis intervention" },
      { name: "SADAG SMSLine", number: "31393 (SMS)", icon: "💬", free: false, desc: "SMS to get a call back for mental health support" },
    ],
  },
  {
    category: "Legal Help",
    urgent: false,
    contacts: [
      { name: "Legal Aid South Africa", number: "0800 110 110", icon: "⚖️", free: true, desc: "Free legal advice for those who can't afford it" },
      { name: "SAPS Gender Desk", number: "10111", icon: "👮", free: true, desc: "Ask for the Gender Desk at your nearest police station" },
      { name: "Children's Rights Centre", number: "031 202 8921", icon: "👧", free: false, desc: "Legal advice for children's rights matters" },
    ],
  },
  {
    category: "Online Safety",
    urgent: false,
    contacts: [
      { name: "FPB Complaints", number: "087 150 0000", icon: "💻", free: true, desc: "Report harmful online content" },
      { name: "Cybercrimes Hotline", number: "0800 123 456", icon: "🔒", free: true, desc: "Report cyberbullying, online grooming, sexting" },
    ],
  },
];

const THUTHUZELA_LOCATIONS = [
  { province: "Western Cape", name: "Tygerberg Hospital TCC", address: "Parow, Cape Town", phone: "021 938 5000" },
  { province: "Gauteng", name: "Charlotte Maxeke TCC", address: "Parktown, Johannesburg", phone: "011 488 4911" },
  { province: "KwaZulu-Natal", name: "King Edward Hospital TCC", address: "Durban", phone: "031 360 3111" },
  { province: "Eastern Cape", name: "Livingstone Hospital TCC", address: "Port Elizabeth", phone: "041 405 9111" },
  { province: "Limpopo", name: "Mankweng Hospital TCC", address: "Polokwane", phone: "015 267 9000" },
  { province: "Mpumalanga", name: "Rob Ferreira Hospital TCC", address: "Nelspruit", phone: "013 741 6000" },
  { province: "Free State", name: "Pelonomi Hospital TCC", address: "Bloemfontein", phone: "051 405 1911" },
  { province: "North West", name: "Klerksdorp/Tshepong Hospital TCC", address: "Klerksdorp", phone: "018 406 3000" },
  { province: "Northern Cape", name: "Kimberley Hospital TCC", address: "Kimberley", phone: "053 802 9111" },
];

// ─── Gauteng Department of Community Safety Panic Button ──────────────────
function GcsPanicButton() {
  const [activated, setActivated] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handlePanic = () => {
    setActivated(true);
    // Attempt to call SAPS — tel: link opens dialler
    window.location.href = "tel:10111";
    // Log locally
    try {
      const log = JSON.parse(localStorage.getItem("mteto_panic_log") || "[]");
      log.unshift({ ts: new Date().toISOString(), action: "panic_activated" });
      localStorage.setItem("mteto_panic_log", JSON.stringify(log.slice(0, 20)));
    } catch { /* ignore */ }
  };

  return (
    <div className="mx-4 mt-4">
      <div className="rounded-3xl overflow-hidden border-2 border-orange-300 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
        {/* Header stripe */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2.5 flex items-center gap-2">
          <Shield className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
          <p className="text-white font-bold text-xs uppercase tracking-wider">
            Gauteng Department of Community Safety — Official Panic Button
          </p>
        </div>
        <div className="p-4">
          {activated ? (
            <div className="text-center py-2" role="alert" aria-live="assertive">
              <div className="text-4xl mb-2" aria-hidden="true">📲</div>
              <p className="font-bold text-red-700 text-base">Help is on the way!</p>
              <p className="text-sm text-red-600 mt-1">Calling SAPS 10111 — stay on the line.</p>
              <p className="text-xs text-muted-foreground mt-2">GCS Victim Support: <a href="tel:0800333177" className="font-bold text-orange-600 underline">0800 333 177</a></p>
            </div>
          ) : confirming ? (
            <div className="space-y-3" role="alertdialog" aria-labelledby="panic-confirm-heading" aria-modal="true">
              <p id="panic-confirm-heading" className="font-bold text-red-700 text-center text-sm">Confirm emergency call to SAPS 10111?</p>
              <div className="flex gap-2">
                <button
                  onClick={handlePanic}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl text-sm shadow-md transition-colors"
                  aria-label="Yes, call SAPS emergency number 10111"
                >
                  ✅ YES — Call 10111
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-2xl text-sm transition-colors"
                  aria-label="Cancel emergency call"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-orange-800 font-semibold mb-3">
                This panic button connects you directly to emergency services and the Gauteng Community Safety helpline.
              </p>
              {/* Main panic button */}
              <button
                onClick={() => setConfirming(true)}
                className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-lg py-5 rounded-2xl shadow-xl transition-all duration-150 flex items-center justify-center gap-3"
                aria-label="Activate panic button — calls SAPS emergency services"
                style={{ animation: "pulse 2s infinite" }}
              >
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
                🆘 PANIC
              </button>
              {/* Secondary contacts */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href="tel:0800333177"
                  className="flex items-center justify-center gap-1.5 bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs py-2.5 px-2 rounded-xl"
                  aria-label="Call GCS Victim Support on 0800 333 177"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  GCS Helpline
                </a>
                <a
                  href="https://www.communitysafety.gpg.gov.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs py-2.5 px-2 rounded-xl"
                  aria-label="Visit Gauteng Community Safety website (opens in new window)"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  GCS Website
                </a>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                GCS Victim Support: 0800 333 177 · SAPS: 10111 · Free 24/7
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Emergency() {
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [, navigate] = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    trackEvent("emergency_visit", { source: "direct" });
    /* Move screen reader focus to the page heading on mount */
    headingRef.current?.focus();
  }, []);

  const provinces = [...new Set(THUTHUZELA_LOCATIONS.map((l) => l.province))];
  const filteredTCC =
    selectedProvince === "all"
      ? THUTHUZELA_LOCATIONS
      : THUTHUZELA_LOCATIONS.filter((l) => l.province === selectedProvince);

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header */}
      <header
        className="sticky top-0 z-20 bg-white border-b border-red-100"
        role="banner"
      >
        <div className="flex items-center px-4 py-3 gap-3">
          <button
            onClick={() => navigate("/")}
            aria-label="Go back to home page"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180 text-gray-600" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center"
              aria-hidden="true"
            >
              <AlertTriangle className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="font-display font-black text-lg text-gray-900 focus:outline-none"
              >
                Emergency Help
              </h1>
              <p className="text-xs text-muted-foreground">24/7 support is always available</p>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          GAUTENG DEPARTMENT OF COMMUNITY SAFETY — PANIC BUTTON
          ═══════════════════════════════════════════════════════════ */}
      <GcsPanicButton />

      {/* Urgent callout — role=alert announces to screen readers immediately */}
      <div
        role="alert"
        aria-live="assertive"
        className="mx-4 mt-4 p-4 rounded-2xl bg-red-50 border-2 border-red-200"
      >
        <div className="flex items-center gap-2 mb-2">
          <span aria-hidden="true" className="text-2xl">🚨</span>
          <p className="font-display font-black text-base text-red-700">
            Are you in immediate danger?
          </p>
        </div>
        <p className="text-sm text-red-600 mb-3">
          Call <strong>10111</strong> (Police) or <strong>116</strong> (Childline) RIGHT NOW — both are FREE.
        </p>
        <div className="flex gap-2" role="group" aria-label="Emergency call buttons">
          <a
            href="tel:10111"
            aria-label="Call Police Service SAPS on 10111 — free"
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white rounded-xl py-3 font-display font-bold text-base hover:bg-red-700 transition-colors"
          >
            <Phone className="w-4 h-4" aria-hidden="true" /> 10111 Police
          </a>
          <a
            href="tel:116"
            aria-label="Call Childline South Africa on 116 — free 24/7"
            className="flex-1 flex items-center justify-center gap-2 bg-pink-600 text-white rounded-xl py-3 font-display font-bold text-base hover:bg-pink-700 transition-colors"
          >
            <Phone className="w-4 h-4" aria-hidden="true" /> 116 Childline
          </a>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Emergency contacts by category */}
        {EMERGENCY_CONTACTS.map((cat) => (
          <section key={cat.category} aria-labelledby={`cat-${cat.category.replace(/\s+/g, "-").toLowerCase()}`}>
            <div className="flex items-center gap-2 mb-3">
              {cat.urgent && (
                <span
                  className="w-2 h-2 rounded-full bg-red-500"
                  aria-hidden="true"
                />
              )}
              <h2
                id={`cat-${cat.category.replace(/\s+/g, "-").toLowerCase()}`}
                className="font-display font-bold text-sm text-foreground uppercase tracking-wide"
              >
                {cat.urgent && <span className="sr-only">Urgent: </span>}
                {cat.category}
              </h2>
            </div>
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
              {cat.contacts.map((c) => {
                const isSMS = c.number.includes("SMS");
                const ariaLabel = isSMS
                  ? `${c.name} — SMS ${c.number.replace(" (SMS)", "")}. ${c.desc}`
                  : `Call ${c.name} on ${c.number}${c.free ? " — FREE" : ""}. ${c.desc}`;
                return (
                  <li key={c.number}>
                    <motion.a
                      href={isSMS ? undefined : `tel:${c.number.replace(/\s/g, "")}`}
                      aria-label={ariaLabel}
                      className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 hover:bg-gray-100 transition-colors cursor-pointer"
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-2xl flex-shrink-0" aria-hidden="true">{c.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.desc}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="font-display font-bold text-sm" style={{ color: "#E8215D" }}>
                          {c.number}
                        </div>
                        {c.free && (
                          <div className="text-[10px] text-green-600 font-bold">FREE</div>
                        )}
                      </div>
                    </motion.a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {/* Thuthuzela Care Centres */}
        <section aria-labelledby="tcc-heading">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-pink-500" aria-hidden="true" />
            <h2
              id="tcc-heading"
              className="font-display font-bold text-sm text-foreground uppercase tracking-wide"
            >
              Thuthuzela Care Centres (TCC)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            TCCs are one-stop centres for survivors of sexual violence — free medical care, counselling, legal help.
          </p>

          {/* Province filter */}
          <div
            role="group"
            aria-label="Filter Thuthuzela Care Centres by province"
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-3"
          >
            <button
              onClick={() => setSelectedProvince("all")}
              aria-pressed={selectedProvince === "all"}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-bold transition-all"
              style={{
                background: selectedProvince === "all" ? "#E8215D" : "#F3F4F6",
                color: selectedProvince === "all" ? "white" : "#374151",
              }}
            >
              All
            </button>
            {provinces.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedProvince(p)}
                aria-pressed={selectedProvince === p}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-bold transition-all"
                style={{
                  background: selectedProvince === p ? "#E8215D" : "#F3F4F6",
                  color: selectedProvince === p ? "white" : "#374151",
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <ul
            className="flex flex-col gap-2.5 list-none p-0 m-0"
            aria-live="polite"
            aria-label="Thuthuzela Care Centre locations"
          >
            {filteredTCC.map((tcc) => (
              <li key={tcc.name} className="bg-pink-50 rounded-2xl px-4 py-3.5 border border-pink-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">{tcc.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">{tcc.address}</p>
                    </div>
                    <p className="text-xs text-pink-500 font-semibold mt-0.5">{tcc.province}</p>
                  </div>
                  <a
                    href={`tel:${tcc.phone.replace(/\s/g, "")}`}
                    aria-label={`Call ${tcc.name} on ${tcc.phone}`}
                    className="flex items-center gap-1 bg-white rounded-xl px-3 py-2 shadow-sm hover:bg-pink-50 transition-colors flex-shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5 text-pink-500" aria-hidden="true" />
                    <span className="text-xs font-bold text-pink-600">{tcc.phone}</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* What to expect when you report */}
        <section aria-labelledby="report-heading" className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
          <h2
            id="report-heading"
            className="font-display font-bold text-sm text-violet-800 mb-3 flex items-center gap-2"
          >
            <Shield className="w-4 h-4" aria-hidden="true" /> What happens when you report?
          </h2>
          <ol className="space-y-2 list-none p-0 m-0">
            {[
              "You will be listened to with care and respect",
              "A case number (CAS) will be given to you — write it down!",
              "You can request a J88 medical examination form",
              "A social worker may be assigned to support you",
              "You can apply for a Protection Order if in danger",
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black text-white"
                  style={{ background: "#7C3AED" }}
                  aria-hidden="true"
                >
                  {i + 1}
                </div>
                <p className="text-xs text-violet-700">
                  <span className="sr-only">Step {i + 1}: </span>
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className="h-8" aria-hidden="true" />
      </div>
    </div>
  );
}
