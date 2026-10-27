import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const squareItemsTable = pgTable("square_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // srhr | education | hygiene | emergency | digital
  pointsCost: integer("points_cost").notNull(),
  imageEmoji: varchar("image_emoji", { length: 10 }).notNull().default("🎁"),
  stock: integer("stock").notNull().default(-1), // -1 = unlimited
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const squareRedemptionsTable = pgTable("square_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  itemId: varchar("item_id").notNull(),
  pointsSpent: integer("points_spent").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"), // pending | fulfilled | cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pointTransactionsTable = pgTable("point_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: integer("amount").notNull(), // positive = earned, negative = spent
  reason: varchar("reason", { length: 100 }).notNull(), // read_article | wrote_review | quiz_correct | checklist_item | onboarding | redemption
  referenceId: varchar("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quizQuestionsTable = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id"),
  gradeLevel: varchar("grade_level", { length: 20 }).default("all"),
  question: text("question").notNull(),
  optionA: varchar("option_a", { length: 300 }).notNull(),
  optionB: varchar("option_b", { length: 300 }).notNull(),
  optionC: varchar("option_c", { length: 300 }).notNull(),
  correctOption: varchar("correct_option", { length: 1 }).notNull(), // A | B | C
  explanation: text("explanation"),
  pointsReward: integer("points_reward").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SquareItem = typeof squareItemsTable.$inferSelect;
export type InsertSquareItem = typeof squareItemsTable.$inferInsert;
export type PointTransaction = typeof pointTransactionsTable.$inferSelect;
export type QuizQuestion = typeof quizQuestionsTable.$inferSelect;
