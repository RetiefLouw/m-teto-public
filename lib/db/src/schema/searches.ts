import { sql } from "drizzle-orm";
import { pgTable, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

// Anonymous search log — for admin analytics (no personal identifiers)
export const searchLogsTable = pgTable("search_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id", { length: 255 }),  // anonymous session only
  query: text("query").notNull(),
  gradeLevel: varchar("grade_level", { length: 30 }),
  province: varchar("province", { length: 100 }),     // from localStorage demographics
  resultCount: integer("result_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SearchLog = typeof searchLogsTable.$inferSelect;
export type InsertSearchLog = typeof searchLogsTable.$inferInsert;
