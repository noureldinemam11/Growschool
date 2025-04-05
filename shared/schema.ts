import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model and roles
export const userRoles = ["admin", "teacher", "student", "parent"] as const;
export type UserRole = typeof userRoles[number];

// App users are only admins and teachers, they can log in
export const appUserRoles = ["admin", "teacher"] as const;
export type AppUserRole = typeof appUserRoles[number];

// Houses for house competitions
export const houses = pgTable("houses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  points: integer("points").notNull().default(0),
});

export const insertHouseSchema = createInsertSchema(houses).omit({ id: true, points: true });

// User model - avoid circular dependency by recreating a parentId definition
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: userRoles }).notNull(),
  email: text("email").notNull().unique(),
  gradeLevel: text("grade_level"),
  section: text("section"),
  parentId: integer("parent_id"), // This will reference the users table but not with a direct reference
  classId: integer("class_id"),   // Reference to class table if needed
  houseId: integer("house_id"),   // Reference to house table for students
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true })
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Behavior categories
export const behaviorCategories = pgTable("behavior_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isPositive: boolean("is_positive").notNull(),
  pointValue: integer("point_value").notNull(),
});

export const insertBehaviorCategorySchema = createInsertSchema(behaviorCategories).omit({ id: true });

// Behavior points records
export const behaviorPoints = pgTable("behavior_points", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  categoryId: integer("category_id").notNull().references(() => behaviorCategories.id),
  points: integer("points").notNull(),
  notes: text("notes"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertBehaviorPointSchema = createInsertSchema(behaviorPoints).omit({ id: true, timestamp: true });

// Rewards store
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  pointCost: integer("point_cost").notNull(),
  quantity: integer("quantity").notNull(),
  imageUrl: text("image_url"),
});

export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true });

// Reward redemptions
export const rewardRedemptions = pgTable("reward_redemptions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  pointsSpent: integer("points_spent").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status", { enum: ["pending", "approved", "delivered"] }).notNull().default("pending"),
});

export const insertRewardRedemptionSchema = createInsertSchema(rewardRedemptions).omit({ id: true, timestamp: true, status: true });

// Data Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type House = typeof houses.$inferSelect;
export type InsertHouse = z.infer<typeof insertHouseSchema>;

export type BehaviorCategory = typeof behaviorCategories.$inferSelect;
export type InsertBehaviorCategory = z.infer<typeof insertBehaviorCategorySchema>;

export type BehaviorPoint = typeof behaviorPoints.$inferSelect;
export type InsertBehaviorPoint = z.infer<typeof insertBehaviorPointSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertRewardRedemption = z.infer<typeof insertRewardRedemptionSchema>;
