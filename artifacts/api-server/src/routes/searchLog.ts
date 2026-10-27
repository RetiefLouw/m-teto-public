import { Router } from "express";
import { db } from "@workspace/db";
import { searchLogsTable } from "@workspace/db";

const router = Router();

// POST /api/search-log — anonymously log a search query for analytics
router.post("/", async (req, res) => {
  try {
    const { sessionId, query, gradeLevel, province, resultCount } = req.body as {
      sessionId?: string;
      query: string;
      gradeLevel?: string;
      province?: string;
      resultCount?: number;
    };

    if (!query?.trim()) {
      return res.status(400).json({ error: "Query is required" });
    }

    await db.insert(searchLogsTable).values({
      sessionId,
      query: query.trim().toLowerCase().substring(0, 500),
      gradeLevel,
      province,
      resultCount,
    });

    return res.json({ ok: true });
  } catch (err) {
    // Don't fail silently — but also don't break the search experience
    console.error("Search log error:", err);
    return res.json({ ok: false });
  }
});

export default router;
