/**
 * SP Communications & Inquiry Management — M-TETO
 * Tracks all inbound contact from end-users: messages, emails, calls,
 * emergency panic button presses, and walk-ins.
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */
import { sql } from "drizzle-orm";
import {
  pgTable, varchar, text, timestamp, boolean,
  real, jsonb, unique,
} from "drizzle-orm/pg-core";

/**
 * sp_inquiries — every inbound contact from an end-user to a service provider.
 * type: message | email | call | emergency | walk_in
 * status: open | in_progress | resolved | escalated | closed
 * urgency: normal | urgent | critical
 */
export const spInquiriesTable = pgTable("sp_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  type: varchar("type", { length: 30 }).notNull().default("message"),
  status: varchar("status", { length: 30 }).notNull().default("open"),
  urgency: varchar("urgency", { length: 20 }).notNull().default("normal"),

  contactName: varchar("contact_name", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactAge: varchar("contact_age", { length: 20 }),

  organisationSlug: varchar("organisation_slug", { length: 100 }),
  assignedTo: varchar("assigned_to", { length: 255 }),
  assignedDepartment: varchar("assigned_department", { length: 255 }),

  subject: varchar("subject", { length: 500 }),
  body: text("body"),

  geoLat: real("geo_lat"),
  geoLng: real("geo_lng"),
  geoAddress: text("geo_address"),

  linkedCaseId: varchar("linked_case_id", { length: 100 }),

  isRead: boolean("is_read").default(false),
  requiresResponse: boolean("requires_response").default(true),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  firstResponseAt: timestamp("first_response_at", { withTimezone: true }),

  reviewScore: real("review_score"),
  reviewComment: text("review_comment"),
  wasReported: boolean("was_reported").default(false),
  reportReason: text("report_reason"),

  tags: jsonb("tags").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * sp_inquiry_responses — threaded replies from officials to end-users.
 */
export const spInquiryResponsesTable = pgTable("sp_inquiry_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  inquiryId: varchar("inquiry_id").notNull(),

  responderName: varchar("responder_name", { length: 255 }).notNull(),
  responderRole: varchar("responder_role", { length: 100 }),
  responderDepartment: varchar("responder_department", { length: 255 }),
  responderEmail: varchar("responder_email", { length: 255 }),

  channel: varchar("channel", { length: 30 }).default("portal"),
  body: text("body").notNull(),
  isInternal: boolean("is_internal").default(false),
  attachments: jsonb("attachments").$type<string[]>().default([]),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * sp_emergency_outcomes — records outcome of every emergency panic button press.
 * Linked to an inquiry of type 'emergency'.
 */
export const spEmergencyOutcomesTable = pgTable("sp_emergency_outcomes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  inquiryId: varchar("inquiry_id").notNull().unique(),

  wasHelped: boolean("was_helped"),
  incidentNature: varchar("incident_nature", { length: 255 }),
  incidentDescription: text("incident_description"),
  caseOpened: boolean("case_opened").default(false),
  casNumber: varchar("cas_number", { length: 100 }),
  linkedCaseId: varchar("linked_case_id", { length: 100 }),

  attendingOfficer: varchar("attending_officer", { length: 255 }),
  attendingOfficerBadge: varchar("attending_officer_badge", { length: 50 }),
  attendingOrg: varchar("attending_org", { length: 255 }),

  responseTimeMinutes: real("response_time_minutes"),
  childSafe: boolean("child_safe"),
  hospitalised: boolean("hospitalised"),
  perpetratorApprehended: boolean("perpetrator_apprehended"),

  followUpRequired: boolean("follow_up_required").default(false),
  followUpNotes: text("follow_up_notes"),

  recordedBy: varchar("recorded_by", { length: 255 }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
