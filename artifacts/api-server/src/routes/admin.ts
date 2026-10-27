import { Router } from "express";
import { db } from "@workspace/db";
import { userAssessmentsTable, searchLogsTable } from "@workspace/db";
import { sql, desc, count, avg } from "drizzle-orm";

const router = Router();

// Simple admin PIN middleware
function requireAdmin(req: any, res: any, next: any) {
  const pin = req.headers["x-admin-pin"] || req.query.adminPin;
  const validPin = process.env.ADMIN_PIN || "";
  if (!validPin || pin !== validPin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// GET /api/admin/overview
router.get("/admin/overview", requireAdmin, async (req, res) => {
  try {
    const [totals] = await db
      .select({
        totalAssessments: count(),
        totalWithRisk: sql<number>`COUNT(*) FILTER (WHERE has_risk_flags = true)`,
        avgKnowledge: avg(userAssessmentsTable.knowledgeScore),
        completedCount: sql<number>`COUNT(*) FILTER (WHERE completed_at IS NOT NULL)`,
      })
      .from(userAssessmentsTable);

    const [searchTotals] = await db
      .select({ totalSearches: count() })
      .from(searchLogsTable)
      .catch(() => [{ totalSearches: 0 }]);

    const riskByLevel = await db
      .select({
        riskLevel: userAssessmentsTable.riskLevel,
        count: count(),
      })
      .from(userAssessmentsTable)
      .groupBy(userAssessmentsTable.riskLevel);

    const recentActivity = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        count: count(),
      })
      .from(userAssessmentsTable)
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at) DESC`)
      .limit(14);

    return res.json({
      totals: {
        assessments: totals?.totalAssessments ?? 0,
        withRiskFlags: totals?.totalWithRisk ?? 0,
        avgKnowledgeScore: Math.round(Number(totals?.avgKnowledge ?? 0)),
        completed: totals?.completedCount ?? 0,
        searches: searchTotals?.totalSearches ?? 0,
      },
      riskByLevel,
      recentActivity: recentActivity.reverse(),
    });
  } catch (err) {
    console.error("Admin overview error:", err);
    return res.status(500).json({ error: "Failed to load overview" });
  }
});

// GET /api/admin/demographics
router.get("/admin/demographics", requireAdmin, async (req, res) => {
  try {
    const byProvince = await db
      .select({
        province: userAssessmentsTable.province,
        count: count(),
        riskCount: sql<number>`COUNT(*) FILTER (WHERE has_risk_flags = true)`,
      })
      .from(userAssessmentsTable)
      .where(sql`province IS NOT NULL`)
      .groupBy(userAssessmentsTable.province)
      .orderBy(desc(count()));

    const byGrade = await db
      .select({
        gradeLevel: userAssessmentsTable.gradeLevel,
        count: count(),
      })
      .from(userAssessmentsTable)
      .groupBy(userAssessmentsTable.gradeLevel)
      .orderBy(desc(count()));

    const byGender = await db
      .select({
        gender: userAssessmentsTable.genderIdentity,
        count: count(),
      })
      .from(userAssessmentsTable)
      .where(sql`gender_identity IS NOT NULL`)
      .groupBy(userAssessmentsTable.genderIdentity)
      .orderBy(desc(count()));

    const byRace = await db
      .select({
        race: userAssessmentsTable.racialGroup,
        count: count(),
      })
      .from(userAssessmentsTable)
      .where(sql`racial_group IS NOT NULL`)
      .groupBy(userAssessmentsTable.racialGroup)
      .orderBy(desc(count()));

    const byAreaType = await db
      .select({
        areaType: userAssessmentsTable.areaType,
        count: count(),
      })
      .from(userAssessmentsTable)
      .where(sql`area_type IS NOT NULL`)
      .groupBy(userAssessmentsTable.areaType)
      .orderBy(desc(count()));

    const bySchoolType = await db
      .select({
        schoolType: userAssessmentsTable.schoolType,
        count: count(),
      })
      .from(userAssessmentsTable)
      .where(sql`school_type IS NOT NULL`)
      .groupBy(userAssessmentsTable.schoolType)
      .orderBy(desc(count()));

    return res.json({ byProvince, byGrade, byGender, byRace, byAreaType, bySchoolType });
  } catch (err) {
    console.error("Admin demographics error:", err);
    return res.status(500).json({ error: "Failed to load demographics" });
  }
});

// GET /api/admin/risk
router.get("/admin/risk", requireAdmin, async (req, res) => {
  try {
    const hotspots = await db
      .select({
        province: userAssessmentsTable.province,
        areaType: userAssessmentsTable.areaType,
        total: count(),
        riskCount: sql<number>`COUNT(*) FILTER (WHERE has_risk_flags = true)`,
        highRisk: sql<number>`COUNT(*) FILTER (WHERE risk_level = 'high')`,
        mediumRisk: sql<number>`COUNT(*) FILTER (WHERE risk_level = 'medium')`,
      })
      .from(userAssessmentsTable)
      .where(sql`province IS NOT NULL AND area_type IS NOT NULL`)
      .groupBy(userAssessmentsTable.province, userAssessmentsTable.areaType)
      .orderBy(sql`COUNT(*) FILTER (WHERE has_risk_flags = true) DESC`)
      .limit(20);

    const riskFlagTypes = await db
      .select({
        flags: userAssessmentsTable.riskFlags,
      })
      .from(userAssessmentsTable)
      .where(sql`has_risk_flags = true AND risk_flags IS NOT NULL`);

    // Tally flag types
    const flagCounts: Record<string, number> = {};
    for (const row of riskFlagTypes) {
      if (Array.isArray(row.flags)) {
        for (const f of row.flags) {
          flagCounts[f] = (flagCounts[f] || 0) + 1;
        }
      }
    }

    const riskByGrade = await db
      .select({
        gradeLevel: userAssessmentsTable.gradeLevel,
        highRisk: sql<number>`COUNT(*) FILTER (WHERE risk_level = 'high')`,
        mediumRisk: sql<number>`COUNT(*) FILTER (WHERE risk_level = 'medium')`,
        lowRisk: sql<number>`COUNT(*) FILTER (WHERE risk_level = 'low')`,
        noRisk: sql<number>`COUNT(*) FILTER (WHERE risk_level = 'none')`,
        total: count(),
      })
      .from(userAssessmentsTable)
      .groupBy(userAssessmentsTable.gradeLevel);

    return res.json({
      hotspots,
      flagCounts: Object.entries(flagCounts)
        .map(([flag, c]) => ({ flag, count: c }))
        .sort((a, b) => b.count - a.count),
      riskByGrade,
    });
  } catch (err) {
    console.error("Admin risk error:", err);
    return res.status(500).json({ error: "Failed to load risk data" });
  }
});

// GET /api/admin/knowledge
router.get("/admin/knowledge", requireAdmin, async (req, res) => {
  try {
    const byGrade = await db
      .select({
        gradeLevel: userAssessmentsTable.gradeLevel,
        avgScore: avg(userAssessmentsTable.knowledgeScore),
        count: count(),
        high: sql<number>`COUNT(*) FILTER (WHERE knowledge_score >= 70)`,
        medium: sql<number>`COUNT(*) FILTER (WHERE knowledge_score >= 40 AND knowledge_score < 70)`,
        low: sql<number>`COUNT(*) FILTER (WHERE knowledge_score < 40)`,
      })
      .from(userAssessmentsTable)
      .where(sql`knowledge_score IS NOT NULL`)
      .groupBy(userAssessmentsTable.gradeLevel)
      .orderBy(userAssessmentsTable.gradeLevel);

    // Score histogram (0-10, 11-20, ..., 91-100)
    const scoreRanges = Array.from({ length: 10 }, (_, i) => {
      const lo = i * 10;
      const hi = (i + 1) * 10;
      return { range: `${lo}-${hi}`, lo, hi };
    });

    const histogram = await Promise.all(
      scoreRanges.map(async ({ range, lo, hi }) => {
        const [{ c }] = await db
          .select({ c: sql<number>`COUNT(*)::int` })
          .from(userAssessmentsTable)
          .where(sql`knowledge_score >= ${lo} AND knowledge_score < ${hi + (hi === 100 ? 1 : 0)}`);
        return { range, count: c };
      })
    );

    return res.json({
      byGrade: byGrade.map((g) => ({
        ...g,
        avgScore: Math.round(Number(g.avgScore ?? 0)),
      })),
      histogram,
    });
  } catch (err) {
    console.error("Admin knowledge error:", err);
    return res.status(500).json({ error: "Failed to load knowledge data" });
  }
});

// GET /api/admin/searches
router.get("/admin/searches", requireAdmin, async (req, res) => {
  try {
    // Try to get search data, return empty gracefully if table doesn't exist yet
    const topQueries = await db
      .select({
        query: searchLogsTable.query,
        count: count(),
      })
      .from(searchLogsTable)
      .groupBy(searchLogsTable.query)
      .orderBy(desc(count()))
      .limit(20)
      .catch(() => []);

    const byGrade = await db
      .select({
        gradeLevel: searchLogsTable.gradeLevel,
        count: count(),
      })
      .from(searchLogsTable)
      .where(sql`grade_level IS NOT NULL`)
      .groupBy(searchLogsTable.gradeLevel)
      .orderBy(desc(count()))
      .catch(() => []);

    const byProvince = await db
      .select({
        province: searchLogsTable.province,
        count: count(),
      })
      .from(searchLogsTable)
      .where(sql`province IS NOT NULL`)
      .groupBy(searchLogsTable.province)
      .orderBy(desc(count()))
      .limit(10)
      .catch(() => []);

    const recent = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        count: count(),
      })
      .from(searchLogsTable)
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at) DESC`)
      .limit(14)
      .catch(() => []);

    return res.json({ topQueries, byGrade, byProvince, recentSearches: recent.reverse() });
  } catch (err) {
    console.error("Admin searches error:", err);
    return res.status(500).json({ error: "Failed to load search data" });
  }
});

export default router;
