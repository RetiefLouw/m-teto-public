import { Router } from "express";
import { db } from "@workspace/db";
import { justiceJourneysTable, journeyStepLogsTable } from "@workspace/db";
import { eq, desc, and, lt, gte } from "drizzle-orm";

const router = Router();

// ─── Create or get a journey ────────────────────────────────────────────────

router.post("/justice/journeys", async (req, res) => {
  try {
    const { sessionId, violationContext, violationTypeId, pathway, gradeLevel, caseId } = req.body as {
      sessionId: string;
      violationContext: string;
      violationTypeId: string;
      pathway: string;
      gradeLevel?: string;
      caseId?: string;
    };

    if (!sessionId || !violationContext || !violationTypeId) {
      return res.status(400).json({ error: "sessionId, violationContext, and violationTypeId are required" });
    }

    const userId = (req as any).user?.id;

    const [journey] = await db
      .insert(justiceJourneysTable)
      .values({
        sessionId,
        userId,
        violationContext,
        violationTypeId,
        pathway: pathway || "criminal",
        gradeLevel,
        caseId: caseId || null,
        journeyStartDate: new Date(),
      })
      .returning();

    return res.json({ journey });
  } catch (err) {
    console.error("POST /justice/journeys error:", err);
    return res.status(500).json({ error: "Failed to create journey" });
  }
});

// ─── Get a specific journey ─────────────────────────────────────────────────

router.get("/justice/journeys/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [journey] = await db
      .select()
      .from(justiceJourneysTable)
      .where(eq(justiceJourneysTable.id, id));

    if (!journey) {
      return res.status(404).json({ error: "Journey not found" });
    }

    const stepLogs = await db
      .select()
      .from(journeyStepLogsTable)
      .where(eq(journeyStepLogsTable.journeyId, id))
      .orderBy(journeyStepLogsTable.createdAt);

    return res.json({ journey, stepLogs });
  } catch (err) {
    console.error("GET /justice/journeys/:id error:", err);
    return res.status(500).json({ error: "Failed to get journey" });
  }
});

// ─── List journeys for a session ────────────────────────────────────────────

router.get("/justice/journeys", async (req, res) => {
  try {
    const { sessionId, caseId } = req.query as { sessionId?: string; caseId?: string };
    const userId = (req as any).user?.id;

    let query = db.select().from(justiceJourneysTable).orderBy(desc(justiceJourneysTable.createdAt));

    const journeys = await (sessionId
      ? db.select().from(justiceJourneysTable).where(eq(justiceJourneysTable.sessionId, sessionId)).orderBy(desc(justiceJourneysTable.createdAt))
      : caseId
      ? db.select().from(justiceJourneysTable).where(eq(justiceJourneysTable.caseId, caseId)).orderBy(desc(justiceJourneysTable.createdAt))
      : query);

    return res.json({ journeys });
  } catch (err) {
    console.error("GET /justice/journeys error:", err);
    return res.status(500).json({ error: "Failed to list journeys" });
  }
});

// ─── Update current step ────────────────────────────────────────────────────

router.patch("/justice/journeys/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStepId, completedStepIds, stepStartDates, caseId } = req.body as {
      currentStepId?: string;
      completedStepIds?: string[];
      stepStartDates?: Record<string, string>;
      caseId?: string;
    };

    const updateData: Record<string, any> = {};
    if (currentStepId !== undefined) updateData.currentStepId = currentStepId;
    if (completedStepIds !== undefined) updateData.completedStepIds = completedStepIds;
    if (stepStartDates !== undefined) updateData.stepStartDates = stepStartDates;
    if (caseId !== undefined) updateData.caseId = caseId;

    const [journey] = await db
      .update(justiceJourneysTable)
      .set(updateData)
      .where(eq(justiceJourneysTable.id, id))
      .returning();

    return res.json({ journey });
  } catch (err) {
    console.error("PATCH /justice/journeys/:id error:", err);
    return res.status(500).json({ error: "Failed to update journey" });
  }
});

// ─── Update / create a step log ─────────────────────────────────────────────

router.patch("/justice/journeys/:id/steps/:stepId", async (req, res) => {
  try {
    const { id: journeyId, stepId } = req.params;
    const { status, notes, dueDate, completedAt } = req.body as {
      status?: string;
      notes?: string;
      dueDate?: string;
      completedAt?: string;
    };

    const existing = await db
      .select()
      .from(journeyStepLogsTable)
      .where(
        and(
          eq(journeyStepLogsTable.journeyId, journeyId),
          eq(journeyStepLogsTable.stepId, stepId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const updateData: Record<string, any> = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (completedAt) updateData.completedAt = new Date(completedAt);

      const [updated] = await db
        .update(journeyStepLogsTable)
        .set(updateData)
        .where(eq(journeyStepLogsTable.id, existing[0].id))
        .returning();

      return res.json({ stepLog: updated });
    } else {
      const [created] = await db
        .insert(journeyStepLogsTable)
        .values({
          journeyId,
          stepId,
          status: status || "in_progress",
          notes,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          completedAt: completedAt ? new Date(completedAt) : undefined,
        })
        .returning();

      return res.json({ stepLog: created });
    }
  } catch (err) {
    console.error("PATCH /justice/journeys/:id/steps/:stepId error:", err);
    return res.status(500).json({ error: "Failed to update step" });
  }
});

// ─── Admin: Justice Timelines ────────────────────────────────────────────────

router.get("/admin/justice-timelines", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"];
    if (pin !== "") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const journeys = await db
      .select()
      .from(justiceJourneysTable)
      .orderBy(desc(justiceJourneysTable.createdAt));

    const stepLogs = await db
      .select()
      .from(journeyStepLogsTable)
      .orderBy(journeyStepLogsTable.journeyId, journeyStepLogsTable.createdAt);

    // Build per-journey summary with deadline flags
    const now = new Date();
    const journeySummaries = journeys.map((j) => {
      const jStepLogs = stepLogs.filter((sl) => sl.journeyId === j.id);

      const overdueSteps = jStepLogs.filter(
        (sl) => sl.status !== "completed" && sl.dueDate && sl.dueDate < now
      );
      const dueSoonSteps = jStepLogs.filter((sl) => {
        if (sl.status === "completed" || !sl.dueDate) return false;
        const diffDays = (sl.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 3;
      });
      const completedSteps = jStepLogs.filter((sl) => sl.status === "completed");

      let flag: "red" | "amber" | "green" | "grey" = "grey";
      if (overdueSteps.length > 0) flag = "red";
      else if (dueSoonSteps.length > 0) flag = "amber";
      else if (completedSteps.length > 0) flag = "green";

      return {
        ...j,
        stepLogs: jStepLogs,
        overdueCount: overdueSteps.length,
        dueSoonCount: dueSoonSteps.length,
        completedCount: completedSteps.length,
        flag,
      };
    });

    const summary = {
      total: journeys.length,
      redFlag: journeySummaries.filter((j) => j.flag === "red").length,
      amberFlag: journeySummaries.filter((j) => j.flag === "amber").length,
      greenFlag: journeySummaries.filter((j) => j.flag === "green").length,
    };

    return res.json({ journeys: journeySummaries, summary });
  } catch (err) {
    console.error("GET /admin/justice-timelines error:", err);
    return res.status(500).json({ error: "Failed to get justice timelines" });
  }
});

export default router;
