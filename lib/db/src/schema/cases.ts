import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const casesTable = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  incidentType: varchar("incident_type", { length: 50 }), // rape | domestic_violence | assault | other
  stage: varchar("stage", { length: 50 }).notNull().default("incident"), // incident | case_opened | investigation | court | sentencing | closed
  incidentDate: date("incident_date"),
  casNumber: varchar("cas_number", { length: 100 }),
  ioName: varchar("io_name", { length: 255 }),
  socialWorkerName: varchar("social_worker_name", { length: 255 }),
  courtDate: date("court_date"),
  courtLocation: varchar("court_location", { length: 255 }),
  prosecutorName: varchar("prosecutor_name", { length: 255 }),
  magistrateName: varchar("magistrate_name", { length: 255 }),
  checklistData: jsonb("checklist_data").$type<Record<string, boolean>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const caseHistoryTable = pgTable("case_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  field: varchar("field", { length: 100 }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCaseSchema = createInsertSchema(casesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCaseHistorySchema = createInsertSchema(caseHistoryTable).omit({ id: true, changedAt: true });

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;
export type InsertCaseHistory = z.infer<typeof insertCaseHistorySchema>;
export type CaseHistory = typeof caseHistoryTable.$inferSelect;
