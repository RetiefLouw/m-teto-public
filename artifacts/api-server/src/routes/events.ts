import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { userEventsTable, sessionProfilesTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const router = Router();

/**
 * POST /api/events
 * Log any user interaction anonymously.
 * Called from every page and feature in the m-teto frontend.
 * No personal data — only sessionId, eventType, eventData, gradeLevel, province.
 */
router.post("/events", async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      eventType,
      eventData = {},
      gradeLevel,
      province,
    } = req.body;

    if (!sessionId || !eventType) {
      return res.status(400).json({ error: "sessionId and eventType required" });
    }

    // Insert event record
    await db.insert(userEventsTable).values({
      sessionId,
      eventType,
      eventData,
      gradeLevel: gradeLevel || null,
      province: province || null,
    });

    // Upsert session profile — update rolling counters
    const incrementCol = getIncrementColumn(eventType);
    const isTotalEvents = incrementCol === "total_events";
    const topicTag = getTopicTag(eventType, eventData);
    const pageTag = eventData?.page || eventData?.path || null;

    if (isTotalEvents) {
      await db.execute(sql`
        INSERT INTO session_profiles (
          session_id, grade_level, province, total_events,
          topics_explored, pages_visited, last_active, created_at
        )
        VALUES (
          ${sessionId}, ${gradeLevel || null}, ${province || null}, 1,
          ${topicTag ? sql`ARRAY[${topicTag}]::jsonb` : sql`'[]'::jsonb`},
          ${pageTag ? sql`to_jsonb(ARRAY[${pageTag}])` : sql`'[]'::jsonb`},
          NOW(), NOW()
        )
        ON CONFLICT (session_id) DO UPDATE SET
          total_events = session_profiles.total_events + 1,
          grade_level = COALESCE(session_profiles.grade_level, EXCLUDED.grade_level),
          province = COALESCE(session_profiles.province, EXCLUDED.province),
          topics_explored = CASE
            WHEN ${topicTag !== null} AND NOT (session_profiles.topics_explored @> ${JSON.stringify([topicTag])}::jsonb)
            THEN session_profiles.topics_explored || ${JSON.stringify([topicTag])}::jsonb
            ELSE session_profiles.topics_explored
          END,
          pages_visited = CASE
            WHEN ${pageTag !== null} AND NOT (session_profiles.pages_visited @> ${JSON.stringify([pageTag])}::jsonb)
            THEN session_profiles.pages_visited || ${JSON.stringify([pageTag])}::jsonb
            ELSE session_profiles.pages_visited
          END,
          last_active = NOW()
      `);
    } else {
      await db.execute(sql`
        INSERT INTO session_profiles (
          session_id, grade_level, province, total_events, ${sql.raw(incrementCol)},
          topics_explored, pages_visited, last_active, created_at
        )
        VALUES (
          ${sessionId}, ${gradeLevel || null}, ${province || null}, 1, 1,
          ${topicTag ? sql`ARRAY[${topicTag}]::jsonb` : sql`'[]'::jsonb`},
          ${pageTag ? sql`to_jsonb(ARRAY[${pageTag}])` : sql`'[]'::jsonb`},
          NOW(), NOW()
        )
        ON CONFLICT (session_id) DO UPDATE SET
          total_events = session_profiles.total_events + 1,
          ${sql.raw(incrementCol)} = session_profiles.${sql.raw(incrementCol)} + 1,
          grade_level = COALESCE(session_profiles.grade_level, EXCLUDED.grade_level),
          province = COALESCE(session_profiles.province, EXCLUDED.province),
          topics_explored = CASE
            WHEN ${topicTag !== null} AND NOT (session_profiles.topics_explored @> ${JSON.stringify([topicTag])}::jsonb)
            THEN session_profiles.topics_explored || ${JSON.stringify([topicTag])}::jsonb
            ELSE session_profiles.topics_explored
          END,
          pages_visited = CASE
            WHEN ${pageTag !== null} AND NOT (session_profiles.pages_visited @> ${JSON.stringify([pageTag])}::jsonb)
            THEN session_profiles.pages_visited || ${JSON.stringify([pageTag])}::jsonb
            ELSE session_profiles.pages_visited
          END,
          last_active = NOW()
      `);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Event tracking error:", err);
    // Silently succeed — never break the user experience
    return res.json({ ok: true });
  }
});

/**
 * PATCH /api/events/session — update session profile with assessment data
 * Called when onboarding assessment completes.
 */
router.patch("/events/session", async (req: Request, res: Response) => {
  try {
    const { sessionId, knowledgeScore, riskLevel, hasRiskFlags, adaptiveLevel,
      genderIdentity, racialGroup, areaType, schoolType } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    await db.execute(sql`
      INSERT INTO session_profiles (session_id, knowledge_score, risk_level, has_risk_flags,
        adaptive_level, gender_identity, racial_group, area_type, school_type,
        assessment_completed, total_events, last_active, created_at)
      VALUES (${sessionId}, ${knowledgeScore ?? null}, ${riskLevel ?? null},
        ${hasRiskFlags ?? false}, ${adaptiveLevel ?? "beginner"},
        ${genderIdentity ?? null}, ${racialGroup ?? null},
        ${areaType ?? null}, ${schoolType ?? null},
        true, 0, NOW(), NOW())
      ON CONFLICT (session_id) DO UPDATE SET
        knowledge_score = COALESCE(${knowledgeScore ?? null}, session_profiles.knowledge_score),
        risk_level = COALESCE(${riskLevel ?? null}, session_profiles.risk_level),
        has_risk_flags = COALESCE(${hasRiskFlags ?? null}, session_profiles.has_risk_flags),
        adaptive_level = COALESCE(${adaptiveLevel ?? null}, session_profiles.adaptive_level),
        gender_identity = COALESCE(${genderIdentity ?? null}, session_profiles.gender_identity),
        racial_group = COALESCE(${racialGroup ?? null}, session_profiles.racial_group),
        area_type = COALESCE(${areaType ?? null}, session_profiles.area_type),
        school_type = COALESCE(${schoolType ?? null}, session_profiles.school_type),
        assessment_completed = true,
        last_active = NOW()
    `);

    return res.json({ ok: true });
  } catch (err) {
    console.error("Session update error:", err);
    return res.json({ ok: true });
  }
});

function getIncrementColumn(eventType: string): string {
  switch (eventType) {
    case "search": return "total_searches";
    case "article_read": return "total_article_reads";
    case "provider_view": return "total_provider_views";
    case "teto_chat": return "total_teto_messages";
    case "quiz_answer": return "total_quiz_answers";
    case "review_submit": return "total_reviews";
    default: return "total_events";
  }
}

function getTopicTag(eventType: string, eventData: any): string | null {
  if (eventType === "search") return eventData?.query ? `search:${eventData.query.toLowerCase().split(" ").slice(0, 2).join("_")}` : null;
  if (eventType === "article_read") return eventData?.category ? `topic:${eventData.category}` : null;
  if (eventType === "provider_view") return `service:${eventData?.type || "provider"}`;
  if (eventType === "emergency_visit") return "emergency";
  if (eventType === "university_lesson") return `lesson:${eventData?.topic || "srgbv"}`;
  return null;
}

export default router;
