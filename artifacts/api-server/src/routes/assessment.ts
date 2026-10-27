import { Router } from "express";
import { db } from "@workspace/db";
import { userAssessmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// POST /api/onboarding — save assessment results (no auth required)
router.post("/", async (req, res) => {
  try {
    const {
      sessionId,
      gradeLevel,
      demographics,
      knowledgeScore,
      riskLevel,
      hasRiskFlags,
      riskFlags,
      assessmentData,
    } = req.body as {
      sessionId: string;
      gradeLevel: string;
      demographics: {
        province?: string;
        areaType?: string;
        genderIdentity?: string;
        racialGroup?: string;
        schoolType?: string;
      };
      knowledgeScore: number;
      riskLevel: string;
      hasRiskFlags: boolean;
      riskFlags: string[];
      assessmentData: Record<string, string>; // question responses (admin-only)
    };

    if (!sessionId || !gradeLevel) {
      return res.status(400).json({ error: "sessionId and gradeLevel are required" });
    }

    // Get userId from session if authenticated
    const userId: string | null = (req as any).user?.id ?? null;

    // Store anonymized assessment data
    // IMPORTANT: assessmentData contains question responses (admin only)
    // riskFlags contain ONLY question IDs (no personal data) + province/area for hotspot mapping
    const anonymizedRiskData = hasRiskFlags
      ? {
          flaggedQuestions: riskFlags,
          province: demographics.province,
          areaType: demographics.areaType,
          gradeLevel,
          // Deliberately NO: name, school name, userId, or any identifier
        }
      : null;

    await db.insert(userAssessmentsTable).values({
      sessionId,
      userId,
      gradeLevel,
      province: demographics.province,
      areaType: demographics.areaType,
      genderIdentity: demographics.genderIdentity,
      racialGroup: demographics.racialGroup,
      schoolType: demographics.schoolType,
      knowledgeScore,
      riskLevel,
      hasRiskFlags,
      riskFlags: anonymizedRiskData ? [JSON.stringify(anonymizedRiskData)] : [],
      assessmentData, // full responses — admin/analyst access only, never shown to user
      completedAt: new Date(),
    });

    // Update user's onboarding flag if authenticated
    if (userId) {
      const { usersTable } = await import("@workspace/db");
      await db
        .update(usersTable)
        .set({ onboardingDone: 1, gradeLevel })
        .where(eq(usersTable.id, userId));
    }

    return res.json({
      success: true,
      knowledgeScore,
      riskLevel,
    });
  } catch (err) {
    console.error("Onboarding error:", err);
    return res.status(500).json({ error: "Failed to save onboarding data" });
  }
});

export default router;
