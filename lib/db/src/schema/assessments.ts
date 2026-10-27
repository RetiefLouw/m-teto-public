import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const userAssessmentsTable = pgTable("user_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Session identifier — anonymous UUID (localStorage) or Replit userId
  sessionId: varchar("session_id", { length: 255 }).notNull(),

  // Nullable: only set if the user authenticated
  userId: varchar("user_id", { length: 255 }),

  // Demographics (for hotspot mapping)
  gradeLevel: varchar("grade_level", { length: 30 }).notNull(),
  province: varchar("province", { length: 100 }),
  areaType: varchar("area_type", { length: 50 }), // city | town | township | rural
  genderIdentity: varchar("gender_identity", { length: 50 }),
  racialGroup: varchar("racial_group", { length: 50 }),
  schoolType: varchar("school_type", { length: 50 }),

  // Computed scores (admin/analytics use only)
  knowledgeScore: integer("knowledge_score"), // 0–100
  riskLevel: varchar("risk_level", { length: 20 }), // none | low | medium | high

  // Risk flags for law enforcement hotspot mapping (NO personal identifiers)
  hasRiskFlags: boolean("has_risk_flags").default(false),
  // Stores only anonymised flag codes + province/area — never name or identifying info
  riskFlags: jsonb("risk_flags").$type<string[]>(),

  // Full assessment responses (admin/analytics access only, never shown to user)
  assessmentData: jsonb("assessment_data"),

  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserAssessment = typeof userAssessmentsTable.$inferSelect;
export type InsertUserAssessment = typeof userAssessmentsTable.$inferInsert;
