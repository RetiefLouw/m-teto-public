import { sql } from "drizzle-orm";
import {
  pgTable, varchar, text, timestamp, jsonb, boolean, integer,
} from "drizzle-orm/pg-core";
import { casesTable } from "./cases";

/**
 * Detailed timeline event for each SA justice step — per case
 * Tracks who did what, when it was due, and whether it was late
 */
export const caseTimelineEventsTable = pgTable("case_timeline_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  stepId: varchar("step_id", { length: 100 }).notNull(),
  stepLabel: varchar("step_label", { length: 255 }).notNull(),
  phase: varchar("phase", { length: 100 }),
  actorRole: varchar("actor_role", { length: 100 }),
  actorLabel: varchar("actor_label", { length: 255 }),
  actorName: varchar("actor_name", { length: 255 }),
  actorPhone: varchar("actor_phone", { length: 50 }),
  actorBadge: varchar("actor_badge", { length: 50 }),
  // Status: pending | in_progress | completed | overdue | failed | escalated | skipped
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  // When this step was due (calculated from incident date + deadlineHours)
  dueAt: timestamp("due_at", { withTimezone: true }),
  // When step was actually completed
  completedAt: timestamp("completed_at", { withTimezone: true }),
  // Official update notes logged through the app
  officialNotes: text("official_notes"),
  // What still needs to be done
  pendingActions: jsonb("pending_actions").$type<string[]>().default([]),
  // Red flag reason (if delayed or failed)
  delayReason: text("delay_reason"),
  delayHours: integer("delay_hours"),
  isDelayed: boolean("is_delayed").default(false),
  isFailed: boolean("is_failed").default(false),
  // Who last updated this step (official name or 'system')
  lastUpdatedBy: varchar("last_updated_by", { length: 255 }),
  lastUpdatedByRole: varchar("last_updated_by_role", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Escalation records — when a delay is escalated to a supervisory/external body
 */
export const caseEscalationsTable = pgTable("case_escalations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  timelineEventId: varchar("timeline_event_id").references(() => caseTimelineEventsTable.id, { onDelete: "set null" }),
  // The body this was escalated to
  escalationBody: varchar("escalation_body", { length: 100 }).notNull(),
  escalationBodyLabel: varchar("escalation_body_label", { length: 255 }).notNull(),
  escalationLevel: integer("escalation_level").notNull().default(1),
  // The step that failed / was delayed
  failedStepId: varchar("failed_step_id", { length: 100 }),
  failedStepLabel: varchar("failed_step_label", { length: 255 }),
  // Full reason for escalation
  reason: text("reason").notNull(),
  // Response from the escalation body
  response: text("response"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  // Status: submitted | acknowledged | investigating | resolved | no_response
  status: varchar("status", { length: 30 }).notNull().default("submitted"),
  // Ref number given by escalation body
  referenceNumber: varchar("reference_number", { length: 100 }),
  // Who submitted the escalation
  submittedBy: varchar("submitted_by", { length: 255 }),
  submittedByRole: varchar("submitted_by_role", { length: 50 }).default("complainant"),
  // When the system will follow up if no response
  followUpAt: timestamp("follow_up_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Case documents — photos and files attached to a case
 * Stores metadata; file content stored as base64 in fileData
 */
export const caseDocumentsTable = pgTable("case_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  // Type: docket | j88 | statement | badge | evidence_photo | court_order | other
  documentType: varchar("document_type", { length: 50 }).notNull(),
  documentLabel: varchar("document_label", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }),
  fileType: varchar("file_type", { length: 50 }),
  fileSizeBytes: integer("file_size_bytes"),
  // Base64 encoded file content (for small images / docs)
  fileData: text("file_data"),
  // Or a URL if stored externally
  fileUrl: varchar("file_url", { length: 1000 }),
  description: text("description"),
  // Which step this document belongs to
  stepId: varchar("step_id", { length: 100 }),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  uploadedByRole: varchar("uploaded_by_role", { length: 50 }).default("complainant"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by", { length: 255 }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Case messages — two-way communication between complainant and officials
 */
export const caseMessagesTable = pgTable("case_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  // sender_role: complainant | official | system | admin
  senderRole: varchar("sender_role", { length: 50 }).notNull(),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  senderTitle: varchar("sender_title", { length: 255 }),
  // message_type: update | question | request | alert | escalation_notice | system
  messageType: varchar("message_type", { length: 50 }).notNull().default("update"),
  subject: varchar("subject", { length: 500 }),
  body: text("body").notNull(),
  // Which step this message relates to
  stepId: varchar("step_id", { length: 100 }),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  isUrgent: boolean("is_urgent").default(false),
  // Attachments list (document IDs)
  attachmentIds: jsonb("attachment_ids").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CaseTimelineEvent = typeof caseTimelineEventsTable.$inferSelect;
export type CaseEscalation = typeof caseEscalationsTable.$inferSelect;
export type CaseDocument = typeof caseDocumentsTable.$inferSelect;
export type CaseMessage = typeof caseMessagesTable.$inferSelect;
