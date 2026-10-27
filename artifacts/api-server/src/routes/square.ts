import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, squareItemsTable, squareRedemptionsTable, pointTransactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/square/items", async (req: Request, res: Response) => {
  const { category } = req.query;
  const conditions = [eq(squareItemsTable.isActive, true)];
  if (category && typeof category === "string") {
    conditions.push(eq(squareItemsTable.category, category));
  }
  const items = await db
    .select()
    .from(squareItemsTable)
    .where(and(...conditions))
    .orderBy(squareItemsTable.pointsCost);
  res.json({ items });
});

router.get("/square/redemptions", async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const redemptions = await db
    .select({
      id: squareRedemptionsTable.id,
      userId: squareRedemptionsTable.userId,
      itemId: squareRedemptionsTable.itemId,
      pointsSpent: squareRedemptionsTable.pointsSpent,
      status: squareRedemptionsTable.status,
      createdAt: squareRedemptionsTable.createdAt,
      item: squareItemsTable,
    })
    .from(squareRedemptionsTable)
    .leftJoin(squareItemsTable, eq(squareRedemptionsTable.itemId, squareItemsTable.id))
    .where(eq(squareRedemptionsTable.userId, req.session.userId));
  res.json({ redemptions });
});

router.post("/square/redeem", async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { itemId } = req.body;
  if (!itemId) {
    res.status(400).json({ error: "itemId is required" });
    return;
  }

  // Get the item
  const [item] = await db.select().from(squareItemsTable).where(
    and(eq(squareItemsTable.id, itemId), eq(squareItemsTable.isActive, true))
  );
  if (!item) {
    res.status(404).json({ error: "Item not found or unavailable" });
    return;
  }

  // Check user points
  const [user] = await db.select({ totalPoints: usersTable.totalPoints }).from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user || user.totalPoints < item.pointsCost) {
    res.status(400).json({ error: "Insufficient points" });
    return;
  }

  // Create redemption
  const [redemption] = await db.insert(squareRedemptionsTable).values({
    userId: req.session.userId,
    itemId: item.id,
    pointsSpent: item.pointsCost,
    status: "pending",
  }).returning();

  // Deduct points
  await db.execute(sql`UPDATE users SET total_points = total_points - ${item.pointsCost} WHERE id = ${req.session.userId}`);
  await db.insert(pointTransactionsTable).values({
    userId: req.session.userId,
    amount: -item.pointsCost,
    reason: "redemption",
    referenceId: redemption.id,
  });

  const [updated] = await db.select({ totalPoints: usersTable.totalPoints }).from(usersTable).where(eq(usersTable.id, req.session.userId));

  res.json({ redemption: { ...redemption, item }, remainingPoints: updated?.totalPoints ?? 0 });
});

export default router;
