import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, pointTransactionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

const POINTS_MAP: Record<string, number> = {
  read_article: 5,
  wrote_review: 15,
  quiz_correct: 10,
  checklist_item: 3,
  onboarding: 20,
};

router.get("/points", async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db
    .select({ totalPoints: usersTable.totalPoints })
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));

  const transactions = await db
    .select()
    .from(pointTransactionsTable)
    .where(eq(pointTransactionsTable.userId, req.session.userId))
    .orderBy(desc(pointTransactionsTable.createdAt))
    .limit(20);

  res.json({ totalPoints: user?.totalPoints ?? 0, transactions });
});

router.post("/points/award", async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { reason, referenceId } = req.body;
  const pointsToAward = POINTS_MAP[reason] ?? 5;

  await db.insert(pointTransactionsTable).values({
    userId: req.session.userId,
    amount: pointsToAward,
    reason,
    referenceId: referenceId ?? null,
  });

  await db.execute(
    sql`UPDATE users SET total_points = total_points + ${pointsToAward} WHERE id = ${req.session.userId}`
  );

  const [final] = await db
    .select({ totalPoints: usersTable.totalPoints })
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));

  res.json({ pointsEarned: pointsToAward, totalPoints: final?.totalPoints ?? 0 });
});

export default router;
