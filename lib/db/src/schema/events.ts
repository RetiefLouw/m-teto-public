import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * user_events — every interaction with every function of the application.
 * Keyed by anonymous sessionId (UUID from localStorage).
 * NO personal identifiers ever stored.
 *
 * eventType values:
 *  page_view | search | article_read | provider_view | official_view |
 *  review_submit | teto_chat | quiz_answer | assessment_step |
 *  assessment_complete | emergency_visit | university_lesson |
 *  tracker_action | square_browse | knowledge_badge | onboarding_start |
 *  onboarding_step | profile_update | case_created | case_updated |
 *  search_result_click | provider_called | directory_filter
 */
export const userEventsTable = pgTable("user_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 60 }).notNull(),
  // Rich context: page, query, articleId, providerId, officialId, score, etc.
  eventData: jsonb("event_data").$type<Record<string, any>>(),
  gradeLevel: varchar("grade_level", { length: 30 }),
  province: varchar("province", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * session_profiles — rolling live aggregate per anonymous session.
 * Upserted on each event to maintain a current snapshot.
 * This is what powers the "individual user journey" view in the admin portal.
 */
export const sessionProfilesTable = pgTable("session_profiles", {
  sessionId: varchar("session_id", { length: 255 }).primaryKey(),
  gradeLevel: varchar("grade_level", { length: 30 }),
  province: varchar("province", { length: 100 }),
  areaType: varchar("area_type", { length: 50 }),
  genderIdentity: varchar("gender_identity", { length: 50 }),
  racialGroup: varchar("racial_group", { length: 50 }),
  schoolType: varchar("school_type", { length: 50 }),
  knowledgeScore: integer("knowledge_score"),
  riskLevel: varchar("risk_level", { length: 20 }),
  hasRiskFlags: boolean("has_risk_flags").default(false),
  // Adaptive difficulty level for quiz/assessment questions
  adaptiveLevel: varchar("adaptive_level", { length: 20 }).default("beginner"),
  // beginner | developing | intermediate | advanced
  totalEvents: integer("total_events").default(0),
  totalSearches: integer("total_searches").default(0),
  totalArticleReads: integer("total_article_reads").default(0),
  totalProviderViews: integer("total_provider_views").default(0),
  totalTetoMessages: integer("total_teto_messages").default(0),
  totalQuizAnswers: integer("total_quiz_answers").default(0),
  totalReviews: integer("total_reviews").default(0),
  assessmentCompleted: boolean("assessment_completed").default(false),
  topicsExplored: jsonb("topics_explored").$type<string[]>(),
  pagesVisited: jsonb("pages_visited").$type<string[]>(),
  lastActive: timestamp("last_active", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserEvent = typeof userEventsTable.$inferSelect;
export type InsertUserEvent = typeof userEventsTable.$inferInsert;
export type SessionProfile = typeof sessionProfilesTable.$inferSelect;
export type InsertSessionProfile = typeof sessionProfilesTable.$inferInsert;
