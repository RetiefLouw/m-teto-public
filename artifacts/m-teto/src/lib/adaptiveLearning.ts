/**
 * adaptiveLearning.ts
 * Tracks per-user knowledge gaps and progress.
 * Everything stored in localStorage only — no PII.
 */

const GAPS_KEY = "mteto_knowledge_gaps";
const PROGRESS_KEY = "mteto_topics_explored";
const SCORE_HISTORY_KEY = "mteto_score_history";

export interface KnowledgeGap {
  topic: string;
  label: string;
  articleCategory: string;
  missedAt: number;
}

export interface TopicProgress {
  topic: string;
  label: string;
  exploredAt: number;
}

export interface ScoreRecord {
  score: number;
  recordedAt: number;
}

// Maps knowledge question IDs to human-readable topics + article categories
export const QUESTION_TOPIC_MAP: Record<string, { label: string; articleCategory: string }> = {
  k_1_1: { label: "Who to tell when you feel unsafe", articleCategory: "Your Rights" },
  k_1_2: { label: "Bodily autonomy & consent", articleCategory: "Your Rights" },
  k_1_3: { label: "Safe vs. unsafe secrets", articleCategory: "Your Rights" },
  k_3_1: { label: "What SRGBV means", articleCategory: "SRGBV" },
  k_3_2: { label: "Reporting abuse at school", articleCategory: "Process Guides" },
  k_3_3: { label: "Your rights as a learner", articleCategory: "Your Rights" },
  k_6_1: { label: "Consent & boundaries", articleCategory: "Your Rights" },
  k_6_2: { label: "How to report abuse", articleCategory: "Process Guides" },
  k_6_3: { label: "What a protection order is", articleCategory: "Legal Terms" },
  k_6_4: { label: "LGBTQIA+ rights in South Africa", articleCategory: "Your Rights" },
  k_8_1: { label: "J88 form & medical evidence", articleCategory: "Legal Terms" },
  k_8_2: { label: "CAS number & police reporting", articleCategory: "Process Guides" },
  k_8_3: { label: "Applying for a protection order", articleCategory: "Process Guides" },
  k_8_4: { label: "Criminal vs. civil court proceedings", articleCategory: "Legal Terms" },
  k_8_5: { label: "Thuthuzela Care Centre services", articleCategory: "Process Guides" },
};

// ─── Getters ──────────────────────────────────────────────────────────────────

export function getKnowledgeGaps(): KnowledgeGap[] {
  try {
    const raw = localStorage.getItem(GAPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getTopicsExplored(): TopicProgress[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getScoreHistory(): ScoreRecord[] {
  try {
    const raw = localStorage.getItem(SCORE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Setters ──────────────────────────────────────────────────────────────────

/** Called after assessment: stores which question IDs were answered incorrectly */
export function storeKnowledgeGaps(wrongQuestionIds: string[]): void {
  const existing = getKnowledgeGaps();
  const existingTopics = new Set(existing.map((g) => g.topic));

  const newGaps: KnowledgeGap[] = wrongQuestionIds
    .filter((id) => QUESTION_TOPIC_MAP[id] && !existingTopics.has(id))
    .map((id) => ({
      topic: id,
      label: QUESTION_TOPIC_MAP[id].label,
      articleCategory: QUESTION_TOPIC_MAP[id].articleCategory,
      missedAt: Date.now(),
    }));

  const merged = [...existing, ...newGaps];
  localStorage.setItem(GAPS_KEY, JSON.stringify(merged));
}

/** Called after assessment: stores the initial score */
export function storeKnowledgeScore(score: number): void {
  const history = getScoreHistory();
  history.push({ score, recordedAt: Date.now() });
  localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(history));
}

/** Called when user reads an article or completes quiz — marks gap as resolved */
export function resolveKnowledgeGap(articleCategory: string): void {
  const gaps = getKnowledgeGaps();
  const remaining = gaps.filter((g) => g.articleCategory !== articleCategory);
  localStorage.setItem(GAPS_KEY, JSON.stringify(remaining));
}

/** Called when user reads/explores a topic */
export function markTopicExplored(topic: string, label: string): void {
  const existing = getTopicsExplored();
  const alreadyThere = existing.some((t) => t.topic === topic);
  if (!alreadyThere) {
    existing.push({ topic, label, exploredAt: Date.now() });
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(existing));
  }
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** Returns the categories of articles to recommend based on current gaps */
export function getRecommendedCategories(): string[] {
  const gaps = getKnowledgeGaps();
  const unique = [...new Set(gaps.map((g) => g.articleCategory))];
  return unique;
}

/** Returns gap topic labels as a short summary string for TETO's system prompt */
export function getGapSummaryForTeto(): string {
  const gaps = getKnowledgeGaps();
  if (!gaps.length) return "";
  const labels = gaps.map((g) => g.label).slice(0, 5);
  return `The user has knowledge gaps in: ${labels.join("; ")}. Where relevant, proactively help them understand these topics.`;
}

/** Returns explored topics as a comma-separated string */
export function getTopicsSummaryForTeto(): string {
  const topics = getTopicsExplored();
  if (!topics.length) return "";
  const labels = topics.map((t) => t.label).slice(0, 8);
  return `Topics this user has already explored: ${labels.join(", ")}.`;
}

/** Full snapshot for admin tracking — sent via trackEvent */
export function getProgressSnapshot() {
  const gaps = getKnowledgeGaps();
  const explored = getTopicsExplored();
  const history = getScoreHistory();
  const latestScore = history.length ? history[history.length - 1].score : null;
  const firstScore = history.length ? history[0].score : null;
  return {
    gapCount: gaps.length,
    gapTopics: gaps.map((g) => g.label),
    exploredTopics: explored.map((t) => t.label),
    latestScore,
    firstScore,
    improvement: latestScore !== null && firstScore !== null ? latestScore - firstScore : null,
  };
}
