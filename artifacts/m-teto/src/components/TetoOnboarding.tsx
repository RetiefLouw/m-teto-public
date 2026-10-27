import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TetoAvatar } from "@/components/Teto/TetoAvatar";
import { ChevronRight, ChevronLeft, Check, Star, Coins, Search, BookOpen, Shield, ShoppingBag, Users } from "lucide-react";
import { useAccessibility, type DisabilityProfile } from "@/context/AccessibilityContext";

// ─── Types ──────────────────────────────────────────────────────────────────
type Screen =
  | "splash"
  | "name"
  | "save-alias"
  | "grade"
  | "gender"
  | "province"
  | "school"
  | "disability"
  | "tut-search"
  | "tut-help"
  | "tut-track"
  | "tut-learn"
  | "tut-square"
  | "quiz"
  | "celebrate";

const SCREENS: Screen[] = [
  "splash", "name", "save-alias", "grade",
  "gender", "province", "school", "disability",
  "tut-search", "tut-help", "tut-track", "tut-learn", "tut-square",
  "quiz", "celebrate",
];

// ─── Demographic options ─────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { id: "girl", emoji: "👧", label: "Girl" },
  { id: "boy",  emoji: "👦", label: "Boy"  },
];

const SA_PROVINCES = [
  "Gauteng", "KwaZulu-Natal", "Western Cape", "Eastern Cape",
  "Limpopo", "Mpumalanga", "Free State", "North West", "Northern Cape",
];

// ─── Disability profiles (mirrors AccessibilityPanel) ────────────────────────
const DISABILITY_PROFILES = [
  {
    id: "blind" as DisabilityProfile,
    emoji: "👁️",
    label: "Blind / Low Vision",
    desc: "Big text, high contrast & text-to-speech turned on",
    color: "bg-violet-100 border-violet-400 text-violet-900",
  },
  {
    id: "deaf" as DisabilityProfile,
    emoji: "🦻",
    label: "Deaf / Hard of Hearing",
    desc: "Captions on all videos, visual-only alerts",
    color: "bg-blue-100 border-blue-400 text-blue-900",
  },
  {
    id: "cognitive" as DisabilityProfile,
    emoji: "🧠",
    label: "Learning / Cognitive",
    desc: "Simpler view, dyslexia-friendly font, less movement",
    color: "bg-amber-100 border-amber-400 text-amber-900",
  },
  {
    id: "motor" as DisabilityProfile,
    emoji: "✋",
    label: "Motor / Physical",
    desc: "Larger buttons and full keyboard navigation",
    color: "bg-teal-100 border-teal-400 text-teal-900",
  },
];

// ─── Secret alias examples ───────────────────────────────────────────────────
const ALIAS_EXAMPLES = [
  "StarFighter99", "BlueLion27", "JusticeHero5", "QuantumKid",
  "FirePhoenix3", "SafeGuard77", "BraveStar42", "LightningBolt9",
  "TigerJustice", "NightOwl88", "RainbowShield", "IronHope6",
];

// ─── Common SA + English first names (to detect real names) ─────────────────
const COMMON_NAMES = new Set([
  "sipho","thabo","lungelo","sifiso","nhlanhla","bongani","sandile","nkosi",
  "mduduzi","lindani","siyanda","sbonelo","muzi","lungisa","nomvula","nonhlanhla",
  "nokuthula","nompilo","nokukhanya","nokwanda","nomcebo","nolwazi","nontokozo",
  "nobuhle","lerato","mpho","thato","boitumelo","refilwe","kgomotso","tlotlo",
  "dineo","palesa","tebogo","botlhe","kgosi","mandla","bongiwe","lulama",
  "zandile","yanga","siyabonga","anele","nolufefe","nosipho","ncediswa",
  "bulelani","mhle","ayanda","thandi","zanele","precious","beauty","charity",
  "blessing","lucky","happy","innocent","clever","amahle","andile","asanda",
  "bontle","busisiwe","lindiwe","lungile","nandi","nokwazi","nompumelelo",
  "phindile","sibongile","simangele","sinethemba","thabile","thandeka",
  "thenjiwe","zinhle","john","james","michael","david","daniel","matthew",
  "mark","luke","peter","paul","sarah","mary","emma","olivia","jessica",
  "emily","sophia","grace","lily","anna","lisa","susan","karen","linda",
  "barbara","patricia","jennifer","amanda","melissa","pieter","jan","hendrik",
  "charl","francois","riaan","adam","alex","ali","ben","bob","brad","brian",
  "carl","chad","chris","clark","cole","dale","dan","dean","drew","dylan",
  "eric","evan","frank","fred","gary","greg","harry","ian","jack","jake",
  "jay","jeff","jim","joe","joel","jon","josh","juan","karl","keith","kevin",
  "kim","kyle","lance","larry","leo","liam","logan","luca","marc","martin",
  "matt","max","mike","neil","nick","noah","oliver","oscar","pat","phil",
  "ray","rick","rob","ron","ross","roy","ryan","sam","scott","sean","seth",
  "shawn","simon","steve","ted","tim","todd","tom","tony","travis","troy",
  "tyler","victor","will","zach","abby","ada","alice","alison","ally","amber",
  "amy","andrea","ann","anne","annie","april","aria","ariel","ashley","audrey",
  "autumn","ava","becky","beth","betty","bonnie","brenda","brooke","caitlin",
  "carly","carol","caroline","carrie","cassie","catherine","chloe","cindy",
  "claire","claudia","colleen","courtney","crystal","dana","dawn","debbie",
  "debra","denise","diana","donna","dorothy","ella","ellen","ellie","elsa",
  "erica","erin","eve","evelyn","faith","fiona","florence","gail","gemma",
  "gina","gloria","hannah","heather","helen","holly","hope","iris","jade",
  "jamie","jane","janet","jasmine","jean","jill","joan","joanna","jodie",
  "joy","joyce","judith","julia","julie","june","kate","katie","kelly",
  "kerry","kristen","laura","lauren","leah","leslie","lucy","luna","lynn",
  "madison","margaret","marie","martha","maya","megan","mia","michelle",
  "molly","monica","morgan","nancy","natalie","natasha","nicole","nina",
  "nora","paige","pamela","paula","penny","quinn","rachel","rebecca","renee",
  "rhonda","rita","robyn","rose","ruby","ruth","sally","samantha","sandra",
  "sara","shannon","sharon","sheila","shirley","sierra","sonia","stacy",
  "stella","stephanie","sue","summer","susan","tamara","tanya","tara",
  "teresa","tiffany","tina","tracey","tracy","valerie","vanessa","vera",
  "veronica","victoria","vivian","wendy","whitney","yvonne","zoe",
]);

function looksLikeRealName(input: string): boolean {
  const n = input.trim().toLowerCase();
  if (!n || n.length < 2) return false;
  // If it has digits or non-letter chars (except spaces/hyphens) → not a real name
  if (/\d/.test(n)) return false;
  if (/[^a-z\s-]/.test(n)) return false;
  // Check against known common names list
  if (COMMON_NAMES.has(n)) return true;
  // Single word, purely alphabetic, 3–12 chars → likely a real first name
  if (/^[a-z]{3,12}$/.test(n)) return true;
  return false;
}

const GRADE_OPTIONS = [
  { id: "grade_1_2", label: "Grades 1–2", sub: "Ages 5–8 🌱", color: "#4ADE80", emoji: "🌱" },
  { id: "grade_3_5", label: "Grades 3–5", sub: "Ages 8–12 📚", color: "#60A5FA", emoji: "📚" },
  { id: "grade_6_7", label: "Grades 6–7", sub: "Ages 12–14 🎒", color: "#F472B6", emoji: "🎒" },
  { id: "grade_8_12", label: "Grades 8–12", sub: "Ages 14–19 🎓", color: "#A78BFA", emoji: "🎓" },
];

const QUIZ = [
  {
    q: "Who can you call for FREE, 24 hours a day, if you feel unsafe?",
    options: ["Police (10111)", "Childline (116)", "A neighbour", "Your teacher"],
    correct: 1,
    explain: "Childline 116 is free, confidential and available 24/7! Police (10111) is also there for emergencies.",
  },
  {
    q: "What does SRGBV stand for?",
    options: [
      "School Rules and General Behaviour Values",
      "School-Related Gender-Based Violence",
      "Students' Rights and Gender Body Verification",
      "Safe Reporting of General Bullying Violence",
    ],
    correct: 1,
    explain: "SRGBV = School-Related Gender-Based Violence. M-TETO was built to fight this and protect YOU!",
  },
  {
    q: "Every learner has the right to feel safe at school. True or False?",
    options: ["True ✅", "False ❌"],
    correct: 0,
    explain: "TRUE! The SA Constitution and Children's Act guarantee your right to safety and dignity at school.",
  },
  {
    q: "What is the minimum age to consent to sex in South Africa?",
    options: ["14 years old", "16 years old", "18 years old", "21 years old"],
    correct: 1,
    explain: "The legal age of consent in South Africa is 16. Sex with anyone under 16 is a serious crime, even if they said yes.",
  },
  {
    q: "Which law specifically protects children from abuse and neglect in South Africa?",
    options: [
      "The Labour Relations Act",
      "The Children's Act (No. 38 of 2005)",
      "The Criminal Procedure Act",
      "The Immigration Act",
    ],
    correct: 1,
    explain: "The Children's Act 38 of 2005 is the main law protecting all children in South Africa. It sets out your rights and the duties of parents, schools and the state.",
  },
  {
    q: "If a teacher physically hurts you at school, what should you do?",
    options: [
      "Stay quiet — teachers are allowed to do that",
      "Tell a trusted adult and report it — it is a crime",
      "Hit them back",
      "Leave school immediately",
    ],
    correct: 1,
    explain: "Corporal punishment (hitting) is ILLEGAL in South African schools under the SA Schools Act. Report it to a trusted adult, the principal, police, or call Childline 116. You are protected by law!",
  },
];

interface TetoOnboardingProps {
  onComplete: (grade: string, name: string) => void;
}

export function TetoOnboarding({ onComplete }: TetoOnboardingProps) {
  const { setProfile: setA11yProfile } = useAccessibility();

  const [screen, setScreen] = useState<Screen>("splash");
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [grade, setGrade] = useState("");
  const [gender, setGender] = useState("");
  const [province, setProvince] = useState("");
  const [school, setSchool] = useState("");
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const [hasDisability, setHasDisability] = useState<string>("");
  const [showDisabilityProfiles, setShowDisabilityProfiles] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(Array(QUIZ.length).fill(null));
  const [showExplain, setShowExplain] = useState(false);
  const [coinsCelebrated, setCoinsCelebrated] = useState(false);
  const [talking, setTalking] = useState(false);
  const talkTimer = useRef<ReturnType<typeof setTimeout>>();

  // Reset disability profile selector when navigating back to that screen
  useEffect(() => {
    if (screen !== "disability") setShowDisabilityProfiles(false);
  }, [screen]);

  // Whenever screen changes, TETO "talks" for a few seconds
  useEffect(() => {
    clearTimeout(talkTimer.current);
    if (screen === "splash") return;
    setTalking(true);
    talkTimer.current = setTimeout(() => setTalking(false), 3500);
    return () => clearTimeout(talkTimer.current);
  }, [screen]);

  const currentIdx = SCREENS.indexOf(screen);
  const progress = ((currentIdx) / (SCREENS.length - 1)) * 100;

  const go = useCallback((target: Screen, dir = 1) => {
    setDirection(dir);
    setScreen(target);
  }, []);

  const next = useCallback(() => {
    const idx = SCREENS.indexOf(screen);
    if (idx < SCREENS.length - 1) go(SCREENS[idx + 1], 1);
  }, [screen, go]);

  const back = useCallback(() => {
    const idx = SCREENS.indexOf(screen);
    if (idx > 0) go(SCREENS[idx - 1], -1);
  }, [screen, go]);

  // Auto-advance splash
  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => go("name", 1), 2800);
      return () => clearTimeout(t);
    }
  }, [screen, go]);

  // Celebrate coins animation
  useEffect(() => {
    if (screen === "celebrate" && !coinsCelebrated) {
      setCoinsCelebrated(true);
      localStorage.setItem("mteto_earned_coins", "50");
    }
  }, [screen, coinsCelebrated]);

  function handleNameNext() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Please make up a secret alias first — don't leave it blank!");
      return;
    }
    if (trimmed.length < 3) {
      setNameError("Your alias is too short! Try something with at least 3 characters.");
      return;
    }
    if (looksLikeRealName(trimmed)) {
      setNameError(
        "That looks like a real name! 🚨 Please make up a secret alias to keep you safe. Add numbers or mix words together — like \"StarFighter99\" or \"BlueLion27\"."
      );
      return;
    }
    setNameError(null);
    go("save-alias", 1);
  }

  function handleGradeSelect(g: string) {
    setGrade(g);
    localStorage.setItem("mteto_grade", g);
    setTimeout(() => go("gender", 1), 350);
  }

  function handleGenderSelect(g: string) {
    setGender(g);
    localStorage.setItem("mteto_gender", g);
    setTimeout(() => go("province", 1), 350);
  }

  function handleProvinceSelect(p: string) {
    setProvince(p);
    localStorage.setItem("mteto_province", p);
    setTimeout(() => go("school", 1), 350);
  }

  function handleSchoolNext() {
    const s = school.trim();
    if (!s || s.length < 3) {
      setSchoolError("Please enter your school name (at least 3 characters).");
      return;
    }
    setSchoolError(null);
    localStorage.setItem("mteto_school", s);
    go("disability", 1);
  }

  function handleDisabilityYN(answer: "yes" | "no") {
    setHasDisability(answer);
    localStorage.setItem("mteto_has_disability", answer);
    if (answer === "yes") {
      setShowDisabilityProfiles(true);
    } else {
      next();
    }
  }

  function handleDisabilityProfile(profile: DisabilityProfile) {
    setA11yProfile(profile);
    localStorage.setItem("mteto_disability_profile", profile);
    setShowDisabilityProfiles(false);
    setTimeout(() => next(), 400);
  }

  function handleQuizAnswer(ans: number) {
    const updated = [...quizAnswers];
    updated[quizIdx] = ans;
    setQuizAnswers(updated);
    setShowExplain(true);
  }

  function nextQuiz() {
    setShowExplain(false);
    if (quizIdx < QUIZ.length - 1) {
      setQuizIdx(quizIdx + 1);
    } else {
      go("celebrate", 1);
    }
  }

  function handleFinish() {
    const finalGrade = grade || "grade_3_5";
    const finalName = name.trim() || "Friend";
    localStorage.setItem("mteto_grade", finalGrade);
    localStorage.setItem("mteto_name", finalName);
    if (gender) localStorage.setItem("mteto_gender", gender);
    if (province) localStorage.setItem("mteto_province", province);
    if (school.trim()) localStorage.setItem("mteto_school", school.trim());
    localStorage.setItem("mteto_onboarding_done", "true");
    onComplete(finalGrade, finalName);
  }

  const correct = quizAnswers.filter((a, i) => a === QUIZ[i].correct).length;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#E8215D]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Progress bar */}
      {screen !== "splash" && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-10">
          <motion.div
            className="h-full bg-white rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screen}
          initial={{ x: direction * 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -80, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="absolute inset-0 flex flex-col"
        >
          {/* ── SPLASH ──────────────────────────────────────────────── */}
          {screen === "splash" && (
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#E8215D] to-[#C01040] px-6 text-center">
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 260 }}
              >
                <TetoAvatar grade="grade_3_5" size={140} animated />
              </motion.div>
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <h1 className="text-5xl font-black text-white mt-6 tracking-tight" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                  M-TETO
                </h1>
                <p className="text-white/80 text-lg mt-1">Search Engine</p>
                <p className="text-white/60 text-sm mt-4">© Adv. Thando Gumede ZA</p>
              </motion.div>
              <motion.div
                className="mt-8 flex gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                ))}
              </motion.div>
            </div>
          )}

          {/* ── NAME (Secret Alias) ────────────────────────────────── */}
          {screen === "name" && (
            <ScreenShell grade="grade_3_5" talking={talking}>
              <TetoSpeech grade="grade_3_5">
                Hi there! I'm <strong>TETO</strong> the phoenix 🔥 — your justice companion and friend here to help you learn, grow and become the ultimate human rights defender! What would you like to be called? 🌟
              </TetoSpeech>

              {/* Safety note */}
              <div className="mt-4 w-full max-w-sm bg-white/15 rounded-2xl p-3 border border-white/25">
                <p className="text-white font-black text-xs mb-1.5">🔐 Choose a <em>secret alias</em> — not your real name!</p>
                <ul className="text-white/80 text-xs space-y-1">
                  <li>✅ Mix words + numbers: <strong>BlueLion27</strong></li>
                  <li>✅ Make it fun: <strong>StarFighter99</strong></li>
                  <li>❌ Never use your real name here</li>
                </ul>
              </div>

              {/* Clickable examples */}
              <div className="mt-3 w-full max-w-sm">
                <p className="text-white/60 text-[11px] mb-2 text-center">Need ideas? Tap one to use it:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {ALIAS_EXAMPLES.slice(0, 6).map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { setName(ex); setNameError(null); }}
                      className="px-3 py-1.5 rounded-full bg-white/15 border border-white/30 text-white text-xs font-bold hover:bg-white/25 active:scale-95 transition-all"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="mt-4 w-full max-w-sm">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                  placeholder="Type your secret alias..."
                  maxLength={30}
                  autoFocus
                  className="w-full text-center text-xl font-bold px-5 py-4 rounded-2xl border-3 border-white/30 bg-white/15 text-white placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-white/30 backdrop-blur"
                  style={{ fontSize: "1.2rem" }}
                />
                <p className="text-white/50 text-xs text-center mt-2">Make it fun and memorable — this is your hero name! 🦸</p>

                {/* Error from TETO */}
                {nameError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 bg-yellow-400/20 border border-yellow-400/40 rounded-xl p-3 text-yellow-200 text-xs font-semibold leading-relaxed"
                  >
                    🔥 TETO says: {nameError}
                  </motion.div>
                )}
              </div>

              <div className="mt-auto pt-6 flex gap-3 w-full max-w-sm">
                <button
                  onClick={handleNameNext}
                  className="flex-1 py-4 rounded-2xl bg-white text-[#E8215D] font-black text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                >
                  {name.trim() ? `That's my alias! ` : "Choose an alias "}
                  <ChevronRight size={22} />
                </button>
              </div>
            </ScreenShell>
          )}

          {/* ── SAVE ALIAS REMINDER ─────────────────────────────────── */}
          {screen === "save-alias" && (
            <ScreenShell grade="grade_3_5" talking={talking} onBack={back}>
              <TetoSpeech grade="grade_3_5">
                Perfect alias, <strong>{name.trim()}</strong>! 🎉 Now this is <strong>very important</strong> — please write your alias down somewhere <strong>safe and private</strong> so you don't forget it!
              </TetoSpeech>

              {/* Chosen alias display */}
              <div className="mt-5 w-full max-w-sm bg-white/15 rounded-2xl p-4 border-2 border-white/30 text-center">
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Your Secret Alias</p>
                <p className="text-white text-2xl font-black">{name.trim()}</p>
              </div>

              {/* Safety checklist */}
              <div className="mt-4 w-full max-w-sm space-y-2">
                {[
                  { icon: "📓", text: "Write it in a private diary or notebook" },
                  { icon: "🔒", text: "Keep it private — don't post it online" },
                  { icon: "🤝", text: "Only share it with a trusted grown-up if you need help" },
                  { icon: "🚫", text: "Never use your real name on this platform" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3 bg-white/10 rounded-xl px-3 py-2.5">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <p className="text-white text-xs font-semibold leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6 w-full max-w-sm">
                <button
                  onClick={next}
                  className="w-full py-4 rounded-2xl bg-white text-[#E8215D] font-black text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                >
                  I've saved it! Continue <ChevronRight size={22} />
                </button>
              </div>
            </ScreenShell>
          )}

          {/* ── GRADE ──────────────────────────────────────────────── */}
          {screen === "grade" && (
            <ScreenShell grade="grade_3_5" talking={talking} onBack={back}>
              <TetoSpeech grade="grade_3_5">
                {name.trim() ? `Nice to meet you, ${name.trim()}! ` : "Great! "}
                To show you the right content, tell me — what grade are you in?
              </TetoSpeech>
              <div className="mt-6 w-full max-w-sm grid grid-cols-2 gap-3">
                {GRADE_OPTIONS.map((g) => (
                  <motion.button
                    key={g.id}
                    onClick={() => handleGradeSelect(g.id)}
                    whileTap={{ scale: 0.93 }}
                    className={`p-4 rounded-2xl bg-white/15 border-2 text-left transition-all ${
                      grade === g.id ? "border-white scale-105" : "border-white/20"
                    }`}
                  >
                    <div className="text-2xl mb-1">{g.emoji}</div>
                    <div className="text-white font-black text-sm">{g.label}</div>
                    <div className="text-white/60 text-xs">{g.sub.replace(g.emoji, "").trim()}</div>
                  </motion.button>
                ))}
              </div>
              <p className="text-white/50 text-xs mt-4 text-center">This helps me speak at your level 💛</p>
            </ScreenShell>
          )}

          {/* ── GENDER ─────────────────────────────────────────────── */}
          {screen === "gender" && (
            <ScreenShell grade={grade} talking={talking} onBack={back}>
              <TetoSpeech grade={grade}>
                Almost there, <strong>{name.trim() || "friend"}</strong>! 🌟 Are you a girl or a boy?
              </TetoSpeech>
              <div className="mt-6 w-full max-w-sm grid grid-cols-2 gap-3">
                {GENDER_OPTIONS.map((g) => (
                  <motion.button
                    key={g.id}
                    onClick={() => handleGenderSelect(g.id)}
                    whileTap={{ scale: 0.93 }}
                    className={`p-4 rounded-2xl bg-white/15 border-2 text-center transition-all ${
                      gender === g.id ? "border-white scale-105" : "border-white/20"
                    }`}
                  >
                    <div className="text-3xl mb-1">{g.emoji}</div>
                    <div className="text-white font-black text-sm">{g.label}</div>
                  </motion.button>
                ))}
              </div>
              <p className="text-white/50 text-xs mt-4 text-center">Your answer is private and helps improve M-TETO 💛</p>
            </ScreenShell>
          )}

          {/* ── PROVINCE ───────────────────────────────────────────── */}
          {screen === "province" && (
            <ScreenShell grade={grade} talking={talking} onBack={back}>
              <TetoSpeech grade={grade}>
                Which province are you in? 🗺️ This helps me connect you to the right helpers and services near you!
              </TetoSpeech>
              <div className="mt-5 w-full max-w-sm grid grid-cols-3 gap-2">
                {SA_PROVINCES.map((p) => (
                  <motion.button
                    key={p}
                    onClick={() => handleProvinceSelect(p)}
                    whileTap={{ scale: 0.93 }}
                    className={`py-3 px-2 rounded-2xl text-center transition-all border-2 ${
                      province === p
                        ? "bg-white text-[#E8215D] border-white font-black"
                        : "bg-white/15 text-white border-white/20 font-bold"
                    }`}
                  >
                    <div className="text-[11px] leading-tight">{p}</div>
                  </motion.button>
                ))}
              </div>
            </ScreenShell>
          )}

          {/* ── SCHOOL ─────────────────────────────────────────────── */}
          {screen === "school" && (
            <ScreenShell grade={grade} talking={talking} onBack={back}>
              <TetoSpeech grade={grade}>
                What school do you attend? 🏫 Remember — only your <strong>school name</strong>, not your personal details. This is kept safe and private.
              </TetoSpeech>
              <div className="mt-6 w-full max-w-sm">
                <input
                  type="text"
                  value={school}
                  onChange={(e) => { setSchool(e.target.value); setSchoolError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSchoolNext()}
                  placeholder="e.g. Bryanston High School"
                  maxLength={80}
                  autoFocus
                  className="w-full text-center text-base font-bold px-5 py-4 rounded-2xl border-2 border-white/30 bg-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-white/30 backdrop-blur"
                />
                {schoolError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 bg-yellow-400/20 border border-yellow-400/40 rounded-xl p-3 text-yellow-200 text-xs font-semibold"
                  >
                    🔥 TETO says: {schoolError}
                  </motion.div>
                )}
                <p className="text-white/50 text-xs text-center mt-2">Your school info is kept private and secure 🔒</p>
              </div>
              <div className="mt-auto pt-6 flex gap-3 w-full max-w-sm">
                <button
                  onClick={handleSchoolNext}
                  className="flex-1 py-4 rounded-2xl bg-white text-[#E8215D] font-black text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                >
                  That's my school! <ChevronRight size={22} />
                </button>
              </div>
            </ScreenShell>
          )}

          {/* ── DISABILITY ─────────────────────────────────────────── */}
          {screen === "disability" && (
            <ScreenShell grade={grade} talking={talking} onBack={back}>
              <AnimatePresence mode="wait">
                {!showDisabilityProfiles ? (
                  <motion.div
                    key="disability-yn"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center w-full"
                  >
                    <TetoSpeech grade={grade}>
                      One more thing, {name.trim() || "friend"}! 🧡 M-TETO is built for <strong>every child</strong>. Do you have a disability or a special need? This helps me set up the app perfectly for you.
                    </TetoSpeech>
                    <p className="text-white/60 text-xs text-center mt-1">This is completely private — only you will know 🔒</p>
                    <div className="mt-8 flex flex-col gap-4 w-full max-w-xs">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDisabilityYN("yes")}
                        className="w-full py-5 rounded-3xl bg-white text-[#E8215D] font-black text-xl shadow-xl flex items-center justify-center gap-3"
                      >
                        <span className="text-2xl">✅</span> Yes, I do
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDisabilityYN("no")}
                        className="w-full py-5 rounded-3xl bg-white/20 border-2 border-white/40 text-white font-black text-xl shadow flex items-center justify-center gap-3"
                      >
                        <span className="text-2xl">🙅</span> No, I don't
                      </motion.button>
                    </div>
                    <p className="text-white/40 text-[11px] text-center mt-4">You can always change accessibility settings later from the menu.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="disability-type"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center w-full"
                  >
                    <TetoSpeech grade={grade}>
                      Thank you for telling me! 🌟 Which of these describes you best? I'll set up M-TETO right away so it works perfectly for you!
                    </TetoSpeech>
                    <div
                      className="mt-5 grid grid-cols-2 gap-3 w-full max-w-sm"
                      role="group"
                      aria-label="Select your disability or special need — M-TETO will adjust for you"
                    >
                      {DISABILITY_PROFILES.map((p) => (
                        <motion.button
                          key={p.id}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => handleDisabilityProfile(p.id)}
                          aria-label={`${p.label} — ${p.desc}`}
                          className="flex flex-col items-center text-center p-4 rounded-3xl bg-white shadow-lg border-2 border-white/60 gap-2"
                        >
                          <span className="text-4xl" aria-hidden="true">{p.emoji}</span>
                          <span className="font-black text-[#E8215D] text-sm leading-tight">{p.label}</span>
                          <span className="text-gray-500 text-[11px] leading-tight">{p.desc}</span>
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-white/50 text-xs text-center mt-4">Tap the one that fits you — M-TETO will adjust instantly! 🔥</p>
                    <button
                      onClick={() => setShowDisabilityProfiles(false)}
                      className="mt-3 text-white/50 text-xs underline underline-offset-2"
                    >
                      ← Go back
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </ScreenShell>
          )}

          {/* ── TUTORIAL: SEARCH / HOME ────────────────────────────── */}
          {screen === "tut-search" && (
            <TutorialScreen talking={talking}
              grade={grade}
              teto={`${name.trim() || "Friend"}, this is the M-TETO home screen! 🔍 You can search for anything here — what SRGBV means, your rights, how to get help. Just type and I'll find it!`}
              onNext={next}
              onBack={back}
            >
              <PhoneMockup>
                <div className="bg-gradient-to-b from-[#E8215D] to-[#C01040] px-3 pt-3 pb-5">
                  <div className="flex items-center gap-1 mb-3">
                    <div className="w-5 h-5 rounded-full bg-white/30" />
                    <span className="text-white font-black text-xs">M-TETO</span>
                    <div className="ml-auto w-5 h-5 rounded-full bg-white/20" />
                  </div>
                  <div className="bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2 border border-white/20">
                    <Search size={10} className="text-white/60" />
                    <span className="text-white/50 text-[9px]">Search for help...</span>
                  </div>
                </div>
                <div className="bg-white px-3 py-2 flex-1">
                  <p className="text-[8px] text-gray-400 mb-2 font-bold">POPULAR SEARCHES</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {["What is SRGBV?", "My rights", "Report abuse", "J88 form"].map((t) => (
                      <span key={t} className="bg-pink-50 text-pink-700 text-[7px] px-2 py-0.5 rounded-full border border-pink-200">{t}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 border-t pt-2 gap-1">
                    {["🏠 Home", "🗂 Help", "🛡 Track", "📚 Learn"].map((t) => (
                      <div key={t} className="text-center text-[7px] text-gray-400">{t}</div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </TutorialScreen>
          )}

          {/* ── TUTORIAL: FIND HELP ────────────────────────────────── */}
          {screen === "tut-help" && (
            <TutorialScreen talking={talking}
              grade={grade}
              teto="This is the Helpers section 👥 You can find Police Stations, Hospitals, Thuthuzela Care Centres and NGOs near you. Each helper has a safety rating — red means watch out!"
              onNext={next}
              onBack={back}
            >
              <PhoneMockup>
                <div className="bg-gradient-to-b from-[#E8215D] to-[#C01040] px-3 pt-3 pb-4">
                  <span className="text-white font-black text-xs">Find Helpers</span>
                  <div className="bg-white/15 rounded-xl px-3 py-2 mt-2 flex items-center gap-2">
                    <Search size={9} className="text-white/60" />
                    <span className="text-white/50 text-[9px]">Search by name or area...</span>
                  </div>
                </div>
                <div className="bg-white px-3 py-2 flex-1 space-y-2">
                  {[
                    { name: "Soweto SAPS", type: "Police", rating: 8.2, color: "blue" },
                    { name: "Charlotte Maxeke", type: "Hospital", rating: 9.1, color: "green" },
                    { name: "Tshwane TCC", type: "TCC", rating: 7.4, color: "orange" },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <div className={`w-6 h-6 rounded-lg bg-${p.color}-100 flex items-center justify-center`}>
                        <Users size={10} className={`text-${p.color}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[8px] font-bold text-gray-800 truncate">{p.name}</div>
                        <div className="text-[7px] text-gray-400">{p.type}</div>
                      </div>
                      <span className={`text-[8px] font-bold ${p.rating >= 8 ? "text-green-600" : "text-orange-500"}`}>
                        ⭐ {p.rating}
                      </span>
                    </div>
                  ))}
                </div>
              </PhoneMockup>
            </TutorialScreen>
          )}

          {/* ── TUTORIAL: CASE TRACKER ────────────────────────────── */}
          {screen === "tut-track" && (
            <TutorialScreen talking={talking}
              grade={grade}
              teto="The Case Tracker 🛡 shows you exactly where your case is in the justice system — like tracking a parcel! It shows who has your file and if anything is delayed or overdue."
              onNext={next}
              onBack={back}
            >
              <PhoneMockup>
                <div className="bg-gradient-to-b from-[#E8215D] to-[#C01040] px-3 pt-3 pb-4">
                  <span className="text-white font-black text-xs">My Case</span>
                  <div className="mt-2 bg-blue-50 rounded-lg p-2">
                    <div className="text-[8px] font-bold text-blue-800">FILE IS WITH:</div>
                    <div className="text-[9px] font-black text-blue-900">Sgt. Maria Ferreira</div>
                    <div className="text-[7px] text-blue-600">Investigating Officer</div>
                  </div>
                </div>
                <div className="bg-white px-3 py-2 flex-1">
                  <div className="flex gap-1 mb-2">
                    <div className="flex-1 bg-[#E8215D] h-1.5 rounded-full" />
                    <div className="flex-1 bg-gray-200 h-1.5 rounded-full" />
                  </div>
                  <p className="text-[7px] text-gray-400 mb-2">9 of 15 steps complete</p>
                  {[
                    { step: "Case Opened", done: true },
                    { step: "Investigation", done: true },
                    { step: "Prosecution ⚠️ Late", done: false },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-1.5 py-1">
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${s.done ? "bg-green-500" : "bg-amber-400"}`}>
                        {s.done && <Check size={6} className="text-white" />}
                      </div>
                      <span className={`text-[8px] ${s.done ? "text-gray-500 line-through" : "text-gray-800 font-bold"}`}>{s.step}</span>
                    </div>
                  ))}
                </div>
              </PhoneMockup>
            </TutorialScreen>
          )}

          {/* ── TUTORIAL: LEARN ───────────────────────────────────── */}
          {screen === "tut-learn" && (
            <TutorialScreen talking={talking}
              grade={grade}
              teto="The Learn section 📚 and M-TETO University have articles, videos and books about your rights, SA law, and how to stay safe — all explained in a way that makes sense for your age!"
              onNext={next}
              onBack={back}
            >
              <PhoneMockup>
                <div className="bg-gradient-to-b from-[#E8215D] to-[#C01040] px-3 pt-3 pb-4">
                  <span className="text-white font-black text-xs">Learn + University</span>
                </div>
                <div className="bg-white px-3 py-2 flex-1">
                  <div className="flex gap-1 mb-2">
                    {["All", "Rights", "Law", "Safety"].map((t, i) => (
                      <span key={t} className={`text-[7px] px-2 py-0.5 rounded-full ${i === 0 ? "bg-[#E8215D] text-white" : "bg-gray-100 text-gray-500"}`}>{t}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { icon: "📋", title: "What is a J88?", type: "Article" },
                      { icon: "🎥", title: "Your Rights", type: "Video" },
                      { icon: "📖", title: "Protection Orders", type: "Book" },
                      { icon: "🎧", title: "Children's Act", type: "Audio" },
                    ].map((c) => (
                      <div key={c.title} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                        <div className="text-lg mb-1">{c.icon}</div>
                        <div className="text-[8px] font-bold text-gray-800 leading-tight">{c.title}</div>
                        <div className="text-[6px] text-gray-400 mt-0.5">{c.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </TutorialScreen>
          )}

          {/* ── TUTORIAL: THE SQUARE ──────────────────────────────── */}
          {screen === "tut-square" && (
            <TutorialScreen talking={talking}
              grade={grade}
              teto="The Square 🛍 is where you spend your TETO Coins! You earn coins by using M-TETO — and you can trade them for cool things like hygiene kits, data bundles, and learning resources!"
              onNext={next}
              onBack={back}
              nextLabel="Let's test what you know! →"
            >
              <PhoneMockup>
                <div className="bg-gradient-to-b from-[#E8215D] to-[#C01040] px-3 pt-3 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-black text-xs">The Square</span>
                    <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                      <Coins size={8} className="text-yellow-300" />
                      <span className="text-white text-[8px] font-black">150</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white px-3 py-2 flex-1">
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { icon: "🧴", name: "Hygiene Kit", pts: 80, cat: "Hygiene" },
                      { icon: "📱", name: "1GB Data", pts: 200, cat: "Digital" },
                      { icon: "📚", name: "Study Pack", pts: 60, cat: "Education" },
                      { icon: "🩺", name: "Health Info", pts: 30, cat: "Health" },
                    ].map((item) => (
                      <div key={item.name} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                        <div className="text-xl mb-1">{item.icon}</div>
                        <div className="text-[8px] font-bold text-gray-800 leading-tight">{item.name}</div>
                        <div className="flex items-center gap-0.5 mt-1">
                          <Coins size={7} className="text-yellow-500" />
                          <span className="text-[7px] text-yellow-600 font-bold">{item.pts} coins</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </TutorialScreen>
          )}

          {/* ── QUIZ ──────────────────────────────────────────────── */}
          {screen === "quiz" && (
            <ScreenShell grade={grade} talking={talking}>
              <TetoSpeech grade={grade}>
                Last step before we begin! 🧠 Answer 6 knowledge questions to earn your first coins. Don't worry — I'll explain every answer!
              </TetoSpeech>

              <div className="mt-5 w-full max-w-sm">
                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-5">
                  {QUIZ.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i < quizIdx ? "bg-green-400" : i === quizIdx ? "bg-white" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>

                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur border border-white/20">
                  <p className="text-[10px] text-white/60 mb-2 font-bold uppercase tracking-wide">
                    Question {quizIdx + 1} of {QUIZ.length}
                  </p>
                  <p className="text-white font-black text-sm leading-snug mb-4">
                    {QUIZ[quizIdx].q}
                  </p>

                  <div className="space-y-2">
                    {QUIZ[quizIdx].options.map((opt, oi) => {
                      const answered = quizAnswers[quizIdx] !== null;
                      const isCorrect = oi === QUIZ[quizIdx].correct;
                      const isChosen = quizAnswers[quizIdx] === oi;
                      return (
                        <button
                          key={oi}
                          disabled={answered}
                          onClick={() => handleQuizAnswer(oi)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            !answered
                              ? "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                              : isCorrect
                              ? "bg-green-500 text-white border-2 border-green-300"
                              : isChosen
                              ? "bg-red-500 text-white border-2 border-red-300"
                              : "bg-white/10 text-white/40 border border-white/10"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {showExplain && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 bg-white/20 rounded-xl p-3 text-white/90 text-xs leading-relaxed border border-white/20"
                    >
                      💡 {QUIZ[quizIdx].explain}
                    </motion.div>
                  )}
                </div>

                {showExplain && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={nextQuiz}
                    className="w-full mt-4 py-4 rounded-2xl bg-white text-[#E8215D] font-black text-base flex items-center justify-center gap-2"
                  >
                    {quizIdx < QUIZ.length - 1 ? "Next Question" : "See My Results!"} <ChevronRight size={20} />
                  </motion.button>
                )}
              </div>
            </ScreenShell>
          )}

          {/* ── CELEBRATE ──────────────────────────────────────────── */}
          {screen === "celebrate" && (
            <ScreenShell grade={grade} talking={talking}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                className="flex flex-col items-center"
              >
                <TetoAvatar grade={grade || "grade_3_5"} size={130} animated />
              </motion.div>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 text-center"
              >
                <h2 className="text-4xl font-black text-white" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                  Amazing! 🎉
                </h2>
                <p className="text-white/80 mt-2 text-base">
                  You scored <strong className="text-white">{correct} out of {QUIZ.length}</strong> in the quiz!
                </p>
              </motion.div>

              {/* Coins earned */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                className="mt-6 bg-white/15 rounded-3xl p-6 text-center border border-white/30 w-full max-w-sm"
              >
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: -30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    >
                      <Coins size={28} className="text-yellow-300 mx-0.5" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-yellow-200 text-5xl font-black">50</p>
                <p className="text-white font-bold text-lg mt-1">TETO Coins Earned! 🪙</p>
                <p className="text-white/60 text-xs mt-2">Spend them at The Square for rewards</p>
              </motion.div>

              <div className="mt-6 w-full max-w-sm space-y-3">
                <p className="text-white/70 text-sm text-center">
                  {name.trim() ? `Welcome to M-TETO, ${name.trim()}!` : "Welcome to M-TETO!"} I'll always be here to help. 🐥
                </p>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  onClick={handleFinish}
                  className="w-full py-5 rounded-2xl bg-white text-[#E8215D] font-black text-xl shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  Enter M-TETO! <ChevronRight size={24} />
                </motion.button>
              </div>
            </ScreenShell>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Floating star decorations */}
      {screen !== "splash" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {["✦", "★", "✦", "⭐", "★"].map((s, i) => (
            <div
              key={i}
              className="absolute text-white/10 animate-pulse"
              style={{
                top: `${10 + i * 18}%`,
                left: i % 2 === 0 ? `${2 + i}%` : `${88 - i * 2}%`,
                fontSize: `${12 + i * 3}px`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ScreenShell({ children, grade, talking, onBack }: { children: React.ReactNode; grade: string; talking?: boolean; onBack?: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-start px-6 pt-6 pb-8 bg-gradient-to-b from-[#E8215D] to-[#C01040] overflow-y-auto relative">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Go back"
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
      )}
      <div className="w-full max-w-sm flex flex-col items-center">
        <TetoAvatar grade={grade || "grade_3_5"} size={90} animated talking={talking} />
        {children}
      </div>
    </div>
  );
}

function TetoSpeech({ children, grade }: { children: React.ReactNode; grade: string }) {
  return (
    <div className="mt-4 relative">
      <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-md text-gray-800 text-sm leading-relaxed font-semibold">
        {children}
      </div>
      <div
        className="absolute -top-2 left-0 w-3 h-3 bg-white"
        style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
      />
    </div>
  );
}

interface TutorialScreenProps {
  grade: string;
  teto: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
  talking?: boolean;
}

function TutorialScreen({ grade, teto, children, onNext, onBack, nextLabel, talking }: TutorialScreenProps) {
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-[#E8215D] to-[#C01040] overflow-hidden">
      {/* Top: TETO + speech bubble */}
      <div className="flex items-start gap-3 px-5 pt-8 pb-4">
        <TetoAvatar grade={grade || "grade_3_5"} size={68} animated talking={talking} />
        <div className="flex-1 relative">
          <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-md text-gray-800 text-xs leading-relaxed font-semibold">
            {teto}
          </div>
          <div className="absolute -top-2 left-0 w-3 h-3 bg-white" style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }} />
        </div>
      </div>

      {/* Phone mockup */}
      <div className="flex-1 flex items-center justify-center px-4 py-2">
        {children}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 px-5 pb-8 pt-3">
        <button
          onClick={onBack}
          className="w-12 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={onNext}
          className="flex-1 h-14 rounded-2xl bg-white text-[#E8215D] font-black text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          {nextLabel ?? "Next"} <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto overflow-hidden shadow-2xl flex flex-col"
      style={{
        width: 160,
        height: 260,
        background: "#fff",
        borderRadius: 18,
        border: "3px solid rgba(255,255,255,0.4)",
      }}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-2 bg-gray-900 rounded-b-lg z-10" />
      <div className="mt-2 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      {/* Home indicator */}
      <div className="pb-1 flex justify-center">
        <div className="w-8 h-0.5 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}
