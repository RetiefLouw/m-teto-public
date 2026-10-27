import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";

export const universitySavedContentTable = pgTable("university_saved_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  contentId: varchar("content_id", { length: 500 }).notNull(),
  contentUrl: text("content_url").notNull(),
  contentTitle: text("content_title").notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  contentSource: varchar("content_source", { length: 100 }),
  thumbnailUrl: text("thumbnail_url"),
  author: text("author"),
  year: varchar("year", { length: 10 }),
  description: text("description"),
  topic: varchar("topic", { length: 100 }),
  gradeLevel: varchar("grade_level", { length: 50 }),
  isArchived: boolean("is_archived").notNull().default(false),
  downloadUrl: text("download_url"),
  hasCaptions: boolean("has_captions").default(false),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const universityPremiumContentTable = pgTable("university_premium_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  provider: varchar("provider", { length: 200 }).notNull(),
  pointsCost: integer("points_cost").notNull().default(100),
  directPurchaseUrl: text("direct_purchase_url"),
  thumbnailUrl: text("thumbnail_url"),
  previewUrl: text("preview_url"),
  topic: varchar("topic", { length: 100 }).notNull(),
  gradeLevels: jsonb("grade_levels").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  hasCaptions: boolean("has_captions").default(false),
  hasAudioDescription: boolean("has_audio_description").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const universityPremiumRedemptionsTable = pgTable("university_premium_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  contentId: varchar("content_id").notNull().references(() => universityPremiumContentTable.id, { onDelete: "cascade" }),
  pointsSpent: integer("points_spent").notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
});
