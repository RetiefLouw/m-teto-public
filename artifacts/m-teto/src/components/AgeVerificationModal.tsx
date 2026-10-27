import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GRADE_OPTIONS = [
  { value: "grade_1_2", label: "Gr 1–2", ages: "Ages 5–8", emoji: "🌱", color: "from-lime-400 to-emerald-400" },
  { value: "grade_3_5", label: "Gr 3–5", ages: "Ages 8–12", emoji: "🌟", color: "from-cyan-400 to-blue-400" },
  { value: "grade_6_7", label: "Gr 6–7", ages: "Ages 12–14", emoji: "⚡", color: "from-violet-400 to-purple-500" },
  { value: "grade_8_12", label: "Gr 8–12", ages: "Ages 14–19", emoji: "🔥", color: "from-rose-400 to-pink-500" },
];

interface AgeVerificationModalProps {
  open: boolean;
  onClose: (gradeLevel: string) => void;
}

export function AgeVerificationModal({ open, onClose }: AgeVerificationModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = () => {
    if (selected) {
      localStorage.setItem("mteto_grade", selected);
      onClose(selected);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-[360px] rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(135deg, #1a0035 0%, #0d0028 100%)" }}
          >
            {/* Starfield header */}
            <div className="relative px-6 pt-8 pb-5 text-center overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                {["top-2 left-4", "top-4 right-8", "top-1 left-1/2", "top-6 right-4", "top-3 left-10"].map((pos, i) => (
                  <span key={i} className={`absolute text-yellow-300 text-xs opacity-70 ${pos}`}>✦</span>
                ))}
              </div>
              <div className="text-4xl mb-2">🚀</div>
              <h2 className="font-display text-2xl font-bold text-white mb-1">
                Welcome to M-TETO!
              </h2>
              <p className="text-white/70 text-sm font-sans">
                Pick your grade so we show you<br />the right content. <span className="text-yellow-300 font-bold">No sign-up needed!</span>
              </p>
            </div>

            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                {GRADE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelected(opt.value)}
                    className={`relative rounded-2xl p-4 text-left transition-all duration-200 border-2 ${
                      selected === opt.value
                        ? "border-white scale-105 shadow-lg"
                        : "border-white/20 hover:border-white/50 hover:scale-105"
                    }`}
                    style={{
                      background: selected === opt.value ? undefined : "rgba(255,255,255,0.07)"
                    }}
                  >
                    <div
                      className={`w-full h-full absolute inset-0 rounded-2xl bg-gradient-to-br ${opt.color} transition-opacity`}
                      style={{ opacity: selected === opt.value ? 1 : 0 }}
                    />
                    <div className="relative z-10">
                      <div className="text-2xl mb-1">{opt.emoji}</div>
                      <div className="font-display font-bold text-white text-lg leading-none">{opt.label}</div>
                      <div className="text-white/70 text-xs font-sans mt-0.5">{opt.ages}</div>
                    </div>
                    {selected === opt.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <span className="text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleConfirm}
                disabled={!selected}
                className="w-full py-4 rounded-2xl font-display font-bold text-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: selected ? "linear-gradient(135deg, #E8215D, #F4826C, #F7B56A)" : "#444",
                  color: "white",
                  boxShadow: selected ? "0 4px 24px rgba(232,33,93,0.4)" : "none"
                }}
              >
                Let's Go! 🌟
              </button>

              <p className="text-center text-white/40 text-[10px] font-sans mt-3">
                Your choice stays on this device only. No personal data collected.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
