/**
 * Admin Intelligence Routes — Extended analytics, user journeys, AI insights,
 * funnel analysis, interventions, and report generation.
 *
 * All routes require X-Admin-Pin header.
 * All data is anonymous — session IDs only, no PII.
 */
import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  userEventsTable,
  sessionProfilesTable,
  userAssessmentsTable,
  searchLogsTable,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { sql, desc, count, eq, and, gte, lte } from "drizzle-orm";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const pin = req.headers["x-admin-pin"] || req.query.adminPin;
  const validPin = process.env.ADMIN_PIN || "";
  if (!validPin || pin !== validPin) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// ─── GET /api/admin/sessions ─────────────────────────────────────────────────
// Paginated list of all anonymous session profiles with journey summaries
router.get("/admin/sessions", requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const riskFilter = req.query.riskLevel as string | undefined;
    const gradeFilter = req.query.gradeLevel as string | undefined;

    let query = db.select().from(sessionProfilesTable);
    const conditions = [];
    if (riskFilter) conditions.push(eq(sessionProfilesTable.riskLevel, riskFilter));
    if (gradeFilter) conditions.push(eq(sessionProfilesTable.gradeLevel, gradeFilter));

    const sessions = await db
      .select()
      .from(sessionProfilesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(sessionProfilesTable.lastActive))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(sessionProfilesTable)
      .where(conditions.length ? and(...conditions) : undefined);

    return res.json({ sessions, total, limit, offset });
  } catch (err) {
    console.error("Admin sessions error:", err);
    return res.status(500).json({ error: "Failed to load sessions" });
  }
});

// ─── GET /api/admin/sessions/:sessionId ─────────────────────────────────────
// Full individual session journey — all events in chronological order
router.get("/admin/sessions/:sessionId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const [profile] = await db
      .select()
      .from(sessionProfilesTable)
      .where(eq(sessionProfilesTable.sessionId, sessionId));

    const events = await db
      .select()
      .from(userEventsTable)
      .where(eq(userEventsTable.sessionId, sessionId))
      .orderBy(userEventsTable.createdAt);

    const assessment = await db
      .select()
      .from(userAssessmentsTable)
      .where(eq(userAssessmentsTable.sessionId, sessionId))
      .limit(1);

    const searches = await db
      .select()
      .from(searchLogsTable)
      .where(eq(searchLogsTable.sessionId, sessionId))
      .orderBy(searchLogsTable.createdAt);

    return res.json({
      profile: profile ?? null,
      events,
      assessment: assessment[0] ?? null,
      searches,
    });
  } catch (err) {
    console.error("Admin session detail error:", err);
    return res.status(500).json({ error: "Failed to load session" });
  }
});

// ─── GET /api/admin/events ───────────────────────────────────────────────────
// Live event stream for admin monitoring — recent events with filters
router.get("/admin/events", requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const eventType = req.query.eventType as string | undefined;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;

    const conditions = [];
    if (eventType) conditions.push(eq(userEventsTable.eventType, eventType));
    if (since) conditions.push(gte(userEventsTable.createdAt, since));

    const events = await db
      .select()
      .from(userEventsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(userEventsTable.createdAt))
      .limit(limit);

    // Event type counts
    const typeCounts = await db
      .select({
        eventType: userEventsTable.eventType,
        count: count(),
      })
      .from(userEventsTable)
      .groupBy(userEventsTable.eventType)
      .orderBy(desc(count()));

    return res.json({ events, typeCounts });
  } catch (err) {
    console.error("Admin events error:", err);
    return res.status(500).json({ error: "Failed to load events" });
  }
});

// ─── GET /api/admin/funnel ───────────────────────────────────────────────────
// User acquisition and engagement funnel — where are users dropping off?
router.get("/admin/funnel", requireAdmin, async (req: Request, res: Response) => {
  try {
    const [totalSessions] = await db.select({ c: count() }).from(sessionProfilesTable);
    const [completedAssessment] = await db
      .select({ c: count() })
      .from(sessionProfilesTable)
      .where(eq(sessionProfilesTable.assessmentCompleted, true));

    const [usedSearch] = await db
      .select({ c: count() })
      .from(sessionProfilesTable)
      .where(sql`total_searches > 0`);

    const [viewedProvider] = await db
      .select({ c: count() })
      .from(sessionProfilesTable)
      .where(sql`total_provider_views > 0`);

    const [chattedTeto] = await db
      .select({ c: count() })
      .from(sessionProfilesTable)
      .where(sql`total_teto_messages > 0`);

    const [readArticle] = await db
      .select({ c: count() })
      .from(sessionProfilesTable)
      .where(sql`total_article_reads > 0`);

    const [submittedReview] = await db
      .select({ c: count() })
      .from(sessionProfilesTable)
      .where(sql`total_reviews > 0`);

    const [visitedEmergency] = await db
      .select({ c: count() })
      .from(userEventsTable)
      .where(eq(userEventsTable.eventType, "emergency_visit"));

    const total = Number(totalSessions.c) || 1;

    const funnel = [
      { step: "App opened", count: total, pct: 100 },
      { step: "Assessment started", count: Number(completedAssessment.c), pct: Math.round((Number(completedAssessment.c) / total) * 100) },
      { step: "Used search", count: Number(usedSearch.c), pct: Math.round((Number(usedSearch.c) / total) * 100) },
      { step: "Read an article", count: Number(readArticle.c), pct: Math.round((Number(readArticle.c) / total) * 100) },
      { step: "Viewed a provider", count: Number(viewedProvider.c), pct: Math.round((Number(viewedProvider.c) / total) * 100) },
      { step: "Chatted with TETO", count: Number(chattedTeto.c), pct: Math.round((Number(chattedTeto.c) / total) * 100) },
      { step: "Submitted a review", count: Number(submittedReview.c), pct: Math.round((Number(submittedReview.c) / total) * 100) },
      { step: "Visited emergency page", count: Number(visitedEmergency.c), pct: Math.round((Number(visitedEmergency.c) / total) * 100) },
    ];

    // Daily new sessions (14 days)
    const dailyNew = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        count: count(),
      })
      .from(sessionProfilesTable)
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at) DESC`)
      .limit(14);

    // Engagement distribution — bucket users by event count
    const engagementBuckets = await db.execute(sql`
      SELECT
        CASE
          WHEN total_events = 1 THEN '1 event'
          WHEN total_events BETWEEN 2 AND 5 THEN '2–5 events'
          WHEN total_events BETWEEN 6 AND 15 THEN '6–15 events'
          WHEN total_events BETWEEN 16 AND 30 THEN '16–30 events'
          ELSE '30+ events'
        END as bucket,
        COUNT(*) as count
      FROM session_profiles
      GROUP BY bucket
      ORDER BY MIN(total_events)
    `);

    return res.json({ funnel, dailyNewSessions: dailyNew.reverse(), engagementBuckets: engagementBuckets.rows });
  } catch (err) {
    console.error("Admin funnel error:", err);
    return res.status(500).json({ error: "Failed to load funnel" });
  }
});

// ─── GET /api/admin/interventions ────────────────────────────────────────────
// High-risk sessions that need attention from service providers / programme coordinators
router.get("/admin/interventions", requireAdmin, async (req: Request, res: Response) => {
  try {
    const highRiskSessions = await db
      .select()
      .from(sessionProfilesTable)
      .where(
        and(
          eq(sessionProfilesTable.riskLevel, "high"),
          eq(sessionProfilesTable.hasRiskFlags, true)
        )
      )
      .orderBy(desc(sessionProfilesTable.lastActive))
      .limit(100);

    const mediumRiskSessions = await db
      .select()
      .from(sessionProfilesTable)
      .where(
        and(
          eq(sessionProfilesTable.riskLevel, "medium"),
          eq(sessionProfilesTable.hasRiskFlags, true)
        )
      )
      .orderBy(desc(sessionProfilesTable.lastActive))
      .limit(100);

    // Sessions with emergency page visits
    const emergencyVisitors = await db
      .select({
        sessionId: userEventsTable.sessionId,
        visitCount: count(),
        lastVisit: sql<string>`MAX(created_at)`,
      })
      .from(userEventsTable)
      .where(eq(userEventsTable.eventType, "emergency_visit"))
      .groupBy(userEventsTable.sessionId)
      .orderBy(desc(sql`MAX(created_at)`))
      .limit(50);

    // Risk flag breakdown for intervention planning
    const flagTypes = await db
      .select({
        flags: userAssessmentsTable.riskFlags,
        province: userAssessmentsTable.province,
        areaType: userAssessmentsTable.areaType,
        gradeLevel: userAssessmentsTable.gradeLevel,
      })
      .from(userAssessmentsTable)
      .where(sql`has_risk_flags = true`);

    const flagBreakdown: Record<string, { count: number; provinces: string[]; grades: string[] }> = {};
    for (const row of flagTypes) {
      if (Array.isArray(row.flags)) {
        for (const f of row.flags) {
          if (!flagBreakdown[f]) flagBreakdown[f] = { count: 0, provinces: [], grades: [] };
          flagBreakdown[f].count++;
          if (row.province && !flagBreakdown[f].provinces.includes(row.province)) flagBreakdown[f].provinces.push(row.province);
          if (row.gradeLevel && !flagBreakdown[f].grades.includes(row.gradeLevel)) flagBreakdown[f].grades.push(row.gradeLevel);
        }
      }
    }

    const flagList = Object.entries(flagBreakdown)
      .map(([flag, data]) => ({ flag, ...data }))
      .sort((a, b) => b.count - a.count);

    return res.json({
      highRiskSessions,
      mediumRiskSessions,
      emergencyVisitors,
      flagBreakdown: flagList,
      summary: {
        totalHighRisk: highRiskSessions.length,
        totalMediumRisk: mediumRiskSessions.length,
        totalEmergencyVisits: emergencyVisitors.length,
      },
    });
  } catch (err) {
    console.error("Admin interventions error:", err);
    return res.status(500).json({ error: "Failed to load interventions" });
  }
});

// ─── GET /api/admin/ai-insights ─────────────────────────────────────────────
// AI-generated narrative from the data — "tells the story" of what's happening
router.get("/admin/ai-insights", requireAdmin, async (req: Request, res: Response) => {
  try {
    const storyType = (req.query.type as string) || "overview";

    // Gather data for the narrative
    const [totals] = await db
      .select({
        totalSessions: count(),
        riskCount: sql<number>`COUNT(*) FILTER (WHERE has_risk_flags = true)`,
        avgKnowledge: sql<number>`ROUND(AVG(knowledge_score)::numeric, 1)`,
        assessmentsCompleted: sql<number>`COUNT(*) FILTER (WHERE assessment_completed = true)`,
        totalSearches: sql<number>`COALESCE(SUM(total_searches), 0)`,
        totalProviderViews: sql<number>`COALESCE(SUM(total_provider_views), 0)`,
        totalTetoMessages: sql<number>`COALESCE(SUM(total_teto_messages), 0)`,
      })
      .from(sessionProfilesTable);

    const riskByGrade = await db
      .select({
        gradeLevel: sessionProfilesTable.gradeLevel,
        riskCount: sql<number>`COUNT(*) FILTER (WHERE has_risk_flags = true)`,
        total: count(),
      })
      .from(sessionProfilesTable)
      .where(sql`grade_level IS NOT NULL`)
      .groupBy(sessionProfilesTable.gradeLevel);

    const topSearches = await db
      .select({ query: searchLogsTable.query, count: count() })
      .from(searchLogsTable)
      .groupBy(searchLogsTable.query)
      .orderBy(desc(count()))
      .limit(10)
      .catch(() => []);

    const systemPrompts: Record<string, string> = {
      overview: `You are a senior data analyst and child protection specialist writing an executive briefing for government departments, UN agencies, and NGO programme coordinators about the M-TETO child safety platform in South Africa. Write in formal, policy-appropriate English. Be specific with numbers. Be direct about risks. End with concrete recommendations.`,
      risk: `You are a gender-based violence specialist and social worker analyzing risk data from M-TETO. Write a clinical risk assessment briefing for intervention teams. Focus on which grades, provinces, and area types need immediate support. Be specific about the types of violence and risk factors disclosed.`,
      knowledge: `You are an education specialist analyzing knowledge gap data from a child rights awareness platform. Write a curriculum intervention memo for Department of Basic Education officials. Identify exactly where knowledge is lowest and what content needs strengthening.`,
      intervention: `You are a programme coordinator writing an urgent intervention brief for SAPS, DSD, and NGO partners. Identify high-risk patterns and recommend specific, actionable interventions for each affected province and grade level.`,
    };

    const userPrompt = `
Here is the M-TETO platform data snapshot:

PLATFORM USAGE:
- Total anonymous sessions: ${totals?.totalSessions ?? 0}
- Assessments completed: ${totals?.assessmentsCompleted ?? 0}
- Sessions with risk flags: ${totals?.riskCount ?? 0} (${totals?.totalSessions ? Math.round((Number(totals.riskCount) / Number(totals.totalSessions)) * 100) : 0}%)
- Average SRGBV knowledge score: ${totals?.avgKnowledge ?? 0}%
- Total searches performed: ${totals?.totalSearches ?? 0}
- Total service provider views: ${totals?.totalProviderViews ?? 0}
- Total TETO AI conversations: ${totals?.totalTetoMessages ?? 0}

RISK BY GRADE:
${riskByGrade.map(r => `- ${r.gradeLevel}: ${r.riskCount}/${r.total} flagged (${r.total ? Math.round((Number(r.riskCount) / Number(r.total)) * 100) : 0}%)`).join("\n")}

TOP SEARCH QUERIES (what children are seeking):
${topSearches.slice(0, 8).map((s, i) => `${i + 1}. "${s.query}" (${s.count} times)`).join("\n")}

Write a 4–6 paragraph data narrative that:
1. Opens with the headline finding
2. Describes what the data reveals about children's lived experiences
3. Identifies the most critical risk patterns and knowledge gaps
4. Connects search queries to the needs and fears children are expressing
5. Ends with 3–5 specific, actionable recommendations for programme coordinators, government departments, or service providers
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompts[storyType] ?? systemPrompts.overview },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const narrative = completion.choices[0]?.message?.content ?? "Unable to generate insights at this time.";

    return res.json({
      narrative,
      storyType,
      dataSnapshot: {
        totalSessions: totals?.totalSessions ?? 0,
        riskRate: totals?.totalSessions ? Math.round((Number(totals.riskCount) / Number(totals.totalSessions)) * 100) : 0,
        avgKnowledge: totals?.avgKnowledge ?? 0,
        totalSearches: totals?.totalSearches ?? 0,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Admin AI insights error:", err);
    return res.status(500).json({ error: "Failed to generate insights" });
  }
});

// ─── GET /api/admin/reports/collective ───────────────────────────────────────
// Full aggregate report data for export / print
router.get("/admin/reports/collective", requireAdmin, async (req: Request, res: Response) => {
  try {
    const [totals] = await db
      .select({
        totalSessions: count(),
        riskCount: sql<number>`COUNT(*) FILTER (WHERE has_risk_flags = true)`,
        avgKnowledge: sql<number>`ROUND(AVG(knowledge_score)::numeric, 1)`,
        assessmentsCompleted: sql<number>`COUNT(*) FILTER (WHERE assessment_completed = true)`,
        highRisk: sql<number>`COUNT(*) FILTER (WHERE risk_level = 'high')`,
        mediumRisk: sql<number>`COUNT(*) FILTER (WHERE risk_level = 'medium')`,
        lowRisk: sql<number>`COUNT(*) FILTER (WHERE risk_level = 'low')`,
      })
      .from(sessionProfilesTable);

    const byGrade = await db
      .select({
        gradeLevel: sessionProfilesTable.gradeLevel,
        count: count(),
        riskCount: sql<number>`COUNT(*) FILTER (WHERE has_risk_flags = true)`,
        avgKnowledge: sql<number>`ROUND(AVG(knowledge_score)::numeric, 1)`,
      })
      .from(sessionProfilesTable)
      .where(sql`grade_level IS NOT NULL`)
      .groupBy(sessionProfilesTable.gradeLevel);

    const byProvince = await db
      .select({
        province: sessionProfilesTable.province,
        count: count(),
        riskCount: sql<number>`COUNT(*) FILTER (WHERE has_risk_flags = true)`,
        avgKnowledge: sql<number>`ROUND(AVG(knowledge_score)::numeric, 1)`,
      })
      .from(sessionProfilesTable)
      .where(sql`province IS NOT NULL`)
      .groupBy(sessionProfilesTable.province)
      .orderBy(desc(count()));

    const byAreaType = await db
      .select({
        areaType: sessionProfilesTable.areaType,
        count: count(),
        riskCount: sql<number>`COUNT(*) FILTER (WHERE has_risk_flags = true)`,
      })
      .from(sessionProfilesTable)
      .where(sql`area_type IS NOT NULL`)
      .groupBy(sessionProfilesTable.areaType);

    const topSearches = await db
      .select({ query: searchLogsTable.query, count: count() })
      .from(searchLogsTable)
      .groupBy(searchLogsTable.query)
      .orderBy(desc(count()))
      .limit(20)
      .catch(() => []);

    const eventTypeSummary = await db
      .select({ eventType: userEventsTable.eventType, count: count() })
      .from(userEventsTable)
      .groupBy(userEventsTable.eventType)
      .orderBy(desc(count()));

    return res.json({
      generatedAt: new Date().toISOString(),
      totals,
      byGrade,
      byProvince,
      byAreaType,
      topSearches,
      eventTypeSummary,
    });
  } catch (err) {
    console.error("Collective report error:", err);
    return res.status(500).json({ error: "Failed to generate report" });
  }
});

// ─── GET /api/admin/reports/session/:sessionId ───────────────────────────────
// Individual anonymised session report
router.get("/admin/reports/session/:sessionId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const [profile] = await db
      .select()
      .from(sessionProfilesTable)
      .where(eq(sessionProfilesTable.sessionId, sessionId));

    const events = await db
      .select()
      .from(userEventsTable)
      .where(eq(userEventsTable.sessionId, sessionId))
      .orderBy(userEventsTable.createdAt);

    const searches = await db
      .select()
      .from(searchLogsTable)
      .where(eq(searchLogsTable.sessionId, sessionId))
      .orderBy(searchLogsTable.createdAt);

    const assessment = await db
      .select()
      .from(userAssessmentsTable)
      .where(eq(userAssessmentsTable.sessionId, sessionId))
      .limit(1);

    // Compute event type timeline
    const eventTimeline: Record<string, number> = {};
    for (const e of events) {
      eventTimeline[e.eventType] = (eventTimeline[e.eventType] ?? 0) + 1;
    }

    return res.json({
      sessionId,
      profile: profile ?? null,
      assessment: assessment[0] ?? null,
      eventTimeline,
      searches,
      eventCount: events.length,
      firstSeen: events[0]?.createdAt ?? null,
      lastSeen: events[events.length - 1]?.createdAt ?? null,
      journeyDuration: events.length > 1
        ? Math.round((new Date(events[events.length - 1].createdAt).getTime() - new Date(events[0].createdAt).getTime()) / 60000)
        : 0,
    });
  } catch (err) {
    console.error("Session report error:", err);
    return res.status(500).json({ error: "Failed to generate session report" });
  }
});

export default router;
