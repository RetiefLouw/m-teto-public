import { Router, type IRouter, type Request, type Response } from "express";
import { db, quizQuestionsTable, usersTable, pointTransactionsTable } from "@workspace/db";
import { eq, and, or, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/quiz", async (req: Request, res: Response) => {
  const { articleId, gradeLevel } = req.query;
  const conditions: ReturnType<typeof eq>[] = [];

  if (articleId && typeof articleId === "string") {
    conditions.push(eq(quizQuestionsTable.articleId, articleId));
  }

  if (gradeLevel && typeof gradeLevel === "string") {
    // Return questions for the specific grade or "all" grade questions
    const questions = await db
      .select({
        id: quizQuestionsTable.id,
        articleId: quizQuestionsTable.articleId,
        gradeLevel: quizQuestionsTable.gradeLevel,
        question: quizQuestionsTable.question,
        optionA: quizQuestionsTable.optionA,
        optionB: quizQuestionsTable.optionB,
        optionC: quizQuestionsTable.optionC,
        pointsReward: quizQuestionsTable.pointsReward,
      })
      .from(quizQuestionsTable)
      .where(
        and(
          ...(conditions.length > 0 ? conditions : []),
          or(
            eq(quizQuestionsTable.gradeLevel, gradeLevel),
            eq(quizQuestionsTable.gradeLevel, "all")
          )
        )
      )
      .limit(5);
    res.json({ questions });
    return;
  }

  const questions = await db
    .select({
      id: quizQuestionsTable.id,
      articleId: quizQuestionsTable.articleId,
      gradeLevel: quizQuestionsTable.gradeLevel,
      question: quizQuestionsTable.question,
      optionA: quizQuestionsTable.optionA,
      optionB: quizQuestionsTable.optionB,
      optionC: quizQuestionsTable.optionC,
      pointsReward: quizQuestionsTable.pointsReward,
    })
    .from(quizQuestionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(5);

  res.json({ questions });
});

router.post("/quiz/answer", async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { questionId, selectedOption } = req.body;
  if (!questionId || !selectedOption) {
    res.status(400).json({ error: "questionId and selectedOption are required" });
    return;
  }

  const [question] = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.id, questionId));
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const correct = question.correctOption === selectedOption.toUpperCase();
  let pointsEarned = 0;
  let totalPoints: number | null = null;

  if (correct) {
    pointsEarned = question.pointsReward;
    await db.insert(pointTransactionsTable).values({
      userId: req.session.userId,
      amount: pointsEarned,
      reason: "quiz_correct",
      referenceId: questionId,
    });
    await db.execute(sql`UPDATE users SET total_points = total_points + ${pointsEarned} WHERE id = ${req.session.userId}`);
    const [user] = await db.select({ totalPoints: usersTable.totalPoints }).from(usersTable).where(eq(usersTable.id, req.session.userId));
    totalPoints = user?.totalPoints ?? 0;
  }

  res.json({
    correct,
    explanation: question.explanation ?? null,
    pointsEarned: correct ? pointsEarned : null,
    totalPoints,
  });
});

export default router;
