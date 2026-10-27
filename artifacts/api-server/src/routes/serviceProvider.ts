/**
 * Service Provider API Routes — M-TETO
 * For authorised officials, NGOs and NPOs to manage cases digitally.
 * Integrated, multi-departmental, corruption-proof case management.
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { caseTimelineEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();
const SP_PIN = process.env.SP_PIN;
const ADMIN_PIN = process.env.ADMIN_PIN;
const DEMO_USER_ID = "demo";

function isSP(req: Request): boolean {
  const pin = req.headers["x-sp-pin"] as string;
  return Boolean(pin) && ((Boolean(SP_PIN) && pin === SP_PIN) || (Boolean(ADMIN_PIN) && pin === ADMIN_PIN));
}

// ──────────────────────────────────────────────────────────────
// GET /api/sp/inquiry-stats — inquiry counts for dashboard badge
// ──────────────────────────────────────────────────────────────
router.get("/sp/inquiry-stats", async (req: Request, res: Response) => {
  if (!isSP(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const [r] = (await db.execute(sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'open')        AS open_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
        COUNT(*) FILTER (WHERE status = 'resolved')    AS resolved_count,
        COUNT(*) FILTER (WHERE type  = 'emergency')    AS emergency_count,
        COUNT(*) FILTER (WHERE type  = 'message')      AS message_count,
        COUNT(*) FILTER (WHERE type  = 'email')        AS email_count,
        COUNT(*) FILTER (WHERE type  = 'call')         AS call_count,
        COUNT(*) FILTER (WHERE urgency = 'critical')   AS critical_count,
        COUNT(*) FILTER (WHERE urgency = 'urgent')     AS urgent_count,
        COUNT(*) FILTER (WHERE is_read = false)        AS unread_count,
        COUNT(*) FILTER (WHERE requires_response = true AND responded_at IS NULL) AS unresponded_count,
        COUNT(*) FILTER (WHERE was_reported = true)    AS reported_count
      FROM sp_inquiries
    `)).rows as Record<string, unknown>[];
    res.json(r ?? {});
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/sp/inquiries — list all inquiries (paginated, filtered)
// ──────────────────────────────────────────────────────────────
router.get("/sp/inquiries", async (req: Request, res: Response) => {
  if (!isSP(req)) return res.status(403).json({ error: "Forbidden" });
  const { type, status, urgency, limit = "50", offset = "0", q } = req.query as Record<string, string>;
  try {
    const rows = (await db.execute(sql`
      SELECT
        i.*,
        (SELECT COUNT(*) FROM sp_inquiry_responses r WHERE r.inquiry_id = i.id) AS response_count,
        (SELECT body FROM sp_inquiry_responses r WHERE r.inquiry_id = i.id ORDER BY r.created_at DESC LIMIT 1) AS last_response
      FROM sp_inquiries i
      WHERE 1=1
        AND (${type ?? null}    IS NULL OR i.type    = ${type ?? null})
        AND (${status ?? null}  IS NULL OR i.status  = ${status ?? null})
        AND (${urgency ?? null} IS NULL OR i.urgency = ${urgency ?? null})
        AND (${q ?? null} IS NULL OR (
              i.subject ILIKE ${'%' + (q ?? '') + '%'}
              OR i.contact_name ILIKE ${'%' + (q ?? '') + '%'}
              OR i.body ILIKE ${'%' + (q ?? '') + '%'}
            ))
      ORDER BY
        CASE i.urgency WHEN 'critical' THEN 0 WHEN 'urgent' THEN 1 ELSE 2 END,
        CASE i.status  WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
        i.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `)).rows;

    const [cnt] = (await db.execute(sql`
      SELECT COUNT(*) AS total FROM sp_inquiries
      WHERE 1=1
        AND (${type ?? null}    IS NULL OR type    = ${type ?? null})
        AND (${status ?? null}  IS NULL OR status  = ${status ?? null})
        AND (${urgency ?? null} IS NULL OR urgency = ${urgency ?? null})
    `)).rows as { total: string }[];

    res.json({ inquiries: rows, total: Number(cnt.total) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/sp/inquiries/:id — full inquiry with response thread
// ──────────────────────────────────────────────────────────────
router.get("/sp/inquiries/:id", async (req: Request, res: Response) => {
  if (!isSP(req)) return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params;
  try {
    const [inquiry] = (await db.execute(sql`
      SELECT * FROM sp_inquiries WHERE id = ${id}
    `)).rows;
    if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });

    const responses = (await db.execute(sql`
      SELECT * FROM sp_inquiry_responses WHERE inquiry_id = ${id} ORDER BY created_at ASC
    `)).rows;

    const [outcome] = (await db.execute(sql`
      SELECT * FROM sp_emergency_outcomes WHERE inquiry_id = ${id}
    `)).rows;

    await db.execute(sql`
      UPDATE sp_inquiries SET is_read = true, updated_at = NOW() WHERE id = ${id}
    `);

    res.json({ inquiry, responses, outcome: outcome ?? null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/sp/inquiries/:id/respond — official sends a reply
// ──────────────────────────────────────────────────────────────
router.post("/sp/inquiries/:id/respond", async (req: Request, res: Response) => {
  if (!isSP(req)) return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params;
  const { responderName, responderRole, responderDepartment, body, channel = "portal", isInternal = false } = req.body;
  if (!responderName || !body) return res.status(400).json({ error: "responderName and body required" });

  try {
    const now = new Date().toISOString();
    await db.execute(sql`
      INSERT INTO sp_inquiry_responses (inquiry_id, responder_name, responder_role, responder_department, channel, body, is_internal, created_at)
      VALUES (${id}, ${responderName}, ${responderRole ?? null}, ${responderDepartment ?? null}, ${channel}, ${body}, ${isInternal}, ${now}::timestamptz)
    `);

    await db.execute(sql`
      UPDATE sp_inquiries
      SET
        responded_at       = COALESCE(responded_at, ${now}::timestamptz),
        first_response_at  = COALESCE(first_response_at, ${now}::timestamptz),
        status             = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
        updated_at         = ${now}::timestamptz
      WHERE id = ${id}
    `);

    res.json({ success: true, message: "Response sent" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// PATCH /api/sp/inquiries/:id/status — update inquiry status + assignment
// ──────────────────────────────────────────────────────────────
router.patch("/sp/inquiries/:id/status", async (req: Request, res: Response) => {
  if (!isSP(req)) return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params;
  const { status, assignedTo, assignedDepartment } = req.body;
  const validStatuses = ["open","in_progress","resolved","escalated","closed"];
  if (status && !validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

  try {
    const now = new Date().toISOString();
    await db.execute(sql`
      UPDATE sp_inquiries
      SET
        status              = COALESCE(${status ?? null},            status),
        assigned_to         = COALESCE(${assignedTo ?? null},        assigned_to),
        assigned_department = COALESCE(${assignedDepartment ?? null},assigned_department),
        resolved_at         = CASE WHEN ${status ?? ''} = 'resolved' THEN ${now}::timestamptz ELSE resolved_at END,
        updated_at          = ${now}::timestamptz
      WHERE id = ${id}
    `);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/sp/inquiries — simulate an inbound inquiry (for demo)
// ──────────────────────────────────────────────────────────────
router.post("/sp/inquiries", async (req: Request, res: Response) => {
  if (!isSP(req)) return res.status(403).json({ error: "Forbidden" });
  const { type = "message", urgency = "normal", contactName, contactPhone, contactEmail,
          subject, body, geoLat, geoLng, geoAddress, organisationSlug } = req.body;
  if (!subject || !body) return res.status(400).json({ error: "subject and body required" });

  try {
    const id = `inq-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    await db.execute(sql`
      INSERT INTO sp_inquiries (
        id, type, status, urgency,
        contact_name, contact_phone, contact_email,
        organisation_slug, subject, body,
        geo_lat, geo_lng, geo_address,
        is_read, requires_response,
        created_at, updated_at
      ) VALUES (
        ${id}, ${type}, 'open', ${urgency},
        ${contactName ?? null}, ${contactPhone ?? null}, ${contactEmail ?? null},
        ${organisationSlug ?? null}, ${subject}, ${body},
        ${geoLat ?? null}, ${geoLng ?? null}, ${geoAddress ?? null},
        false, true,
        ${now}::timestamptz, ${now}::timestamptz
      )
    `);
    res.json({ success: true, id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/sp/emergency-events — list emergency panic events
// ──────────────────────────────────────────────────────────────
router.get("/sp/emergency-events", async (req: Request, res: Response) => {
  if (!isSP(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const rows = (await db.execute(sql`
      SELECT i.*, o.was_helped, o.incident_nature, o.case_opened, o.cas_number,
             o.child_safe, o.hospitalised, o.perpetrator_apprehended,
             o.response_time_minutes, o.attending_officer, o.attending_org,
             o.recorded_at, o.follow_up_required, o.follow_up_notes
      FROM sp_inquiries i
      LEFT JOIN sp_emergency_outcomes o ON o.inquiry_id = i.id
      WHERE i.type = 'emergency'
      ORDER BY i.created_at DESC
    `)).rows;
    res.json({ events: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/sp/emergency-events/:id/outcome — record outcome
// ──────────────────────────────────────────────────────────────
router.post("/sp/emergency-events/:id/outcome", async (req: Request, res: Response) => {
  if (!isSP(req)) return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params;
  const {
    wasHelped, incidentNature, incidentDescription, caseOpened, casNumber, linkedCaseId,
    attendingOfficer, attendingOfficerBadge, attendingOrg,
    responseTimeMinutes, childSafe, hospitalised, perpetratorApprehended,
    followUpRequired, followUpNotes, recordedBy,
  } = req.body;

  try {
    const now = new Date().toISOString();
    await db.execute(sql`
      INSERT INTO sp_emergency_outcomes (
        inquiry_id, was_helped, incident_nature, incident_description,
        case_opened, cas_number, linked_case_id,
        attending_officer, attending_officer_badge, attending_org,
        response_time_minutes, child_safe, hospitalised, perpetrator_apprehended,
        follow_up_required, follow_up_notes, recorded_by, recorded_at
      ) VALUES (
        ${id}, ${wasHelped ?? null}, ${incidentNature ?? null}, ${incidentDescription ?? null},
        ${caseOpened ?? false}, ${casNumber ?? null}, ${linkedCaseId ?? null},
        ${attendingOfficer ?? null}, ${attendingOfficerBadge ?? null}, ${attendingOrg ?? null},
        ${responseTimeMinutes ?? null}, ${childSafe ?? null}, ${hospitalised ?? null}, ${perpetratorApprehended ?? null},
        ${followUpRequired ?? false}, ${followUpNotes ?? null}, ${recordedBy ?? null}, ${now}::timestamptz
      )
      ON CONFLICT (inquiry_id) DO UPDATE SET
        was_helped = EXCLUDED.was_helped,
        incident_nature = EXCLUDED.incident_nature,
        incident_description = EXCLUDED.incident_description,
        case_opened = EXCLUDED.case_opened,
        cas_number = EXCLUDED.cas_number,
        child_safe = EXCLUDED.child_safe,
        hospitalised = EXCLUDED.hospitalised,
        perpetrator_apprehended = EXCLUDED.perpetrator_apprehended,
        response_time_minutes = EXCLUDED.response_time_minutes,
        attending_officer = EXCLUDED.attending_officer,
        attending_org = EXCLUDED.attending_org,
        follow_up_required = EXCLUDED.follow_up_required,
        follow_up_notes = EXCLUDED.follow_up_notes,
        recorded_by = EXCLUDED.recorded_by,
        recorded_at = ${now}::timestamptz
    `);

    await db.execute(sql`
      UPDATE sp_inquiries
      SET status = CASE WHEN ${caseOpened ?? false} THEN 'resolved' ELSE status END,
          linked_case_id = COALESCE(${linkedCaseId ?? null}, linked_case_id),
          updated_at = ${now}::timestamptz
      WHERE id = ${id}
    `);

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/sp/stats — dashboard summary statistics
// ──────────────────────────────────────────────────────────────
router.get("/sp/stats", async (_req: Request, res: Response) => {
  try {
    const [totals] = (await db.execute(sql`
      SELECT
        COUNT(*)                                                   AS total_cases,
        COUNT(*) FILTER (WHERE stage != 'closed')                 AS open_cases,
        COUNT(*) FILTER (WHERE stage = 'closed')                  AS closed_cases,
        COUNT(*) FILTER (WHERE stage = 'incident')                AS in_incident,
        COUNT(*) FILTER (WHERE stage = 'case_opened')             AS in_case_opened,
        COUNT(*) FILTER (WHERE stage = 'investigation')           AS in_investigation,
        COUNT(*) FILTER (WHERE stage = 'court')                   AS in_court,
        COUNT(*) FILTER (WHERE stage = 'sentencing')              AS in_sentencing
      FROM cases
      WHERE user_id = ${DEMO_USER_ID}
    `)).rows as Record<string, unknown>[];

    const [stepStats] = (await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE te.is_delayed = true)    AS delayed_steps,
        COUNT(*) FILTER (WHERE te.is_failed  = true)    AS failed_steps,
        COUNT(*) FILTER (WHERE te.status = 'in_progress') AS active_steps,
        COUNT(*) FILTER (WHERE te.status = 'completed')   AS completed_steps
      FROM case_timeline_events te
      JOIN cases c ON c.id = te.case_id
      WHERE c.user_id = ${DEMO_USER_ID}
    `)).rows as Record<string, unknown>[];

    const [docStats] = (await db.execute(sql`
      SELECT COUNT(*) AS total_documents
      FROM case_documents cd
      JOIN cases c ON c.id = cd.case_id
      WHERE c.user_id = ${DEMO_USER_ID}
    `)).rows as Record<string, unknown>[];

    const [msgStats] = (await db.execute(sql`
      SELECT COUNT(*) AS total_messages
      FROM case_messages cm
      JOIN cases c ON c.id = cm.case_id
      WHERE c.user_id = ${DEMO_USER_ID}
    `)).rows as Record<string, unknown>[];

    res.json({
      ...(totals   ?? {}),
      ...(stepStats ?? {}),
      ...(docStats  ?? {}),
      ...(msgStats  ?? {}),
    });
  } catch (e: any) {
    console.error("SP stats error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/sp/cases/:caseId/update — log a step update
// ──────────────────────────────────────────────────────────────
router.post("/sp/cases/:caseId/update", async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const {
    stepId, status, notes, actorName, actorPhone, actorBadge,
    actorOrg, delayReason, pendingActions,
  } = req.body as {
    stepId: string;
    status: string;
    notes?: string;
    actorName?: string;
    actorPhone?: string;
    actorBadge?: string;
    actorOrg?: string;
    delayReason?: string;
    pendingActions?: string[];
  };

  if (!stepId || !status) {
    return res.status(400).json({ error: "stepId and status are required" });
  }

  const validStatuses = ["pending", "in_progress", "completed", "failed", "skipped"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const now = new Date().toISOString();

    await db.execute(sql`
      UPDATE case_timeline_events
      SET
        status        = ${status},
        official_notes = COALESCE(${notes ?? null},       official_notes),
        actor_name    = COALESCE(${actorName ?? null},    actor_name),
        actor_phone   = COALESCE(${actorPhone ?? null},   actor_phone),
        actor_badge   = COALESCE(${actorBadge ?? null},   actor_badge),
        actor_label   = COALESCE(${actorOrg ?? null},     actor_label),
        delay_reason  = COALESCE(${delayReason ?? null},  delay_reason),
        pending_actions = COALESCE(${pendingActions ? JSON.stringify(pendingActions) : null}::jsonb, pending_actions),
        started_at    = CASE WHEN ${status} = 'in_progress' AND started_at IS NULL
                             THEN ${now}::timestamptz ELSE started_at END,
        completed_at  = CASE WHEN ${status} = 'completed'
                             THEN ${now}::timestamptz ELSE completed_at END,
        updated_at    = ${now}::timestamptz
      WHERE id = ${stepId}
    `);

    res.json({ success: true, message: "Step updated", stepId, status });
  } catch (e: any) {
    console.error("SP step update error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/sp/accountability — report non-compliance
// ──────────────────────────────────────────────────────────────
router.post("/sp/accountability", async (req: Request, res: Response) => {
  const {
    officialName, department, caseRef, incidentType,
    description, evidenceRef, anonymous, reporterName, reporterContact,
  } = req.body;

  if (!department || !incidentType || !description) {
    return res.status(400).json({ error: "department, incidentType, and description are required" });
  }

  const refNum = `ACC-${Date.now().toString(36).toUpperCase()}`;
  console.log("[M-TETO Accountability Report]", JSON.stringify({
    refNum, officialName, department, caseRef, incidentType, description,
    evidenceRef, anonymous, reporterName, reporterContact,
    submittedAt: new Date().toISOString(),
  }, null, 2));

  res.json({ success: true, refNum, message: "Accountability report submitted. It will be reviewed by the oversight team." });
});

// ──────────────────────────────────────────────────────────────
// POST /api/sp/whistleblow — whistleblower report
// ──────────────────────────────────────────────────────────────
router.post("/sp/whistleblow", async (req: Request, res: Response) => {
  const {
    corruptionType, bodyInvolved, description, location,
    dateOfIncident, evidenceDescription, anonymous, reporterName, safeContact,
  } = req.body;

  if (!corruptionType || !bodyInvolved || !description) {
    return res.status(400).json({ error: "corruptionType, bodyInvolved, and description are required" });
  }

  const refNum = `WB-${Date.now().toString(36).toUpperCase()}`;
  console.log("[M-TETO Whistleblower Report]", JSON.stringify({
    refNum, corruptionType, bodyInvolved, description, location,
    dateOfIncident, evidenceDescription, anonymous, reporterName, safeContact,
    submittedAt: new Date().toISOString(),
    protectedUnder: "Protected Disclosures Act 26 of 2000",
  }, null, 2));

  res.json({
    success: true,
    refNum,
    message: "Whistleblower report securely submitted. You are protected under the Protected Disclosures Act 26 of 2000.",
    protectedUnder: "Protected Disclosures Act 26 of 2000",
  });
});

export default router;
