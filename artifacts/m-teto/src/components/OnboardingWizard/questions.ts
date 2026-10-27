export type GradeLevel = "grade_1_2" | "grade_3_5" | "grade_6_7" | "grade_8_12";

export interface QuestionOption {
  value: string;
  label: string;
  emoji?: string;
  isCorrect?: boolean;
  riskWeight?: number;
}

export type QuestionType = "choice" | "text" | "school_search";

export interface Question {
  id: string;
  type?: QuestionType;
  section: "demographics" | "knowledge" | "safety";
  grades: GradeLevel[];
  text: string;
  subtext?: string;
  placeholder?: string;
  isOptional?: boolean;
  isPrivate?: boolean;
  isRiskFlag?: boolean;
  options: QuestionOption[];
  followUpIf?: { questionId: string; values: string[] };
}

// ─── PROVINCES ────────────────────────────────────────────────────────────────

const PROVINCES: QuestionOption[] = [
  { value: "eastern_cape", label: "Eastern Cape" },
  { value: "free_state", label: "Free State" },
  { value: "gauteng", label: "Gauteng" },
  { value: "kwazulu_natal", label: "KwaZulu-Natal" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "northern_cape", label: "Northern Cape" },
  { value: "north_west", label: "North West" },
  { value: "western_cape", label: "Western Cape" },
];

export const ALL_QUESTIONS: Question[] = [
  // ── Demographics ──────────────────────────────────────────────────────────

  {
    id: "d_province",
    section: "demographics",
    grades: ["grade_1_2", "grade_3_5", "grade_6_7", "grade_8_12"],
    text: "Which province do you live in?",
    options: PROVINCES,
  },
  {
    id: "d_area",
    section: "demographics",
    grades: ["grade_1_2", "grade_3_5", "grade_6_7", "grade_8_12"],
    text: "What kind of area do you live in?",
    options: [
      { value: "city", label: "City", emoji: "🏙️" },
      { value: "town", label: "Town", emoji: "🏘️" },
      { value: "township", label: "Township / Kasi", emoji: "🏠" },
      { value: "rural", label: "Rural / Farm", emoji: "🌾" },
    ],
  },
  {
    id: "d_gender",
    section: "demographics",
    grades: ["grade_1_2", "grade_3_5", "grade_6_7", "grade_8_12"],
    text: "Are you a girl or a boy?",
    options: [
      { value: "girl", label: "Girl", emoji: "👧" },
      { value: "boy", label: "Boy", emoji: "👦" },
    ],
  },
  {
    id: "d_race",
    section: "demographics",
    grades: ["grade_3_5", "grade_6_7", "grade_8_12"],
    text: "Which racial group do you identify with?",
    subtext: "This helps us understand who M-TETO is serving.",
    options: [
      { value: "black_african", label: "Black African" },
      { value: "coloured", label: "Coloured" },
      { value: "indian_asian", label: "Indian / Asian" },
      { value: "white", label: "White" },
      { value: "other", label: "Other" },
      { value: "prefer_not", label: "Prefer not to say" },
    ],
  },
  {
    id: "d_school_type",
    section: "demographics",
    grades: ["grade_3_5", "grade_6_7", "grade_8_12"],
    text: "What kind of school do you go to?",
    options: [
      { value: "government", label: "Government / Public school" },
      { value: "model_c", label: "Former Model C school" },
      { value: "private", label: "Private school" },
      { value: "homeschool", label: "Homeschool" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "d_school",
    type: "school_search",
    section: "demographics",
    grades: ["grade_1_2", "grade_3_5", "grade_6_7", "grade_8_12"],
    text: "Which school do you go to?",
    subtext: "Search by school name or area. Only Gauteng schools listed.",
    isOptional: true,
    placeholder: "Type school name or area…",
    options: [],
  },
  {
    id: "d_grade",
    section: "demographics",
    grades: ["grade_1_2", "grade_3_5", "grade_6_7", "grade_8_12"],
    text: "What grade are you in?",
    options: [
      { value: "gr1", label: "Grade 1", emoji: "1️⃣" },
      { value: "gr2", label: "Grade 2", emoji: "2️⃣" },
      { value: "gr3", label: "Grade 3", emoji: "3️⃣" },
      { value: "gr4", label: "Grade 4", emoji: "4️⃣" },
      { value: "gr5", label: "Grade 5", emoji: "5️⃣" },
      { value: "gr6", label: "Grade 6", emoji: "6️⃣" },
      { value: "gr7", label: "Grade 7", emoji: "7️⃣" },
      { value: "gr8", label: "Grade 8", emoji: "8️⃣" },
      { value: "gr9", label: "Grade 9", emoji: "9️⃣" },
      { value: "gr10", label: "Grade 10", emoji: "🔟" },
      { value: "gr11", label: "Grade 11", emoji: "⭐" },
      { value: "gr12", label: "Grade 12 (Matric)", emoji: "🎓" },
    ],
  },
  {
    id: "d_disability_yn",
    section: "demographics",
    grades: ["grade_1_2", "grade_3_5", "grade_6_7", "grade_8_12"],
    text: "Do you have a disability or special need?",
    subtext: "This helps M-TETO make sure everyone gets the right support. You do not have to answer.",
    isOptional: true,
    options: [
      { value: "yes", label: "Yes, I do", emoji: "🌟" },
      { value: "no", label: "No", emoji: "✅" },
      { value: "prefer_not", label: "I'd prefer not to say", emoji: "🔒" },
    ],
  },
  {
    id: "d_disability_type",
    type: "text",
    section: "demographics",
    grades: ["grade_1_2", "grade_3_5", "grade_6_7", "grade_8_12"],
    text: "You can tell us more about your disability (optional)",
    subtext: "For example: vision impairment, hearing loss, physical disability, learning difficulty. You can skip this if you prefer.",
    placeholder: "Describe your disability or special need…",
    isOptional: true,
    options: [],
    followUpIf: { questionId: "d_disability_yn", values: ["yes"] },
  },

  // ── Knowledge — Grade 1–2 ────────────────────────────────────────────────

  {
    id: "k_1_1",
    section: "knowledge",
    grades: ["grade_1_2"],
    text: "If someone at school makes you feel scared, who should you tell?",
    options: [
      { value: "teacher", label: "My teacher or a grown-up", emoji: "👩‍🏫", isCorrect: true },
      { value: "friend", label: "A friend", emoji: "👫" },
      { value: "nobody", label: "Nobody", emoji: "🙅" },
      { value: "dont_know", label: "I don't know", emoji: "🤔" },
    ],
  },
  {
    id: "k_1_2",
    section: "knowledge",
    grades: ["grade_1_2"],
    text: "Is it okay for someone to touch your body without asking you first?",
    options: [
      { value: "yes", label: "Yes, it's okay", emoji: "👍" },
      { value: "no", label: "No, never!", emoji: "✋", isCorrect: true },
      { value: "sometimes", label: "Sometimes", emoji: "🤷" },
    ],
  },
  {
    id: "k_1_3",
    section: "knowledge",
    grades: ["grade_1_2"],
    text: "Should you always tell a grown-up if someone hurts you?",
    options: [
      { value: "yes", label: "Yes, always!", emoji: "✅", isCorrect: true },
      { value: "sometimes", label: "Maybe sometimes", emoji: "🤔" },
      { value: "no", label: "No, keep it secret", emoji: "🤐" },
    ],
  },

  // ── Knowledge — Grade 3–5 ────────────────────────────────────────────────

  {
    id: "k_3_1",
    section: "knowledge",
    grades: ["grade_3_5"],
    text: "If someone touches you without your permission, what should you do?",
    options: [
      { value: "tell_adult", label: "Tell a trusted adult", emoji: "👨‍👩‍👧", isCorrect: true },
      { value: "stay_quiet", label: "Stay quiet", emoji: "🤫" },
      { value: "not_sure", label: "I'm not sure", emoji: "🤔" },
      { value: "tell_friend", label: "Just tell a friend", emoji: "👫" },
    ],
  },
  {
    id: "k_3_2",
    section: "knowledge",
    grades: ["grade_3_5"],
    text: "Do you know your rights as a learner at school?",
    options: [
      { value: "yes_all", label: "Yes, I know most of them", emoji: "📖", isCorrect: true },
      { value: "some", label: "I know some", emoji: "🤏" },
      { value: "no", label: "Not really", emoji: "😐" },
    ],
  },
  {
    id: "k_3_3",
    section: "knowledge",
    grades: ["grade_3_5"],
    text: "Do you know who to call if you need help? (Hint: it's free!)",
    subtext: "Childline South Africa: 116",
    options: [
      { value: "yes", label: "Yes! I know Childline (116)", emoji: "📞", isCorrect: true },
      { value: "heard", label: "I've heard of it", emoji: "👂" },
      { value: "no", label: "No, I didn't know", emoji: "❓" },
    ],
  },
  {
    id: "k_3_4",
    section: "knowledge",
    grades: ["grade_3_5"],
    text: "Is it bullying if someone says mean things to you because of how you look or who you are?",
    options: [
      { value: "yes", label: "Yes, that's bullying", emoji: "✅", isCorrect: true },
      { value: "sometimes", label: "Only sometimes", emoji: "🤷" },
      { value: "no", label: "No, it's just teasing", emoji: "❌" },
      { value: "not_sure", label: "I'm not sure", emoji: "🤔" },
    ],
  },

  // ── Knowledge — Grade 6–7 ────────────────────────────────────────────────

  {
    id: "k_6_1",
    section: "knowledge",
    grades: ["grade_6_7"],
    text: "What does 'consent' mean?",
    options: [
      { value: "asking", label: "Asking permission before doing something", emoji: "✅", isCorrect: true },
      { value: "forced", label: "Being told to do something", emoji: "❌" },
      { value: "agreement", label: "Doing what everyone else does", emoji: "🤷" },
      { value: "not_sure", label: "I'm not sure", emoji: "🤔" },
    ],
  },
  {
    id: "k_6_2",
    section: "knowledge",
    grades: ["grade_6_7"],
    text: "What is the legal age of consent to sex in South Africa?",
    options: [
      { value: "14", label: "14 years old" },
      { value: "16", label: "16 years old", isCorrect: true },
      { value: "18", label: "18 years old" },
      { value: "not_sure", label: "I'm not sure" },
    ],
  },
  {
    id: "k_6_3",
    section: "knowledge",
    grades: ["grade_6_7"],
    text: "SRGBV stands for:",
    options: [
      { value: "correct", label: "School-Related Gender-Based Violence", isCorrect: true },
      { value: "wrong1", label: "Social Rights & General Bullying Values" },
      { value: "wrong2", label: "Something about rights and violence" },
      { value: "not_sure", label: "I don't know" },
    ],
  },
  {
    id: "k_6_4",
    section: "knowledge",
    grades: ["grade_6_7"],
    text: "If you experience SRGBV, do you know who to report it to?",
    options: [
      { value: "yes", label: "Yes, I know the steps", emoji: "✅", isCorrect: true },
      { value: "some", label: "I have some idea", emoji: "🤏" },
      { value: "no", label: "No, I don't know", emoji: "❓" },
    ],
  },

  // ── Knowledge — Grade 8–12 ───────────────────────────────────────────────

  {
    id: "k_8_1",
    section: "knowledge",
    grades: ["grade_8_12"],
    text: "What is the legal age of sexual consent in South Africa?",
    options: [
      { value: "14", label: "14" },
      { value: "16", label: "16", isCorrect: true },
      { value: "18", label: "18" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: "k_8_2",
    section: "knowledge",
    grades: ["grade_8_12"],
    text: "What is a J88 form used for?",
    options: [
      { value: "correct", label: "Documenting injuries from assault or rape", isCorrect: true },
      { value: "wrong1", label: "School registration" },
      { value: "wrong2", label: "A court appearance form" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: "k_8_3",
    section: "knowledge",
    grades: ["grade_8_12"],
    text: "Do you fully understand what consent means?",
    options: [
      { value: "yes", label: "Yes, fully", isCorrect: true },
      { value: "somewhat", label: "Somewhat" },
      { value: "no", label: "Not really" },
    ],
  },
  {
    id: "k_8_4",
    section: "knowledge",
    grades: ["grade_8_12"],
    text: "Do you know your rights if you experience sexual harassment at school?",
    options: [
      { value: "yes", label: "Yes, I know them", isCorrect: true },
      { value: "some", label: "Some of them" },
      { value: "no", label: "Not really" },
    ],
  },
  {
    id: "k_8_5",
    section: "knowledge",
    grades: ["grade_8_12"],
    text: "Which of these is an example of SRGBV?",
    options: [
      { value: "correct", label: "A teacher punishing a student physically", isCorrect: true },
      { value: "wrong1", label: "A student getting a bad mark" },
      { value: "wrong2", label: "Two friends having an argument" },
      { value: "not_sure", label: "I'm not sure" },
    ],
  },

  // ── Safety — Grade 1–2 ───────────────────────────────────────────────────

  {
    id: "s_1_1",
    section: "safety",
    grades: ["grade_1_2"],
    text: "How do you feel at school most days?",
    options: [
      { value: "happy", label: "Happy", emoji: "😊" },
      { value: "okay", label: "Okay", emoji: "😐" },
      { value: "worried", label: "Worried", emoji: "😟", riskWeight: 1 },
      { value: "scared", label: "Scared", emoji: "😢", riskWeight: 2 },
    ],
  },
  {
    id: "s_1_2",
    section: "safety",
    grades: ["grade_1_2"],
    text: "Has anyone at school made you feel scared or hurt?",
    options: [
      { value: "never", label: "No, never", emoji: "✅" },
      { value: "sometimes", label: "Sometimes", emoji: "🤔", riskWeight: 1 },
      { value: "a_lot", label: "A lot", emoji: "😢", riskWeight: 2 },
    ],
  },
  {
    id: "s_1_3",
    section: "safety",
    grades: ["grade_1_2"],
    isPrivate: true,
    isRiskFlag: true,
    text: "Has someone touched you in a way that made you feel sad or scared?",
    subtext: "Your answer is private. Only M-TETO can see this.",
    options: [
      { value: "no", label: "No", emoji: "✅" },
      { value: "yes_once", label: "Yes, once", emoji: "😢", riskWeight: 3 },
      { value: "yes_more", label: "Yes, more than once", emoji: "😢", riskWeight: 3 },
    ],
  },

  // ── Safety — Grade 3–5 ───────────────────────────────────────────────────

  {
    id: "s_3_1",
    section: "safety",
    grades: ["grade_3_5"],
    text: "How safe do you feel at school most of the time?",
    options: [
      { value: "very_safe", label: "Very safe", emoji: "🛡️" },
      { value: "usually_safe", label: "Usually safe", emoji: "🙂" },
      { value: "sometimes_unsafe", label: "Sometimes unsafe", emoji: "😟", riskWeight: 1 },
      { value: "often_unsafe", label: "Often unsafe", emoji: "😢", riskWeight: 2 },
    ],
  },
  {
    id: "s_3_2",
    section: "safety",
    grades: ["grade_3_5"],
    text: "Has anyone at school said hurtful things to you because of your gender, race, or how you look?",
    options: [
      { value: "never", label: "Never" },
      { value: "once", label: "Once or twice", riskWeight: 1 },
      { value: "several", label: "Several times", riskWeight: 2 },
      { value: "often", label: "Often", riskWeight: 2 },
    ],
  },
  {
    id: "s_3_3",
    section: "safety",
    grades: ["grade_3_5"],
    text: "Have you seen someone else being bullied or hurt at school?",
    options: [
      { value: "never", label: "Never" },
      { value: "once", label: "Yes, once", riskWeight: 1 },
      { value: "few_times", label: "Yes, a few times", riskWeight: 1 },
      { value: "regularly", label: "Yes, regularly", riskWeight: 2 },
    ],
  },
  {
    id: "s_3_4",
    section: "safety",
    grades: ["grade_3_5"],
    isPrivate: true,
    isRiskFlag: true,
    text: "Has anyone ever touched your body in a way you didn't want or asked them not to?",
    subtext: "This is private and safe to share. Only M-TETO can see this answer.",
    options: [
      { value: "no", label: "No" },
      { value: "yes_once", label: "Yes, once", riskWeight: 3 },
      { value: "yes_more", label: "Yes, more than once", riskWeight: 3 },
    ],
  },

  // ── Safety — Grade 6–7 ───────────────────────────────────────────────────

  {
    id: "s_6_1",
    section: "safety",
    grades: ["grade_6_7"],
    text: "How safe do you feel at school overall?",
    options: [
      { value: "1", label: "1 – Very unsafe", riskWeight: 3 },
      { value: "2", label: "2 – Mostly unsafe", riskWeight: 2 },
      { value: "3", label: "3 – Sometimes unsafe", riskWeight: 1 },
      { value: "4", label: "4 – Mostly safe" },
      { value: "5", label: "5 – Very safe" },
    ],
  },
  {
    id: "s_6_2",
    section: "safety",
    grades: ["grade_6_7"],
    text: "Have you experienced bullying or harassment at school?",
    options: [
      { value: "never", label: "Never" },
      { value: "once", label: "Once or twice", riskWeight: 1 },
      { value: "several", label: "Several times", riskWeight: 2 },
      { value: "often", label: "Often", riskWeight: 2 },
    ],
  },
  {
    id: "s_6_3",
    section: "safety",
    grades: ["grade_6_7"],
    text: "Has anyone made hurtful comments about your gender, sexuality, or race?",
    options: [
      { value: "never", label: "Never" },
      { value: "once", label: "Once or twice", riskWeight: 1 },
      { value: "several", label: "Several times", riskWeight: 2 },
      { value: "often", label: "Often", riskWeight: 2 },
    ],
  },
  {
    id: "s_6_4",
    section: "safety",
    grades: ["grade_6_7"],
    isPrivate: true,
    isRiskFlag: true,
    text: "Has anyone touched you sexually or physically without your permission?",
    subtext: "What you share here is private. Only M-TETO can see this — to help keep your area safe.",
    options: [
      { value: "no", label: "No, never" },
      { value: "yes_once", label: "Yes, once", riskWeight: 3 },
      { value: "yes_more", label: "Yes, more than once", riskWeight: 3 },
    ],
  },
  {
    id: "s_6_5",
    section: "safety",
    grades: ["grade_6_7"],
    isPrivate: true,
    text: "Have you ever told a trusted adult about something that hurt or scared you?",
    options: [
      { value: "yes_helped", label: "Yes, and they helped me" },
      { value: "yes_no_help", label: "Yes, but they didn't help", riskWeight: 2 },
      { value: "no", label: "No, I kept it to myself", riskWeight: 1 },
      { value: "nothing", label: "Nothing has happened to me" },
    ],
  },

  // ── Safety — Grade 8–12 ──────────────────────────────────────────────────

  {
    id: "s_8_1",
    section: "safety",
    grades: ["grade_8_12"],
    text: "How safe do you feel at school overall?",
    options: [
      { value: "1", label: "1 – Very unsafe", riskWeight: 3 },
      { value: "2", label: "2 – Mostly unsafe", riskWeight: 2 },
      { value: "3", label: "3 – Sometimes unsafe", riskWeight: 1 },
      { value: "4", label: "4 – Mostly safe" },
      { value: "5", label: "5 – Very safe" },
    ],
  },
  {
    id: "s_8_2",
    section: "safety",
    grades: ["grade_8_12"],
    text: "Have you experienced gender-based violence or sexual harassment?",
    options: [
      { value: "never", label: "Never" },
      { value: "once", label: "Once", riskWeight: 2 },
      { value: "more", label: "More than once", riskWeight: 3 },
    ],
  },
  {
    id: "s_8_3",
    section: "safety",
    grades: ["grade_8_12"],
    text: "Have you ever been in a relationship where you felt unsafe or controlled?",
    options: [
      { value: "no", label: "No" },
      { value: "yes_once", label: "Yes, once", riskWeight: 2 },
      { value: "yes_more", label: "Yes, more than once", riskWeight: 2 },
    ],
  },
  {
    id: "s_8_4",
    section: "safety",
    grades: ["grade_8_12"],
    isPrivate: true,
    isRiskFlag: true,
    text: "Have you experienced any form of sexual assault or rape?",
    subtext: "This is completely private. Only M-TETO can see this. Sharing helps us make your area safer — without ever identifying you.",
    options: [
      { value: "no", label: "No" },
      { value: "yes_help", label: "Yes, and I got help", riskWeight: 3 },
      { value: "yes_no_help", label: "Yes, but I didn't get help", riskWeight: 3 },
    ],
  },
  {
    id: "s_8_5",
    section: "safety",
    grades: ["grade_8_12"],
    text: "Have you ever felt pressured to do something sexual that you didn't want to do?",
    isPrivate: true,
    options: [
      { value: "no", label: "No" },
      { value: "yes_once", label: "Yes, once", riskWeight: 2 },
      { value: "yes_more", label: "Yes, more than once", riskWeight: 3 },
    ],
  },
  {
    id: "s_8_6",
    section: "safety",
    grades: ["grade_8_12"],
    text: "Have you witnessed someone experiencing SRGBV?",
    options: [
      { value: "never", label: "Never" },
      { value: "once", label: "Once", riskWeight: 1 },
      { value: "multiple", label: "Multiple times", riskWeight: 2 },
    ],
  },
];

export function getQuestionsForGrade(grade: GradeLevel): Question[] {
  return ALL_QUESTIONS.filter((q) => q.grades.includes(grade));
}

export function computeResults(
  grade: GradeLevel,
  responses: Record<string, string>
): { knowledgeScore: number; riskLevel: string; hasRiskFlags: boolean; riskFlags: string[] } {
  const questions = getQuestionsForGrade(grade);
  const knowledgeQs = questions.filter((q) => q.section === "knowledge");
  const safetyQs = questions.filter((q) => q.section === "safety");

  let correct = 0;
  for (const q of knowledgeQs) {
    const answer = responses[q.id];
    if (answer) {
      const opt = q.options.find((o) => o.value === answer);
      if (opt?.isCorrect) correct++;
    }
  }
  const knowledgeScore = knowledgeQs.length > 0 ? Math.round((correct / knowledgeQs.length) * 100) : 0;

  let maxRisk = 0;
  const riskFlags: string[] = [];

  for (const q of safetyQs) {
    const answer = responses[q.id];
    if (!answer) continue;
    const opt = q.options.find((o) => o.value === answer);
    if (!opt?.riskWeight) continue;

    if (opt.riskWeight > maxRisk) maxRisk = opt.riskWeight;
    if (q.isRiskFlag && opt.riskWeight >= 3) {
      riskFlags.push(q.id);
    }
  }

  const riskLevel =
    maxRisk >= 3 ? "high" : maxRisk === 2 ? "medium" : maxRisk === 1 ? "low" : "none";

  return { knowledgeScore, riskLevel, hasRiskFlags: riskFlags.length > 0, riskFlags };
}
