import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/profile", async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    profile: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileType: user.profileType,
      gradeLevel: user.gradeLevel,
      totalPoints: user.totalPoints,
      onboardingDone: user.onboardingDone,
    }
  });
});

router.patch("/profile", async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { profileType, gradeLevel, onboardingDone } = req.body;
  const updates: Record<string, unknown> = {};
  if (profileType !== undefined) updates.profileType = profileType;
  if (gradeLevel !== undefined) updates.gradeLevel = gradeLevel;
  if (onboardingDone !== undefined) updates.onboardingDone = onboardingDone;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.session.userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    profile: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileType: user.profileType,
      gradeLevel: user.gradeLevel,
      totalPoints: user.totalPoints,
      onboardingDone: user.onboardingDone,
    }
  });
});

export default router;
