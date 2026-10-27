import { Router, type IRouter, type Request, type Response } from "express";
import { db, providersTable, reviewsTable, officialsTable, officialReviewsTable } from "@workspace/db";
import { eq, and, ilike, or, avg, count, sql, desc } from "drizzle-orm";
import {
  ListProvidersResponse,
  CreateProviderBody,
  GetProviderResponse,
  ListProviderReviewsResponse,
  CreateReviewBody,
  HideReviewResponse,
} from "@workspace/api-zod";
import { z } from "zod/v4";

const router: IRouter = Router();

// ─── PROVIDERS LIST ────────────────────────────────────────────────────────
router.get("/providers", async (req: Request, res: Response) => {
  const { search, type, province, area, municipality } = req.query;

  const conditions = [];
  if (search && typeof search === "string") {
    conditions.push(
      or(
        ilike(providersTable.name, `%${search}%`),
        ilike(providersTable.suburb, `%${search}%`),
        ilike(providersTable.address, `%${search}%`),
        ilike(providersTable.municipality, `%${search}%`),
      ),
    );
  }
  if (type && typeof type === "string") {
    if (type === "legal") {
      conditions.push(
        or(
          eq(providersTable.type, "legal_aid"),
          eq(providersTable.type, "pro_bono_legal"),
          eq(providersTable.type, "legal_clinic"),
        )!
      );
    } else {
      conditions.push(eq(providersTable.type, type));
    }
  }
  if (province && typeof province === "string") {
    conditions.push(ilike(providersTable.province, `%${province}%`));
  }
  if (area && typeof area === "string") {
    conditions.push(ilike(providersTable.area, `%${area}%`));
  }
  if (municipality && typeof municipality === "string") {
    conditions.push(ilike(providersTable.municipality, `%${municipality}%`));
  }

  const providers = await db.select().from(providersTable).where(
    conditions.length > 0 ? and(...conditions) : undefined,
  );

  const ratingResults = await db
    .select({
      providerId: reviewsTable.providerId,
      avgRating: avg(reviewsTable.score),
      reviewCount: count(reviewsTable.id),
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.isHidden, false))
    .groupBy(reviewsTable.providerId);

  const ratingMap = new Map(
    ratingResults.map((r) => [r.providerId, { avg: r.avgRating, count: Number(r.reviewCount) }]),
  );

  const result = providers.map((p) => ({
    ...p,
    averageRating: ratingMap.has(p.id) ? parseFloat(ratingMap.get(p.id)!.avg ?? "0") : null,
    reviewCount: ratingMap.get(p.id)?.count ?? 0,
  }));

  res.json(ListProvidersResponse.parse({ providers: result }));
});

router.post("/providers", async (req: Request, res: Response) => {
  const parsed = CreateProviderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [provider] = await db.insert(providersTable).values(parsed.data).returning();
  res.status(201).json({ provider: { ...provider, averageRating: null, reviewCount: 0 } });
});

// ─── SINGLE PROVIDER ───────────────────────────────────────────────────────
router.get("/providers/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, id));
  if (!provider) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }

  const [ratingResult] = await db
    .select({
      avgRating: avg(reviewsTable.score),
      reviewCount: count(reviewsTable.id),
    })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.providerId, id), eq(reviewsTable.isHidden, false)));

  res.json(
    GetProviderResponse.parse({
      provider: {
        ...provider,
        averageRating: ratingResult?.avgRating ? parseFloat(ratingResult.avgRating) : null,
        reviewCount: Number(ratingResult?.reviewCount ?? 0),
      },
    }),
  );
});

// ─── OFFICIALS AT A PROVIDER ───────────────────────────────────────────────
router.get("/providers/:id/officials", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { onDuty } = req.query;

  let query = db.select().from(officialsTable).where(eq(officialsTable.providerId, id));

  const officials = await db
    .select()
    .from(officialsTable)
    .where(
      onDuty === "true"
        ? and(eq(officialsTable.providerId, id), eq(officialsTable.isOnDuty, true))
        : eq(officialsTable.providerId, id),
    )
    .orderBy(officialsTable.role);

  res.json({ officials });
});

// ─── OFFICIAL CLOCK IN/OUT ─────────────────────────────────────────────────
router.post("/officials/:id/clock-in", async (req: Request, res: Response) => {
  const { id } = req.params;
  const [official] = await db
    .update(officialsTable)
    .set({ isOnDuty: true, clockedInAt: new Date(), clockedOutAt: null })
    .where(eq(officialsTable.id, id))
    .returning();

  if (!official) {
    res.status(404).json({ error: "Official not found" });
    return;
  }
  res.json({ official });
});

router.post("/officials/:id/clock-out", async (req: Request, res: Response) => {
  const { id } = req.params;
  const [official] = await db
    .update(officialsTable)
    .set({ isOnDuty: false, clockedOutAt: new Date() })
    .where(eq(officialsTable.id, id))
    .returning();

  if (!official) {
    res.status(404).json({ error: "Official not found" });
    return;
  }
  res.json({ official });
});

// ─── OFFICIAL REVIEWS ──────────────────────────────────────────────────────
router.get("/officials/:id/reviews", async (req: Request, res: Response) => {
  const { id } = req.params;
  const reviews = await db
    .select()
    .from(officialReviewsTable)
    .where(and(eq(officialReviewsTable.officialId, id), eq(officialReviewsTable.isHidden, false)))
    .orderBy(desc(officialReviewsTable.createdAt));

  res.json({ reviews });
});

router.post("/officials/:id/reviews", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = z.object({
    providerId: z.string(),
    score: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    tags: z.string().optional(),
    verifiedBadge: z.boolean().optional(),
    verifiedPhoto: z.boolean().optional(),
    badgePhotoUrl: z.string().optional(),
    conductFlag: z.string().optional(),
    sessionId: z.string().optional(),
  }).safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [review] = await db
    .insert(officialReviewsTable)
    .values({
      officialId: id,
      providerId: body.data.providerId,
      score: body.data.score,
      comment: body.data.comment ?? null,
      tags: body.data.tags ?? null,
      verifiedBadge: body.data.verifiedBadge ?? false,
      verifiedPhoto: body.data.verifiedPhoto ?? false,
      badgePhotoUrl: body.data.badgePhotoUrl ?? null,
      conductFlag: body.data.conductFlag ?? "none",
      sessionId: body.data.sessionId ?? null,
      isAnonymous: true,
    })
    .returning();

  // Update official's aggregate stats
  const stats = await db
    .select({
      avg: avg(officialReviewsTable.score),
      cnt: count(officialReviewsTable.id),
      flags: count(
        sql`CASE WHEN ${officialReviewsTable.conductFlag} != 'none' AND ${officialReviewsTable.conductFlag} IS NOT NULL THEN 1 END`,
      ),
    })
    .from(officialReviewsTable)
    .where(and(eq(officialReviewsTable.officialId, id), eq(officialReviewsTable.isHidden, false)));

  await db
    .update(officialsTable)
    .set({
      averageScore: stats[0]?.avg ? parseFloat(stats[0].avg) : null,
      reviewCount: Number(stats[0]?.cnt ?? 0),
      flagCount: Number(stats[0]?.flags ?? 0),
    })
    .where(eq(officialsTable.id, id));

  res.status(201).json({ review });
});

// ─── ADMIN: ALL OFFICIAL REVIEWS (for dashboard) ────────────────────────────
router.get("/admin/official-reviews", async (req: Request, res: Response) => {
  const reviews = await db
    .select({
      review: officialReviewsTable,
      officialName: officialsTable.name,
      officialTitle: officialsTable.title,
      officialAverageScore: officialsTable.averageScore,
      officialFlagCount: officialsTable.flagCount,
      providerName: providersTable.name,
    })
    .from(officialReviewsTable)
    .innerJoin(officialsTable, eq(officialReviewsTable.officialId, officialsTable.id))
    .innerJoin(providersTable, eq(officialReviewsTable.providerId, providersTable.id))
    .orderBy(desc(officialReviewsTable.createdAt))
    .limit(200);

  res.json({ reviews });
});

// ─── PROVIDER REVIEWS ─────────────────────────────────────────────────────
router.get("/providers/:id/reviews", async (req: Request, res: Response) => {
  const { id } = req.params;
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(and(eq(reviewsTable.providerId, id), eq(reviewsTable.isHidden, false)));

  res.json(ListProviderReviewsResponse.parse({ reviews }));
});

router.post("/providers/:id/reviews", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      providerId: id,
      userId: req.user.id,
      score: parsed.data.score,
      reviewText: parsed.data.reviewText ?? null,
      officialName: parsed.data.officialName ?? null,
    })
    .returning();

  res.status(201).json({ review });
});

router.patch("/reviews/:id/hide", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  const [review] = await db
    .update(reviewsTable)
    .set({ isHidden: true })
    .where(eq(reviewsTable.id, id))
    .returning();

  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }
  res.json(HideReviewResponse.parse({ review }));
});

export default router;
