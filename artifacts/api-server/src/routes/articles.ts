import { Router, type IRouter, type Request, type Response } from "express";
import { db, articlesTable } from "@workspace/db";
import { eq, ilike, or, and } from "drizzle-orm";
import { ListArticlesResponse, GetArticleResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/articles", async (req: Request, res: Response) => {
  const { search, category, moduleType, gradeLevel } = req.query;
  const conditions = [];
  if (search && typeof search === "string") {
    conditions.push(
      or(
        ilike(articlesTable.title, `%${search}%`),
        ilike(articlesTable.summary, `%${search}%`),
      ),
    );
  }
  if (category && typeof category === "string") {
    conditions.push(eq(articlesTable.category, category));
  }
  if (moduleType && typeof moduleType === "string") {
    conditions.push(eq(articlesTable.moduleType, moduleType));
  }
  if (gradeLevel && typeof gradeLevel === "string" && gradeLevel !== "all") {
    conditions.push(
      or(
        eq(articlesTable.gradeLevel, gradeLevel),
        eq(articlesTable.gradeLevel, "all"),
      )
    );
  }
  const articles = await db
    .select()
    .from(articlesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json(ListArticlesResponse.parse({ articles }));
});

router.get("/articles/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const [article] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json(GetArticleResponse.parse({ article }));
});

export default router;
