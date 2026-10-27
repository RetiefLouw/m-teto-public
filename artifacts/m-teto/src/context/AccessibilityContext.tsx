import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type DisabilityProfile = "none" | "blind" | "deaf" | "cognitive" | "motor";

export interface AccessibilityPrefs {
  profile: DisabilityProfile;
  tts: boolean;
  ttsRate: number;
  ttsPitch: number;
  highContrast: boolean;
  largeText: boolean;
  dyslexiaFont: boolean;
  deafMode: boolean;
  simplifiedView: boolean;
  keyboardMode: boolean;
  reduceMotion: boolean;
  alwaysShowCaptions: boolean;
}

const DEFAULTS: AccessibilityPrefs = {
  profile: "none",
  tts: false,
  ttsRate: 0.9,
  ttsPitch: 1.0,
  highContrast: false,
  largeText: false,
  dyslexiaFont: false,
  deafMode: false,
  simplifiedView: false,
  keyboardMode: false,
  reduceMotion: false,
  alwaysShowCaptions: false,
};

const STORAGE_KEY = "mteto_accessibility";

interface AccessibilityContextValue {
  prefs: AccessibilityPrefs;
  setProfile: (profile: DisabilityProfile) => void;
  setPref: <K extends keyof AccessibilityPrefs>(key: K, value: AccessibilityPrefs[K]) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULTS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULTS;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    const root = document.documentElement;
    root.classList.toggle("a11y-high-contrast", prefs.highContrast);
    root.classList.toggle("a11y-large-text", prefs.largeText);
    root.classList.toggle("a11y-dyslexia", prefs.dyslexiaFont);
    root.classList.toggle("a11y-reduce-motion", prefs.reduceMotion);
    root.classList.toggle("a11y-deaf-mode", prefs.deafMode);
    root.classList.toggle("a11y-simplified", prefs.simplifiedView);
    root.classList.toggle("a11y-keyboard", prefs.keyboardMode);
  }, [prefs]);

  const setPref = <K extends keyof AccessibilityPrefs>(key: K, value: AccessibilityPrefs[K]) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const setProfile = (profile: DisabilityProfile) => {
    let updates: Partial<AccessibilityPrefs> = { profile };
    if (profile === "blind") {
      updates = { ...updates, tts: true, largeText: true, highContrast: true, keyboardMode: true };
    } else if (profile === "deaf") {
      updates = { ...updates, deafMode: true, alwaysShowCaptions: true };
    } else if (profile === "cognitive") {
      updates = { ...updates, simplifiedView: true, largeText: true, dyslexiaFont: true, reduceMotion: true };
    } else if (profile === "motor") {
      updates = { ...updates, keyboardMode: true, largeText: true };
    } else {
      updates = { ...DEFAULTS };
    }
    setPrefs(prev => ({ ...prev, ...updates }));
  };

  const speak = (text: string) => {
    if (!prefs.tts || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = prefs.ttsRate;
    utterance.pitch = prefs.ttsPitch;
    utterance.lang = "en-ZA";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  return (
    <AccessibilityContext.Provider value={{
      prefs, setProfile, setPref, speak, stopSpeaking, isSpeaking,
      panelOpen, openPanel: () => setPanelOpen(true), closePanel: () => setPanelOpen(false)
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used inside AccessibilityProvider");
  return ctx;
}
