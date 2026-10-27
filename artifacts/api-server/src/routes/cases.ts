import { Router, type IRouter, type Request, type Response } from "express";
import { db, casesTable, caseHistoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListCasesResponse,
  CreateCaseBody,
  GetCaseResponse,
  UpdateCaseBody,
  UpdateCaseResponse,
  DeleteCaseResponse,
  UpdateChecklistBody,
  UpdateChecklistResponse,
  GetCaseHistoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.get("/cases", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const cases = await db
    .select()
    .from(casesTable)
    .where(eq(casesTable.userId, req.user!.id));
  res.json(ListCasesResponse.parse({ cases }));
});

router.post("/cases", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const parsed = CreateCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [newCase] = await db
    .insert(casesTable)
    .values({
      userId: req.user!.id,
      title: parsed.data.title,
      incidentType: parsed.data.incidentType ?? null,
    })
    .returning();
  res.status(201).json({ case: newCase });
});

router.get("/cases/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;
  const [c] = await db
    .select()
    .from(casesTable)
    .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user!.id)));
  if (!c) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  res.json(GetCaseResponse.parse({ case: c }));
});

router.patch("/cases/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;
  const parsed = UpdateCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [existing] = await db
    .select()
    .from(casesTable)
    .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user!.id)));
  if (!existing) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  const updates = parsed.data;
  const historyEntries: { caseId: string; field: string; oldValue: string | null; newValue: string | null }[] = [];

  for (const [field, newVal] of Object.entries(updates)) {
    const oldVal = (existing as Record<string, unknown>)[field];
    const oldStr = oldVal != null ? String(oldVal) : null;
    const newStr = newVal != null ? String(newVal) : null;
    if (oldStr !== newStr) {
      historyEntries.push({ caseId: id, field, oldValue: oldStr, newValue: newStr });
    }
  }

  const [updated] = await db
    .update(casesTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user!.id)))
    .returning();

  if (historyEntries.length > 0) {
    await db.insert(caseHistoryTable).values(historyEntries);
  }

  res.json(UpdateCaseResponse.parse({ case: updated }));
});

router.delete("/cases/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;
  const [deleted] = await db
    .delete(casesTable)
    .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user!.id)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  res.json(DeleteCaseResponse.parse({ success: true }));
});

router.patch("/cases/:id/checklist", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;
  const parsed = UpdateChecklistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [existing] = await db
    .select()
    .from(casesTable)
    .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user!.id)));
  if (!existing) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  const [updated] = await db
    .update(casesTable)
    .set({ checklistData: parsed.data.checklistData, updatedAt: new Date() })
    .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user!.id)))
    .returning();

  res.json(UpdateChecklistResponse.parse({ case: updated }));
});

router.get("/cases/:id/history", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;

  const [c] = await db
    .select()
    .from(casesTable)
    .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user!.id)));
  if (!c) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  const history = await db
    .select()
    .from(caseHistoryTable)
    .where(eq(caseHistoryTable.caseId, id));

  res.json(GetCaseHistoryResponse.parse({ history }));
});

export default router;
