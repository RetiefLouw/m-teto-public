import { useState } from "react";
import { useAccessibility, type DisabilityProfile } from "@/context/AccessibilityContext";
import { X, Eye, EyeOff, Volume2, VolumeX, Type, Contrast, Zap, ZapOff, Keyboard, Minus, Plus, Captions, Brain, Hand } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PROFILES = [
  {
    id: "blind" as DisabilityProfile,
    emoji: "👁️",
    label: "Blind / Low Vision",
    desc: "Turns on text-to-speech, high contrast, and large text",
    color: "bg-violet-50 border-violet-300 text-violet-800",
    activeColor: "bg-violet-500 border-violet-500 text-white",
  },
  {
    id: "deaf" as DisabilityProfile,
    emoji: "🦻",
    label: "Deaf / Hard of Hearing",
    desc: "Enables captions on all videos and visual-only alerts",
    color: "bg-blue-50 border-blue-300 text-blue-800",
    activeColor: "bg-blue-500 border-blue-500 text-white",
  },
  {
    id: "cognitive" as DisabilityProfile,
    emoji: "🧠",
    label: "Cognitive / Learning",
    desc: "Simplified view, dyslexia-friendly font, reduced motion",
    color: "bg-amber-50 border-amber-300 text-amber-800",
    activeColor: "bg-amber-500 border-amber-500 text-white",
  },
  {
    id: "motor" as DisabilityProfile,
    emoji: "✋",
    label: "Motor / Physical",
    desc: "Large tap targets, full keyboard navigation support",
    color: "bg-teal-50 border-teal-300 text-teal-800",
    activeColor: "bg-teal-500 border-teal-500 text-white",
  },
];

export function AccessibilityPanel() {
  const { prefs, setProfile, setPref, panelOpen, closePanel, isSpeaking, speak, stopSpeaking } = useAccessibility();

  if (!panelOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Accessibility Settings">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closePanel}
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        >
          <div className="sticky top-0 bg-white z-10 px-5 pt-5 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">Accessibility Settings</h2>
                <p className="text-sm text-gray-500 mt-0.5">Personalise M-TETO for your needs</p>
              </div>
              <button
                onClick={closePanel}
                aria-label="Close accessibility settings"
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="px-5 pt-4 pb-8 space-y-6">
            {/* Disability Profiles */}
            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Disability Profile</h3>
              <div className="grid grid-cols-2 gap-3">
                {PROFILES.map(p => {
                  const isActive = prefs.profile === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setProfile(isActive ? "none" : p.id)}
                      aria-pressed={isActive}
                      className={`text-left p-4 rounded-2xl border-2 transition-all ${isActive ? p.activeColor : p.color}`}
                    >
                      <div className="text-2xl mb-1">{p.emoji}</div>
                      <div className="font-bold text-sm leading-tight">{p.label}</div>
                      <div className={`text-xs mt-1 leading-snug ${isActive ? "text-white/80" : "text-gray-500"}`}>{p.desc}</div>
                    </button>
                  );
                })}
              </div>
              {prefs.profile !== "none" && (
                <button
                  onClick={() => setProfile("none")}
                  className="mt-3 w-full text-sm text-gray-400 underline text-center"
                >
                  Reset to default (no profile)
                </button>
              )}
            </section>

            {/* Text-to-Speech */}
            <section className="bg-violet-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-violet-600" />
                  <span className="font-bold text-gray-800">Text-to-Speech</span>
                </div>
                <Toggle value={prefs.tts} onChange={v => setPref("tts", v)} label="Toggle text-to-speech" />
              </div>
              {prefs.tts && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Speed: {prefs.ttsRate.toFixed(1)}x</label>
                    <input
                      type="range" min="0.5" max="2" step="0.1" value={prefs.ttsRate}
                      onChange={e => setPref("ttsRate", parseFloat(e.target.value))}
                      aria-label="Speech rate"
                      className="w-full accent-violet-500"
                    />
                  </div>
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speak("Welcome to M-TETO. Text-to-speech is now active. I will read content aloud for you.")}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isSpeaking ? "bg-red-500 text-white" : "bg-violet-500 text-white"}`}
                  >
                    {isSpeaking ? <><VolumeX className="w-4 h-4" /> Stop Speaking</> : <><Volume2 className="w-4 h-4" /> Test Voice</>}
                  </button>
                </div>
              )}
            </section>

            {/* Visual */}
            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Visual</h3>
              <div className="space-y-3">
                <ToggleRow
                  icon={<Contrast className="w-4 h-4" />}
                  label="High Contrast"
                  desc="Black & white high contrast colours"
                  value={prefs.highContrast}
                  onChange={v => setPref("highContrast", v)}
                />
                <ToggleRow
                  icon={<Type className="w-4 h-4" />}
                  label="Large Text"
                  desc="Increases text size across the app"
                  value={prefs.largeText}
                  onChange={v => setPref("largeText", v)}
                />
                <ToggleRow
                  icon={<Brain className="w-4 h-4" />}
                  label="Dyslexia-Friendly Font"
                  desc="Uses OpenDyslexic font for easier reading"
                  value={prefs.dyslexiaFont}
                  onChange={v => setPref("dyslexiaFont", v)}
                />
                <ToggleRow
                  icon={<ZapOff className="w-4 h-4" />}
                  label="Reduce Motion"
                  desc="Turns off animations and transitions"
                  value={prefs.reduceMotion}
                  onChange={v => setPref("reduceMotion", v)}
                />
              </div>
            </section>

            {/* Hearing */}
            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Hearing</h3>
              <div className="space-y-3">
                <ToggleRow
                  icon={<Captions className="w-4 h-4" />}
                  label="Deaf / Hard of Hearing Mode"
                  desc="Always show captions, visual-only alerts"
                  value={prefs.deafMode}
                  onChange={v => { setPref("deafMode", v); setPref("alwaysShowCaptions", v); }}
                />
                <ToggleRow
                  icon={<Captions className="w-4 h-4" />}
                  label="Always Show Captions"
                  desc="Show [CC] badge and captions on all videos"
                  value={prefs.alwaysShowCaptions}
                  onChange={v => setPref("alwaysShowCaptions", v)}
                />
              </div>
            </section>

            {/* Cognitive & Motor */}
            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Reading & Navigation</h3>
              <div className="space-y-3">
                <ToggleRow
                  icon={<Brain className="w-4 h-4" />}
                  label="Simplified View"
                  desc="Shorter texts, fewer elements on screen"
                  value={prefs.simplifiedView}
                  onChange={v => setPref("simplifiedView", v)}
                />
                <ToggleRow
                  icon={<Keyboard className="w-4 h-4" />}
                  label="Keyboard Navigation"
                  desc="Highlight focus rings for keyboard users"
                  value={prefs.keyboardMode}
                  onChange={v => setPref("keyboardMode", v)}
                />
              </div>
            </section>

            {/* Sign Language Resources */}
            <section className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl" aria-hidden="true">🤟</span>
                <div>
                  <h3 className="font-bold text-blue-900 text-sm">South African Sign Language (SASL)</h3>
                  <p className="text-xs text-blue-600">Resources for Deaf and Hard of Hearing learners</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href="https://www.youtube.com/results?search_query=south+african+sign+language+for+children"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-700 font-semibold hover:text-blue-900 bg-white rounded-xl px-3 py-2.5"
                  aria-label="SASL video lessons on YouTube (opens in new tab)"
                >
                  <span aria-hidden="true">📺</span> SASL Video Lessons (YouTube)
                </a>
                <a
                  href="https://www.deafsa.co.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-700 font-semibold hover:text-blue-900 bg-white rounded-xl px-3 py-2.5"
                  aria-label="Deaf South Africa — national organisation for the Deaf (opens in new tab)"
                >
                  <span aria-hidden="true">🌐</span> Deaf SA — National Deaf Organisation
                </a>
                <a
                  href="https://www.sanhanes.org.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-700 font-semibold hover:text-blue-900 bg-white rounded-xl px-3 py-2.5"
                  aria-label="SANHANES SASL resources (opens in new tab)"
                >
                  <span aria-hidden="true">📚</span> SASL Learning Resources
                </a>
                <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                  <strong>SASL</strong> is South Africa's official sign language and is recognised in the 2023 Constitution Amendment. All children have the right to access education in SASL.
                </p>
              </div>
            </section>

            {/* WCAG Compliance note */}
            <section className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg" aria-hidden="true">✅</span>
                <h3 className="font-bold text-green-800 text-sm">Accessibility Commitment</h3>
              </div>
              <p className="text-xs text-green-700 leading-relaxed mb-2">
                M-TETO is built to meet <strong>WCAG 2.1 Level AA</strong> accessibility standards. We are committed to ensuring all children — regardless of disability — can access their rights information.
              </p>
              <p className="text-xs text-green-600">
                Features include: screen reader support, keyboard navigation, high contrast, large text, captions, TTS, dyslexia font, reduced motion, and SASL resources.
              </p>
            </section>

            <div className="bg-pink-50 rounded-2xl p-4 text-center">
              <p className="text-sm text-pink-700 font-medium">
                © Adv. Thando Gumede ZA &nbsp;·&nbsp; M-TETO is committed to full accessibility for all children.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${value ? "bg-violet-500" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-6" : "translate-x-0.5"}`} />
    </button>
  );
}

function ToggleRow({ icon, label, desc, value, onChange }: {
  icon: React.ReactNode; label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${value ? "border-violet-300 bg-violet-50" : "border-gray-100 bg-white"}`}
      onClick={() => onChange(!value)}>
      <div className={`p-2 rounded-lg ${value ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-500"}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm text-gray-800">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <Toggle value={value} onChange={onChange} label={label} />
    </div>
  );
}
