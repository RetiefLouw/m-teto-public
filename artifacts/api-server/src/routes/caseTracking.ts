/**
 * Case Tracking API Routes — SA Justice Value Chain
 * Handles timeline events, escalations, documents, messages, and demo cases
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { db, casesTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  caseTimelineEventsTable,
  caseEscalationsTable,
  caseDocumentsTable,
  caseMessagesTable,
} from "@workspace/db";
import { SA_JUSTICE_STEPS, ESCALATION_BODIES } from "@workspace/justice-timelines";

const router: IRouter = Router();
const DEMO_USER_ID = "demo";
const ADMIN_PIN = process.env.ADMIN_PIN;

function isAdmin(req: Request): boolean {
  return Boolean(ADMIN_PIN) && req.headers["x-admin-pin"] === ADMIN_PIN;
}

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// ──────────────────────────────────────────────────────────────
// DEMO CASES — public, no auth needed
// ──────────────────────────────────────────────────────────────

router.get("/demo-cases", async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) ?? "";
    const incidentType = (req.query.type as string) ?? "";
    const stage = (req.query.stage as string) ?? "";
    const flagOnly = req.query.flagged === "true";

    let whereClause = `WHERE c.user_id = '${DEMO_USER_ID}'`;
    if (search) whereClause += ` AND c.title ILIKE '%${search.replace(/'/g, "''")}%'`;
    if (incidentType) whereClause += ` AND c.incident_type = '${incidentType.replace(/'/g, "''")}'`;
    if (stage) whereClause += ` AND c.stage = '${stage.replace(/'/g, "''")}'`;

    const cases = await db.execute(sql`
      SELECT
        c.*,
        COUNT(DISTINCT te.id) FILTER (WHERE te.is_delayed = true) AS delayed_steps,
        COUNT(DISTINCT te.id) FILTER (WHERE te.is_failed = true) AS failed_steps,
        COUNT(DISTINCT te.id) FILTER (WHERE te.status = 'completed') AS completed_steps,
        COUNT(DISTINCT te.id) FILTER (WHERE te.status = 'in_progress') AS in_progress_steps,
        COUNT(DISTINCT e.id) AS escalation_count,
        MAX(te.actor_name) FILTER (WHERE te.status = 'in_progress') AS current_actor_name,
        MAX(te.actor_label) FILTER (WHERE te.status = 'in_progress') AS current_actor_label,
        MAX(te.due_at) FILTER (WHERE te.status = 'in_progress') AS current_deadline,
        COUNT(DISTINCT m.id) FILTER (WHERE m.is_read = false AND m.sender_role != 'complainant') AS unread_messages
      FROM cases c
      LEFT JOIN case_timeline_events te ON te.case_id = c.id
      LEFT JOIN case_escalations e ON e.case_id = c.id
      LEFT JOIN case_messages m ON m.case_id = c.id
      ${sql.raw(whereClause)}
      GROUP BY c.id
      ${flagOnly ? sql.raw("HAVING COUNT(DISTINCT te.id) FILTER (WHERE te.is_delayed = true) > 0 OR COUNT(DISTINCT e.id) > 0") : sql.raw("")}
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const total = await db.execute(sql`
      SELECT COUNT(*) as cnt FROM cases c ${sql.raw(whereClause)}
    `);

    return res.json({
      cases: cases.rows,
      total: Number((total.rows[0] as { cnt: string }).cnt),
      page,
      limit,
    });
  } catch (err) {
    console.error("Demo cases error:", err);
    return res.status(500).json({ error: "Failed to fetch demo cases" });
  }
});

router.get("/demo-cases/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caseRow = await db.execute(sql`
      SELECT * FROM cases WHERE id = ${id} AND user_id = ${DEMO_USER_ID}
    `);
    if (!caseRow.rows.length) return res.status(404).json({ error: "Case not found" });
    return res.json({ case: caseRow.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch case" });
  }
});

// ──────────────────────────────────────────────────────────────
// TIMELINE EVENTS
// ──────────────────────────────────────────────────────────────

router.get("/cases/:id/timeline", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isDemo = req.query.demo === "true";

    // Verify ownership (or demo)
    if (!isDemo) {
      if (!requireAuth(req, res)) return;
      const [c] = await db.select({ id: casesTable.id })
        .from(casesTable)
        .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user!.id)));
      if (!c) return res.status(404).json({ error: "Case not found" });
    } else {
      const r = await db.execute(sql`SELECT id FROM cases WHERE id = ${id} AND user_id = ${DEMO_USER_ID}`);
      if (!r.rows.length) return res.status(404).json({ error: "Case not found" });
    }

    const events = await db.select()
      .from(caseTimelineEventsTable)
      .where(eq(caseTimelineEventsTable.caseId, id))
      .orderBy(caseTimelineEventsTable.createdAt);

    // Merge with the canonical SA steps to show all steps (including ones not yet started)
    const eventMap = new Map(events.map(e => [e.stepId, e]));
    const merged = SA_JUSTICE_STEPS.map(step => {
      const existing = eventMap.get(step.id);
      return {
        step,
        event: existing ?? null,
        status: existing?.status ?? "not_started",
        isDelayed: existing?.isDelayed ?? false,
        isFailed: existing?.isFailed ?? false,
        delayHours: existing?.delayHours ?? null,
        delayReason: existing?.delayReason ?? null,
        completedAt: existing?.completedAt ?? null,
        dueAt: existing?.dueAt ?? null,
        actorName: existing?.actorName ?? null,
        officialNotes: existing?.officialNotes ?? null,
        pendingActions: existing?.pendingActions ?? [],
      };
    });

    return res.json({ timeline: merged, events });
  } catch (err) {
    console.error("Timeline fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch timeline" });
  }
});

// Official or admin updates a timeline step
router.post("/cases/:id/timeline/:stepId", async (req: Request, res: Response) => {
  try {
    const { id, stepId } = req.params;
    const {
      status, officialNotes, actorName, actorPhone, actorBadge,
      delayReason, pendingActions,
    } = req.body;
    const isAdminReq = isAdmin(req);
    const isDemo = req.query.demo === "true";

    if (!isAdminReq && !req.isAuthenticated() && !isDemo) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const step = SA_JUSTICE_STEPS.find(s => s.id === stepId);
    if (!step) return res.status(400).json({ error: "Invalid step ID" });

    const updaterName = actorName ?? (isAdminReq ? "Admin" : (req.user as any)?.name ?? "Official");
    const updaterRole = isAdminReq ? "admin" : "official";

    // Compute delay if applicable
    const existing = await db.select()
      .from(caseTimelineEventsTable)
      .where(and(
        eq(caseTimelineEventsTable.caseId, id),
        eq(caseTimelineEventsTable.stepId, stepId)
      ))
      .limit(1);

    const incidentRow = await db.execute(sql`SELECT incident_date FROM cases WHERE id = ${id}`);
    const incidentDate = incidentRow.rows[0] ? new Date((incidentRow.rows[0] as any).incident_date) : new Date();

    let dueAt: Date | null = null;
    let isDelayed = false;
    let delayHours: number | null = null;
    let isFailed = status === "failed";

    if (step.deadlineHours) {
      dueAt = new Date(incidentDate.getTime() + step.deadlineHours * 3600000);
      const now = new Date();
      if (status === "completed" || status === "in_progress") {
        if (now > dueAt) {
          isDelayed = true;
          delayHours = Math.round((now.getTime() - dueAt.getTime()) / 3600000);
        }
      }
    }

    const completedAt = status === "completed" ? new Date() : null;

    if (existing.length) {
      await db.update(caseTimelineEventsTable)
        .set({
          status: status ?? existing[0].status,
          officialNotes: officialNotes ?? existing[0].officialNotes,
          actorName: actorName ?? existing[0].actorName,
          actorPhone: actorPhone ?? existing[0].actorPhone,
          actorBadge: actorBadge ?? existing[0].actorBadge,
          delayReason: delayReason ?? existing[0].delayReason,
          pendingActions: pendingActions ?? existing[0].pendingActions,
          isDelayed: isDelayed || (existing[0].isDelayed ?? false),
          isFailed,
          delayHours: delayHours ?? existing[0].delayHours,
          completedAt: completedAt ?? existing[0].completedAt,
          dueAt: dueAt ?? existing[0].dueAt,
          lastUpdatedBy: updaterName,
          lastUpdatedByRole: updaterRole,
          updatedAt: new Date(),
        })
        .where(and(
          eq(caseTimelineEventsTable.caseId, id),
          eq(caseTimelineEventsTable.stepId, stepId)
        ));
    } else {
      await db.insert(caseTimelineEventsTable).values({
        caseId: id,
        stepId,
        stepLabel: step.label,
        phase: step.phase,
        actorRole: step.actorRole,
        actorLabel: step.actorLabel,
        actorName: updaterName,
        actorPhone,
        actorBadge,
        status: status ?? "in_progress",
        dueAt,
        completedAt,
        officialNotes,
        pendingActions: pendingActions ?? [],
        delayReason,
        delayHours,
        isDelayed,
        isFailed,
        lastUpdatedBy: updaterName,
        lastUpdatedByRole: updaterRole,
      });
    }

    // Auto-post a system message when step is updated
    if (status && status !== "pending") {
      const msgBody = status === "completed"
        ? `Step "${step.label}" has been marked as completed by ${updaterName} (${step.actorLabel}). ${officialNotes ?? ""}`
        : status === "failed"
        ? `⚠️ ALERT: Step "${step.label}" has been marked as FAILED. Reason: ${delayReason ?? "No reason provided"}. This may require escalation.`
        : `Step "${step.label}" has been updated to: ${status}. Official notes: ${officialNotes ?? "None"}.`;

      await db.insert(caseMessagesTable).values({
        caseId: id,
        senderRole: "official",
        senderName: updaterName,
        senderTitle: step.actorLabel,
        messageType: status === "failed" ? "alert" : "update",
        subject: `Step Update: ${step.label}`,
        body: msgBody,
        stepId,
        isUrgent: status === "failed" || isDelayed,
      });
    }

    return res.json({ ok: true, isDelayed, delayHours });
  } catch (err) {
    console.error("Timeline update error:", err);
    return res.status(500).json({ error: "Failed to update timeline" });
  }
});

// ──────────────────────────────────────────────────────────────
// FLAG / RED FLAG
// ──────────────────────────────────────────────────────────────

router.post("/cases/:id/flag", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stepId, reason, flaggedBy } = req.body;
    const isDemo = req.query.demo === "true";

    if (!isDemo && !req.isAuthenticated() && !isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const step = SA_JUSTICE_STEPS.find(s => s.id === stepId);
    if (!step) return res.status(400).json({ error: "Invalid step" });

    await db.update(caseTimelineEventsTable)
      .set({
        isFailed: true,
        isDelayed: true,
        delayReason: reason,
        status: "escalated",
        lastUpdatedBy: flaggedBy ?? "Complainant",
        lastUpdatedByRole: "complainant",
        updatedAt: new Date(),
      })
      .where(and(
        eq(caseTimelineEventsTable.caseId, id),
        eq(caseTimelineEventsTable.stepId, stepId)
      ));

    // Post a flag message
    await db.insert(caseMessagesTable).values({
      caseId: id,
      senderRole: "complainant",
      senderName: flaggedBy ?? "Complainant / Family",
      senderTitle: "Case Owner",
      messageType: "alert",
      subject: `🚩 Red Flag Raised: ${step.label}`,
      body: `A red flag has been raised for step "${step.label}". Reason: ${reason}. The responsible official (${step.actorLabel}) has been notified. This has been documented. If not resolved within the required timeframe, this will be escalated to ${ESCALATION_BODIES[step.escalateTo]?.label ?? "the relevant authority"}.`,
      stepId,
      isUrgent: true,
    });

    return res.json({ ok: true, escalateTo: ESCALATION_BODIES[step.escalateTo] });
  } catch (err) {
    console.error("Flag error:", err);
    return res.status(500).json({ error: "Failed to flag step" });
  }
});

// ──────────────────────────────────────────────────────────────
// ESCALATIONS
// ──────────────────────────────────────────────────────────────

router.get("/cases/:id/escalations", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isDemo = req.query.demo === "true";
    if (!isDemo && !req.isAuthenticated() && !isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const escalations = await db.select()
      .from(caseEscalationsTable)
      .where(eq(caseEscalationsTable.caseId, id))
      .orderBy(desc(caseEscalationsTable.createdAt));

    return res.json({ escalations });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch escalations" });
  }
});

router.post("/cases/:id/escalate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      escalationBody, failedStepId, failedStepLabel,
      reason, submittedBy,
    } = req.body;
    const isDemo = req.query.demo === "true";

    if (!isDemo && !req.isAuthenticated() && !isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = ESCALATION_BODIES[escalationBody as keyof typeof ESCALATION_BODIES];
    if (!body) return res.status(400).json({ error: "Invalid escalation body" });

    const [esc] = await db.insert(caseEscalationsTable).values({
      caseId: id,
      escalationBody,
      escalationBodyLabel: body.label,
      escalationLevel: body.level,
      failedStepId,
      failedStepLabel,
      reason,
      status: "submitted",
      submittedBy: submittedBy ?? "Complainant / Family",
      submittedByRole: "complainant",
      followUpAt: new Date(Date.now() + 7 * 24 * 3600000), // Follow up in 7 days
    }).returning();

    // Post escalation notice message
    await db.insert(caseMessagesTable).values({
      caseId: id,
      senderRole: "system",
      senderName: "M-TETO Escalation System",
      senderTitle: "Automated Escalation",
      messageType: "escalation_notice",
      subject: `Escalation Submitted: ${body.label}`,
      body: `Your escalation has been formally submitted to the ${body.label}. Reference: ESC-${esc.id.substring(0, 8).toUpperCase()}. Contact them directly: ${body.phone}${body.email ? ` | ${body.email}` : ""}${body.website ? ` | ${body.website}` : ""}. This escalation is documented and will be followed up in 7 days if no response is received. All evidence has been logged in the system.`,
      stepId: failedStepId,
      isUrgent: true,
    });

    return res.json({ ok: true, escalation: esc, body });
  } catch (err) {
    console.error("Escalation error:", err);
    return res.status(500).json({ error: "Failed to submit escalation" });
  }
});

// Admin responds to an escalation
router.patch("/cases/:id/escalations/:escId", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
    const { id, escId } = req.params;
    const { status, response, referenceNumber } = req.body;

    await db.update(caseEscalationsTable)
      .set({
        status: status ?? undefined,
        response: response ?? undefined,
        referenceNumber: referenceNumber ?? undefined,
        respondedAt: status === "resolved" || status === "acknowledged" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(and(
        eq(caseEscalationsTable.id, escId),
        eq(caseEscalationsTable.caseId, id)
      ));

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update escalation" });
  }
});

// ──────────────────────────────────────────────────────────────
// DOCUMENTS (Photos: docket, J88, statement, badge, evidence)
// ──────────────────────────────────────────────────────────────

router.get("/cases/:id/documents", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isDemo = req.query.demo === "true";
    if (!isDemo && !req.isAuthenticated() && !isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const docs = await db.select({
      id: caseDocumentsTable.id,
      caseId: caseDocumentsTable.caseId,
      documentType: caseDocumentsTable.documentType,
      documentLabel: caseDocumentsTable.documentLabel,
      fileName: caseDocumentsTable.fileName,
      fileType: caseDocumentsTable.fileType,
      fileSizeBytes: caseDocumentsTable.fileSizeBytes,
      description: caseDocumentsTable.description,
      stepId: caseDocumentsTable.stepId,
      uploadedBy: caseDocumentsTable.uploadedBy,
      uploadedByRole: caseDocumentsTable.uploadedByRole,
      isVerified: caseDocumentsTable.isVerified,
      verifiedBy: caseDocumentsTable.verifiedBy,
      createdAt: caseDocumentsTable.createdAt,
    })
      .from(caseDocumentsTable)
      .where(eq(caseDocumentsTable.caseId, id))
      .orderBy(desc(caseDocumentsTable.createdAt));

    return res.json({ documents: docs });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.get("/cases/:id/documents/:docId/file", async (req: Request, res: Response) => {
  try {
    const { id, docId } = req.params;
    const isDemo = req.query.demo === "true";
    if (!isDemo && !req.isAuthenticated() && !isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [doc] = await db.select()
      .from(caseDocumentsTable)
      .where(and(
        eq(caseDocumentsTable.id, docId),
        eq(caseDocumentsTable.caseId, id)
      ))
      .limit(1);

    if (!doc) return res.status(404).json({ error: "Document not found" });

    return res.json({
      fileData: doc.fileData,
      fileType: doc.fileType,
      fileName: doc.fileName,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch document file" });
  }
});

router.post("/cases/:id/documents", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      documentType, documentLabel, fileName, fileType,
      fileSizeBytes, fileData, description, stepId, uploadedBy,
    } = req.body;
    const isDemo = req.query.demo === "true";
    if (!isDemo && !req.isAuthenticated() && !isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!documentType || !fileData) {
      return res.status(400).json({ error: "documentType and fileData are required" });
    }

    const [doc] = await db.insert(caseDocumentsTable).values({
      caseId: id,
      documentType,
      documentLabel: documentLabel ?? documentType,
      fileName: fileName ?? "upload",
      fileType: fileType ?? "image/jpeg",
      fileSizeBytes: fileSizeBytes ?? 0,
      fileData,
      description,
      stepId,
      uploadedBy: uploadedBy ?? (req.user as any)?.name ?? "Complainant",
      uploadedByRole: isAdmin(req) ? "admin" : "complainant",
    }).returning({
      id: caseDocumentsTable.id,
      documentType: caseDocumentsTable.documentType,
      documentLabel: caseDocumentsTable.documentLabel,
      fileName: caseDocumentsTable.fileName,
      createdAt: caseDocumentsTable.createdAt,
    });

    // Post a system message about the upload
    await db.insert(caseMessagesTable).values({
      caseId: id,
      senderRole: "system",
      senderName: "M-TETO Document System",
      senderTitle: "Document Upload",
      messageType: "update",
      subject: `Document Uploaded: ${documentLabel ?? documentType}`,
      body: `A document of type "${documentLabel ?? documentType}" has been uploaded and securely stored. This evidence is now part of your official case record. File: ${fileName ?? "document"}.`,
      stepId,
    });

    return res.json({ ok: true, document: doc });
  } catch (err) {
    console.error("Document upload error:", err);
    return res.status(500).json({ error: "Failed to upload document" });
  }
});

// ──────────────────────────────────────────────────────────────
// MESSAGES
// ──────────────────────────────────────────────────────────────

router.get("/cases/:id/messages", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isDemo = req.query.demo === "true";
    if (!isDemo && !req.isAuthenticated() && !isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const msgs = await db.select()
      .from(caseMessagesTable)
      .where(eq(caseMessagesTable.caseId, id))
      .orderBy(caseMessagesTable.createdAt);

    // Mark as read
    if (!isAdmin(req)) {
      await db.update(caseMessagesTable)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
          eq(caseMessagesTable.caseId, id),
          eq(caseMessagesTable.senderRole, "official")
        ));
    }

    return res.json({ messages: msgs });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/cases/:id/messages", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { senderRole, senderName, senderTitle, messageType, subject, body, stepId, isUrgent } = req.body;
    const isDemo = req.query.demo === "true";
    if (!isDemo && !req.isAuthenticated() && !isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!body) return res.status(400).json({ error: "Message body is required" });

    const role = isAdmin(req) ? "official" : (senderRole ?? "complainant");
    const name = senderName ?? (isAdmin(req) ? "Admin / Official" : (req.user as any)?.name ?? "Complainant");

    const [msg] = await db.insert(caseMessagesTable).values({
      caseId: id,
      senderRole: role,
      senderName: name,
      senderTitle: senderTitle ?? "",
      messageType: messageType ?? "update",
      subject: subject ?? "Message",
      body,
      stepId: stepId ?? null,
      isUrgent: isUrgent ?? false,
    }).returning();

    return res.json({ ok: true, message: msg });
  } catch (err) {
    console.error("Message error:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

// ──────────────────────────────────────────────────────────────
// ADMIN — All flagged cases
// ──────────────────────────────────────────────────────────────

router.get("/admin/case-tracking", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });

    const cases = await db.execute(sql`
      SELECT
        c.id, c.title, c.incident_type, c.stage, c.cas_number,
        c.io_name, c.court_date, c.created_at, c.user_id,
        COUNT(DISTINCT te.id) FILTER (WHERE te.is_delayed = true) AS delayed_steps,
        COUNT(DISTINCT te.id) FILTER (WHERE te.is_failed = true) AS failed_steps,
        COUNT(DISTINCT e.id) AS escalation_count,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'submitted') AS pending_escalations,
        COUNT(DISTINCT m.id) FILTER (WHERE m.is_read = false) AS unread_messages,
        MAX(te.step_label) FILTER (WHERE te.status = 'in_progress') AS current_step_label,
        MAX(te.actor_label) FILTER (WHERE te.status = 'in_progress') AS current_actor_label
      FROM cases c
      LEFT JOIN case_timeline_events te ON te.case_id = c.id
      LEFT JOIN case_escalations e ON e.case_id = c.id
      LEFT JOIN case_messages m ON m.case_id = c.id
      GROUP BY c.id
      ORDER BY failed_steps DESC, delayed_steps DESC, c.created_at DESC
      LIMIT 500
    `);

    return res.json({ cases: cases.rows });
  } catch (err) {
    console.error("Admin case tracking error:", err);
    return res.status(500).json({ error: "Failed to fetch admin case tracking" });
  }
});

// SA Justice step reference (for admin portal use)
router.get("/justice-steps", async (_req: Request, res: Response) => {
  return res.json({ steps: SA_JUSTICE_STEPS, escalationBodies: ESCALATION_BODIES });
});

export default router;
