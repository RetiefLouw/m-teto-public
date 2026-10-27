import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articlesTable = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // legal_terms | process_guides | your_rights | srgbv | university
  summary: text("summary").notNull(),
  content: text("content"),
  isStepByStep: boolean("is_step_by_step").notNull().default(false),
  incidentType: varchar("incident_type", { length: 50 }), // rape | domestic_violence | assault
  moduleType: varchar("module_type", { length: 50 }).default("knowledge_base"), // knowledge_base | university
  gradeLevel: varchar("grade_level", { length: 20 }).default("all"), // all | grade_1_2 | grade_3_5 | grade_6_7 | grade_8_12
  pointsReward: integer("points_reward").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({ id: true, createdAt: true });
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;
