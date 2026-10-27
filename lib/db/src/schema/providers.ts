import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const providersTable = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  // police_station | court | hospital | clinic | doctor_office |
  // thuthuzela_care_centre | shelter | social_worker | legal_aid |
  // counsellor | srhr_practitioner | ngo | cso | legal_clinic | crisis_centre
  address: text("address").notNull(),
  suburb: varchar("suburb", { length: 100 }).notNull(),
  municipality: varchar("municipality", { length: 100 }),
  area: varchar("area", { length: 100 }),
  province: varchar("province", { length: 100 }).notNull(),
  contactNumber: varchar("contact_number", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 500 }),
  operatingHours: varchar("operating_hours", { length: 255 }),
  photoUrl: varchar("photo_url", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const officialsTable = pgTable("officials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  isPrimary: boolean("is_primary").notNull().default(false),
  // Extended accountability fields
  role: varchar("role", { length: 30 }).notNull().default("frontline"),
  // frontline | supervisor | manager | director
  badgeNumber: varchar("badge_number", { length: 50 }),
  photoUrl: varchar("photo_url", { length: 500 }),
  isOnDuty: boolean("is_on_duty").notNull().default(false),
  clockedInAt: timestamp("clocked_in_at", { withTimezone: true }),
  clockedOutAt: timestamp("clocked_out_at", { withTimezone: true }),
  averageScore: real("average_score"),
  reviewCount: integer("review_count").notNull().default(0),
  flagCount: integer("flag_count").notNull().default(0),
  recognitionCount: integer("recognition_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviewsTable = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id"),
  officialName: varchar("official_name", { length: 255 }),
  score: integer("score").notNull(), // 1-10
  reviewText: text("review_text"),
  isHidden: boolean("is_hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// New: individual official reviews (Uber-style accountability)
export const officialReviewsTable = pgTable("official_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officialId: varchar("official_id").notNull().references(() => officialsTable.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 100 }),
  // Score: 1–5 stars
  score: integer("score").notNull(),
  comment: text("comment"),
  // Tags selected by user
  tags: text("tags"),
  // Identity verification
  verifiedBadge: boolean("verified_badge").notNull().default(false),
  verifiedPhoto: boolean("verified_photo").notNull().default(false),
  badgePhotoUrl: varchar("badge_photo_url", { length: 500 }),
  // Conduct flags
  conductFlag: varchar("conduct_flag", { length: 50 }),
  // none | unprofessional | refused_help | hostile | discriminatory | abusive
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  isHidden: boolean("is_hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProviderSchema = createInsertSchema(providersTable).omit({ id: true, createdAt: true });
export const insertOfficialSchema = createInsertSchema(officialsTable).omit({ id: true, createdAt: true, averageScore: true, reviewCount: true, flagCount: true, recognitionCount: true });
export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export const insertOfficialReviewSchema = createInsertSchema(officialReviewsTable).omit({ id: true, createdAt: true });

export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type InsertOfficial = z.infer<typeof insertOfficialSchema>;
export type Provider = typeof providersTable.$inferSelect;
export type Official = typeof officialsTable.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
export type OfficialReview = typeof officialReviewsTable.$inferSelect;
export type InsertOfficialReview = z.infer<typeof insertOfficialReviewSchema>;
