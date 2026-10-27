import { Router } from "express";
import { db } from "@workspace/db";
import { universitySavedContentTable, universityPremiumContentTable, universityPremiumRedemptionsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ─── Curated featured content (law & human rights, SA-focused) ───────────────
const FEATURED_CONTENT = [
  { id: "feat-1", title: "Constitution of South Africa — Plain Language Guide", contentType: "document", contentSource: "South African Government", contentUrl: "https://www.justice.gov.za/legislation/constitution/SAConstitution-web-eng.pdf", downloadUrl: "https://www.justice.gov.za/legislation/constitution/SAConstitution-web-eng.pdf", thumbnailUrl: "", topic: "SA Law", gradeLevel: "grade_6_7", description: "The full South African Constitution in plain language, explaining your fundamental rights.", hasCaptions: false, year: "1996", author: "South African Parliament" },
  { id: "feat-2", title: "Children's Rights — UNICEF Interactive Learning", contentType: "video", contentSource: "UNICEF", contentUrl: "https://www.youtube.com/embed/sxNYCNNDjqk", thumbnailUrl: "https://img.youtube.com/vi/sxNYCNNDjqk/mqdefault.jpg", topic: "Children's Rights", gradeLevel: "grade_3_5", description: "UNICEF explains the UN Convention on the Rights of the Child in a way children can understand.", hasCaptions: true, year: "2020", author: "UNICEF" },
  { id: "feat-3", title: "Know Your Rights: South African Children's Act", contentType: "article", contentSource: "UNICEF South Africa", contentUrl: "https://www.unicef.org/southafrica/children-rights", thumbnailUrl: "", topic: "Children's Rights", gradeLevel: "grade_6_7", description: "A full explainer on the Children's Act 38 of 2005 and what it means for children's rights.", hasCaptions: false, year: "2023", author: "UNICEF South Africa" },
  { id: "feat-4", title: "Human Rights: A Plain Language Introduction", contentType: "book", contentSource: "Open Library", contentUrl: "https://archive.org/details/humanrights00unit", downloadUrl: "https://archive.org/download/humanrights00unit/humanrights00unit.pdf", thumbnailUrl: "https://covers.openlibrary.org/b/id/8091016-M.jpg", topic: "Human Rights", gradeLevel: "grade_8_12", description: "A comprehensive introduction to human rights concepts and international law.", hasCatons: false, year: "2010", author: "United Nations" },
  { id: "feat-5", title: "What is Gender-Based Violence? — TED-Ed", contentType: "video", contentSource: "TED-Ed", contentUrl: "https://www.youtube.com/embed/GG7EJNHhQNI", thumbnailUrl: "https://img.youtube.com/vi/GG7EJNHhQNI/mqdefault.jpg", topic: "SRGBV", gradeLevel: "grade_8_12", description: "TED-Ed animation explaining gender-based violence, why it happens and what can be done.", hasCaptions: true, year: "2021", author: "TED-Ed" },
  { id: "feat-6", title: "Cyberbullying & Online Safety for Kids", contentType: "tutorial", contentSource: "Common Sense Media", contentUrl: "https://www.commonsense.org/education/digital-citizenship/lesson/cyberbullying-crossing-the-line", thumbnailUrl: "", topic: "Online Safety", gradeLevel: "grade_6_7", description: "Interactive tutorial on recognising and responding to cyberbullying.", hasCaptions: false, year: "2022", author: "Common Sense Media" },
  { id: "feat-7", title: "Universal Declaration of Human Rights — Illustrated", contentType: "book", contentSource: "United Nations", contentUrl: "https://www.un.org/en/about-us/universal-declaration-of-human-rights", downloadUrl: "https://www.un.org/en/udhrbook/pdf/udhr_booklet_en_web.pdf", thumbnailUrl: "", topic: "Human Rights", gradeLevel: "grade_8_12", description: "The Universal Declaration of Human Rights with illustrations, in plain language.", hasCaptions: false, year: "1948", author: "United Nations" },
  { id: "feat-8", title: "South Africa Criminal Justice System Explained", contentType: "video", contentSource: "Open Society Foundation", contentUrl: "https://www.youtube.com/embed/7WFp-V4oVhI", thumbnailUrl: "https://img.youtube.com/vi/7WFp-V4oVhI/mqdefault.jpg", topic: "SA Law", gradeLevel: "grade_8_12", description: "A clear explanation of how the South African criminal justice system works from arrest to trial.", hasCaptions: true, year: "2019", author: "Open Society Foundation SA" },
  { id: "feat-9", title: "Disability Rights in South Africa", contentType: "document", contentSource: "SASSA / Government", contentUrl: "https://www.gov.za/documents/white-paper-rights-persons-disabilities", downloadUrl: "https://www.gov.za/sites/default/files/gcis_document/201409/37706gon230.pdf", thumbnailUrl: "", topic: "Human Rights", gradeLevel: "grade_6_7", description: "The South African White Paper on the Rights of Persons with Disabilities.", hasCaptions: false, year: "2015", author: "South African Government" },
  { id: "feat-10", title: "Child Labour Laws & Your Rights at Work — Youth Guide", contentType: "article", contentSource: "Department of Labour SA", contentUrl: "https://www.labour.gov.za/DocumentCenter/Pages/Child%20Labour.aspx", thumbnailUrl: "", topic: "SA Law", gradeLevel: "grade_8_12", description: "What the law says about children and work, including minimum age rules under BCEA.", hasCaptions: false, year: "2022", author: "SA Department of Labour" },
];

// ─── Premium content catalog ──────────────────────────────────────────────────
const PREMIUM_SEED = [
  { id: "prem-1", title: "Law for Kids: Complete Course (Grades 6–12)", description: "A comprehensive 20-lesson course covering SA law, your rights, courts, and how to protect yourself. Video lectures, quizzes, and downloadable summaries.", contentType: "course", provider: "LegalEase Education SA", pointsCost: 200, directPurchaseUrl: "https://legalease.co.za", thumbnailUrl: "", topic: "SA Law", gradeLevels: ["grade_6_7", "grade_8_12"], tags: ["courses", "SA law", "rights"], hasCaptions: true, hasAudioDescription: true },
  { id: "prem-2", title: "Human Rights Illustrated Encyclopedia (PDF)", description: "400-page illustrated encyclopedia covering every human right, with South African case studies, real stories, and activities.", contentType: "book", provider: "African Rights Press", pointsCost: 150, directPurchaseUrl: null, thumbnailUrl: "", topic: "Human Rights", gradeLevels: ["grade_3_5", "grade_6_7", "grade_8_12"], tags: ["book", "human rights", "encyclopedia"], hasCaptions: false, hasAudioDescription: false },
  { id: "prem-3", title: "SRGBV Prevention Audiobook Series (12 Episodes)", description: "Dramatised audiobook series for young listeners on recognising, refusing, and reporting school-related gender-based violence. Available in English, Zulu, Sotho, Xhosa.", contentType: "audiobook", provider: "M-TETO Audio Productions", pointsCost: 100, directPurchaseUrl: null, thumbnailUrl: "", topic: "SRGBV", gradeLevels: ["grade_3_5", "grade_6_7", "grade_8_12"], tags: ["audiobook", "SRGBV", "multilingual"], hasCaptions: false, hasAudioDescription: false },
  { id: "prem-4", title: "Constitutional Law for High School — Video Series", description: "10 high-quality video lectures by SA legal experts. Covers the Bill of Rights section by section, with examples from real SA court cases.", contentType: "video", provider: "Wits Law School Open Learning", pointsCost: 250, directPurchaseUrl: "https://www.wits.ac.za", thumbnailUrl: "", topic: "SA Law", gradeLevels: ["grade_8_12"], tags: ["video", "constitutional law", "bill of rights"], hasCaptions: true, hasAudioDescription: true },
  { id: "prem-5", title: "Child Protection & SRGBV: Teacher + Parent Guide (PDF)", description: "A comprehensive guide for educators and parents on identifying SRGBV, legal obligations, and how to support affected children.", contentType: "document", provider: "Childline South Africa", pointsCost: 75, directPurchaseUrl: null, thumbnailUrl: "", topic: "SRGBV", gradeLevels: ["all"], tags: ["guide", "parent", "teacher", "SRGBV"], hasCaptions: false, hasAudioDescription: false },
];

async function seedPremiumContent() {
  try {
    const existing = await db.select().from(universityPremiumContentTable).limit(1);
    if (existing.length > 0) return;
    await db.insert(universityPremiumContentTable).values(
      PREMIUM_SEED.map(p => ({
        id: p.id, title: p.title, description: p.description, contentType: p.contentType,
        provider: p.provider, pointsCost: p.pointsCost,
        directPurchaseUrl: p.directPurchaseUrl ?? null,
        thumbnailUrl: p.thumbnailUrl, topic: p.topic,
        gradeLevels: p.gradeLevels, tags: p.tags,
        hasCaptions: p.hasCaptions, hasAudioDescription: p.hasAudioDescription,
      }))
    );
    console.log("✅ Premium content catalog seeded");
  } catch (e) {
    console.error("Premium seed error:", e);
  }
}

seedPremiumContent();

// ─── Helper: query Open Library ───────────────────────────────────────────────
async function searchOpenLibrary(query: string, limit = 8) {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,first_publish_year,cover_i,subject,ia,description`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json() as any;
    return (data.docs || []).map((d: any) => ({
      id: `ol-${d.key?.replace("/works/", "")}`,
      title: d.title || "Untitled",
      author: d.author_name?.[0] || "Unknown",
      year: String(d.first_publish_year || ""),
      contentType: "book",
      contentSource: "Open Library",
      contentUrl: `https://openlibrary.org${d.key}`,
      downloadUrl: d.ia?.[0] ? `https://archive.org/download/${d.ia[0]}/${d.ia[0]}.pdf` : null,
      thumbnailUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
      description: typeof d.description === "string" ? d.description : (d.description?.value || ""),
      hasCaptions: false,
      topic: "Human Rights",
      gradeLevel: "all",
    }));
  } catch { return []; }
}

// ─── Helper: query Gutendex (Project Gutenberg) ───────────────────────────────
async function searchGutenberg(query: string, limit = 6) {
  try {
    const url = `https://gutendex.com/books/?search=${encodeURIComponent(query)}&languages=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json() as any;
    return (data.results || []).slice(0, limit).map((d: any) => ({
      id: `gutenberg-${d.id}`,
      title: d.title || "Untitled",
      author: d.authors?.[0]?.name || "Unknown",
      year: String(d.authors?.[0]?.birth_year || ""),
      contentType: "book",
      contentSource: "Project Gutenberg",
      contentUrl: `https://www.gutenberg.org/ebooks/${d.id}`,
      downloadUrl: d.formats?.["application/pdf"] || d.formats?.["text/html"] || null,
      thumbnailUrl: null,
      description: `${d.subjects?.slice(0, 3).join(", ") || "Classic literature"} — Free public domain book.`,
      hasCaptions: false,
      topic: "Law & Rights",
      gradeLevel: "grade_8_12",
    }));
  } catch { return []; }
}

// ─── Helper: query Internet Archive ──────────────────────────────────────────
async function searchInternetArchive(query: string, mediatype = "texts", limit = 8) {
  try {
    const q = `${query} AND mediatype:${mediatype}`;
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,title,description,creator,year,subject,mediatype&output=json&rows=${limit}&sort[]=downloads+desc`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json() as any;
    return (data.response?.docs || []).map((d: any) => {
      const type = d.mediatype === "audio" ? "audiobook" : d.mediatype === "movies" ? "video" : "document";
      return {
        id: `ia-${d.identifier}`,
        title: d.title || "Untitled",
        author: Array.isArray(d.creator) ? d.creator[0] : (d.creator || ""),
        year: String(d.year || ""),
        contentType: type,
        contentSource: "Internet Archive",
        contentUrl: `https://archive.org/details/${d.identifier}`,
        downloadUrl: `https://archive.org/download/${d.identifier}`,
        thumbnailUrl: `https://archive.org/services/img/${d.identifier}`,
        description: Array.isArray(d.description) ? d.description[0] : (d.description || ""),
        hasCaptions: false,
        topic: "Human Rights",
        gradeLevel: "all",
      };
    });
  } catch { return []; }
}

// ─── POST /university/search ──────────────────────────────────────────────────
router.post("/university/search", async (req, res) => {
  const { query, gradeLevel, contentType, topic } = req.body as {
    query: string; gradeLevel?: string; contentType?: string; topic?: string;
  };

  if (!query || query.trim().length < 2) {
    return res.json({ results: FEATURED_CONTENT, aiSummary: null });
  }

  try {
    const enrichedQuery = `${query} ${topic || ""} children rights law South Africa`.trim();

    const [books, gutenberg, archiveDocs, archiveAudio] = await Promise.allSettled([
      searchOpenLibrary(enrichedQuery, 6),
      searchGutenberg(query, 4),
      searchInternetArchive(enrichedQuery, "texts", 6),
      searchInternetArchive(`${query} audio children rights`, "audio", 4),
    ]);

    const allResults = [
      ...(books.status === "fulfilled" ? books.value : []),
      ...(gutenberg.status === "fulfilled" ? gutenberg.value : []),
      ...(archiveDocs.status === "fulfilled" ? archiveDocs.value : []),
      ...(archiveAudio.status === "fulfilled" ? archiveAudio.value : []),
    ];

    // Filter by content type if specified
    const filtered = contentType && contentType !== "all"
      ? allResults.filter(r => r.contentType === contentType)
      : allResults;

    // Also add relevant featured content
    const featuredMatches = FEATURED_CONTENT.filter(f =>
      f.title.toLowerCase().includes(query.toLowerCase()) ||
      f.topic.toLowerCase().includes(query.toLowerCase()) ||
      f.description.toLowerCase().includes(query.toLowerCase()) ||
      (topic && f.topic.toLowerCase().includes(topic.toLowerCase()))
    );

    // AI summary of search results
    let aiSummary: string | null = null;
    try {
      const chat = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are M-TETO's library assistant helping South African children (grades 1-12) find educational content about law and human rights. Keep responses concise, friendly, and age-appropriate. Respond in 1-2 sentences."
        }, {
          role: "user",
          content: `A child searched for: "${query}"${gradeLevel ? ` (${gradeLevel})` : ""}${topic ? ` about ${topic}` : ""}. Found ${filtered.length + featuredMatches.length} resources. Give a brief, encouraging intro to help them start learning.`
        }],
        max_tokens: 100,
      });
      aiSummary = chat.choices[0]?.message?.content || null;
    } catch {}

    return res.json({
      results: [...featuredMatches, ...filtered],
      aiSummary,
      totalFound: filtered.length + featuredMatches.length,
    });
  } catch (error) {
    console.error("University search error:", error);
    return res.json({ results: FEATURED_CONTENT, aiSummary: null });
  }
});

// ─── GET /university/featured ─────────────────────────────────────────────────
router.get("/university/featured", (req, res) => {
  const { gradeLevel, contentType } = req.query as { gradeLevel?: string; contentType?: string };
  let results = FEATURED_CONTENT;
  if (gradeLevel && gradeLevel !== "all") results = results.filter(f => f.gradeLevel === gradeLevel || f.gradeLevel === "all");
  if (contentType && contentType !== "all") results = results.filter(f => f.contentType === contentType);
  res.json({ results, total: results.length });
});

// ─── GET /university/saved ────────────────────────────────────────────────────
router.get("/university/saved", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) return res.json({ saved: [] });
  try {
    const saved = await db.select().from(universitySavedContentTable)
      .where(eq(universitySavedContentTable.sessionId, sessionId))
      .orderBy(desc(universitySavedContentTable.savedAt));
    res.json({ saved });
  } catch (e) {
    res.json({ saved: [] });
  }
});

// ─── POST /university/saved ───────────────────────────────────────────────────
router.post("/university/saved", async (req, res) => {
  const body = req.body;
  if (!body.sessionId || !body.contentId || !body.contentUrl || !body.contentTitle) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    // Check if already saved
    const existing = await db.select().from(universitySavedContentTable)
      .where(and(
        eq(universitySavedContentTable.sessionId, body.sessionId),
        eq(universitySavedContentTable.contentId, body.contentId)
      )).limit(1);
    if (existing.length > 0) return res.json({ saved: existing[0], alreadySaved: true });

    const [saved] = await db.insert(universitySavedContentTable).values({
      sessionId: body.sessionId, userId: body.userId || null,
      contentId: body.contentId, contentUrl: body.contentUrl,
      contentTitle: body.contentTitle, contentType: body.contentType || "article",
      contentSource: body.contentSource || null, thumbnailUrl: body.thumbnailUrl || null,
      author: body.author || null, year: body.year || null,
      description: body.description || null, topic: body.topic || null,
      gradeLevel: body.gradeLevel || null, downloadUrl: body.downloadUrl || null,
      hasCaptions: body.hasCaptions ?? false,
    }).returning();
    res.json({ saved, alreadySaved: false });
  } catch (e) {
    console.error("Save content error:", e);
    res.status(500).json({ error: "Failed to save" });
  }
});

// ─── DELETE /university/saved/:contentId ──────────────────────────────────────
router.delete("/university/saved/:contentId", async (req, res) => {
  const { contentId } = req.params;
  const sessionId = req.query.sessionId as string;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });
  try {
    await db.delete(universitySavedContentTable).where(
      and(eq(universitySavedContentTable.contentId, contentId), eq(universitySavedContentTable.sessionId, sessionId))
    );
    res.json({ removed: true });
  } catch {
    res.status(500).json({ error: "Failed to remove" });
  }
});

// ─── GET /university/premium ──────────────────────────────────────────────────
router.get("/university/premium", async (req, res) => {
  const { topic, contentType, gradeLevel } = req.query as Record<string, string>;
  try {
    let items = await db.select().from(universityPremiumContentTable)
      .where(eq(universityPremiumContentTable.isActive, true));
    if (topic) items = items.filter(i => i.topic.toLowerCase().includes(topic.toLowerCase()));
    if (contentType && contentType !== "all") items = items.filter(i => i.contentType === contentType);
    res.json({ items });
  } catch {
    res.json({ items: PREMIUM_SEED });
  }
});

// ─── POST /university/premium/:id/redeem ─────────────────────────────────────
router.post("/university/premium/:id/redeem", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Login required to redeem" });
  const { id } = req.params;
  try {
    const [item] = await db.select().from(universityPremiumContentTable)
      .where(eq(universityPremiumContentTable.id, id)).limit(1);
    if (!item) return res.status(404).json({ error: "Content not found" });
    // Check existing redemption
    const existing = await db.select().from(universityPremiumRedemptionsTable)
      .where(and(
        eq(universityPremiumRedemptionsTable.userId, req.user.id),
        eq(universityPremiumRedemptionsTable.contentId, id)
      )).limit(1);
    if (existing.length > 0) return res.json({ success: true, alreadyRedeemed: true, item });

    await db.insert(universityPremiumRedemptionsTable).values({
      userId: req.user.id!, contentId: id, pointsSpent: item.pointsCost,
    });
    res.json({ success: true, alreadyRedeemed: false, item });
  } catch (e) {
    console.error("Redeem error:", e);
    res.status(500).json({ error: "Failed to redeem" });
  }
});

export default router;
