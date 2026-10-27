import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable, providersTable, squareItemsTable } from "@workspace/db";
import { ilike, or, and, eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const GRADE_LABELS: Record<string, string> = {
  grade_1_2: "ages 5–8 (Grades 1–2)",
  grade_3_5: "ages 8–12 (Grades 3–5)",
  grade_6_7: "ages 12–14 (Grades 6–7)",
  grade_8_12: "ages 14–19 (Grades 8–12)",
  all: "all school ages",
};

function buildSystemPrompt(gradeLevel?: string | null): string {
  const ageDesc = gradeLevel && GRADE_LABELS[gradeLevel]
    ? GRADE_LABELS[gradeLevel]
    : "school-age children";

  return `You are M-TETO, a friendly, safe, and empowering AI assistant for ${ageDesc} in South Africa.
Your purpose is to help children and youth understand their rights, stay safe, and access support.

Rules you must follow at all times:
1. ONLY answer questions related to: children's rights, human rights, gender-based violence (SRGBV), school safety, health & wellbeing, legal rights, how to get help, or how to stay safe.
2. If a question is not related to these topics, kindly redirect: "That's a bit outside what I know! Try asking me about your rights, how to stay safe, or where to find help. 💙"
3. Use simple, friendly, encouraging language appropriate for ${ageDesc}.
4. Never use graphic descriptions of violence. Use age-appropriate, empowering language.
5. Always end with a supportive or empowering message.
6. If someone seems to be in danger, always mention: "If you are in danger right now, please call 10111 (police) or 116 (Childline) immediately."
7. Keep answers concise — under 200 words. Use bullet points where helpful.
8. Include 1–2 relevant emojis to keep it friendly and youthful.
9. Speak in first person as M-TETO: "I can help you with..."`;
}

router.post("/", async (req, res) => {
  try {
    const { query, gradeLevel } = req.body as {
      query?: string;
      gradeLevel?: string | null;
    };

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "Query is required" });
    }

    const q = query.trim().toLowerCase();

    // Parallel: AI response + DB search
    const [aiCompletion, articles, providers, squareItems] = await Promise.all([
      // AI Answer
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 600,
        messages: [
          { role: "system", content: buildSystemPrompt(gradeLevel) },
          { role: "user", content: query },
        ],
      }).catch(() => null),

      // Articles search
      db
        .select()
        .from(articlesTable)
        .where(
          or(
            ilike(articlesTable.title, `%${q}%`),
            ilike(articlesTable.summary, `%${q}%`),
            ilike(articlesTable.content, `%${q}%`),
            ilike(articlesTable.category, `%${q}%`)
          )
        )
        .limit(5),

      // Providers search
      db
        .select()
        .from(providersTable)
        .where(
          or(
            ilike(providersTable.name, `%${q}%`),
            ilike(providersTable.suburb, `%${q}%`),
            ilike(providersTable.province, `%${q}%`),
            ilike(providersTable.type, `%${q}%`)
          )
        )
        .limit(5),

      // Square items search
      db
        .select()
        .from(squareItemsTable)
        .where(
          or(
            ilike(squareItemsTable.name, `%${q}%`),
            ilike(squareItemsTable.description, `%${q}%`),
            ilike(squareItemsTable.category, `%${q}%`)
          )
        )
        .limit(4),
    ]);

    const aiAnswer =
      aiCompletion?.choices?.[0]?.message?.content ??
      "I'm here to help! Ask me about your rights, how to stay safe, or where to find support in South Africa. 💙";

    const safeDate = (d: Date | null | undefined) =>
      d instanceof Date ? d.toISOString() : new Date().toISOString();

    return res.json({
      aiAnswer,
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        category: a.category,
        moduleType: a.moduleType,
        gradeLevel: a.gradeLevel,
        pointsReward: a.pointsReward,
        content: a.content,
        createdAt: safeDate(a.createdAt),
        updatedAt: safeDate(a.updatedAt),
      })),
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        address: p.address,
        suburb: p.suburb,
        province: p.province,
        phone: p.phone,
        email: p.email,
        website: p.website,
        isProBono: p.isProBono,
        avgRating: p.avgRating,
        reviewCount: p.reviewCount,
        createdAt: safeDate(p.createdAt),
        updatedAt: safeDate(p.updatedAt),
      })),
      squareItems: squareItems.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        pointsCost: s.pointsCost,
        emoji: s.emoji,
        inStock: s.inStock,
        createdAt: safeDate(s.createdAt),
        updatedAt: safeDate(s.updatedAt),
      })),
    });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
});

export default router;
