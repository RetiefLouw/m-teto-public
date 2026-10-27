import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { casesTable } from "./cases";

export const justiceJourneysTable = pgTable("justice_journeys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  caseId: varchar("case_id").references(() => casesTable.id, { onDelete: "set null" }),
  gradeLevel: varchar("grade_level", { length: 50 }),
  violationContext: varchar("violation_context", { length: 100 }).notNull(),
  violationTypeId: varchar("violation_type_id", { length: 100 }).notNull(),
  pathway: varchar("pathway", { length: 20 }).notNull().default("criminal"),
  currentStepId: varchar("current_step_id", { length: 100 }),
  completedStepIds: jsonb("completed_step_ids").$type<string[]>().default([]),
  stepStartDates: jsonb("step_start_dates").$type<Record<string, string>>().default({}),
  journeyStartDate: timestamp("journey_start_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const journeyStepLogsTable = pgTable("journey_step_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journeyId: varchar("journey_id").notNull().references(() => justiceJourneysTable.id, { onDelete: "cascade" }),
  stepId: varchar("step_id", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // pending | in_progress | completed | overdue | blocked | skipped
  notes: text("notes"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJusticeJourneySchema = createInsertSchema(justiceJourneysTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertJourneyStepLogSchema = createInsertSchema(journeyStepLogsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type JusticeJourney = typeof justiceJourneysTable.$inferSelect;
export type InsertJusticeJourney = z.infer<typeof insertJusticeJourneySchema>;
export type JourneyStepLog = typeof journeyStepLogsTable.$inferSelect;
export type InsertJourneyStepLog = z.infer<typeof insertJourneyStepLogSchema>;
