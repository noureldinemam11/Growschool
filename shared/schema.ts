import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model and roles
export const userRoles = ["admin", "teacher", "student", "parent"] as const;
export type UserRole = typeof userRoles[number];

// App users are only admins and teachers, they can log in
export const appUserRoles = ["admin", "teacher"] as const;
export type AppUserRole = typeof appUserRoles[number];

// Pods for school organization
export const pods = pgTable("pods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  points: integer("points").notNull().default(0),
});

export const insertPodSchema = createInsertSchema(pods).omit({ id: true, points: true });

// Classes within pods
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  podId: integer("pod_id").notNull().references(() => pods.id),
  gradeLevel: text("grade_level"),
  description: text("description"),
  color: text("color").default("#00D1B2"), // Default color if none specified
});

export const insertClassSchema = createInsertSchema(classes).omit({ id: true });

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
  classId: integer("class_id"),   // Reference to class table for students
  podId: integer("pod_id"),       // Reference to pod, can be derived from class but kept for easier querying
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

// Incident Report types and status
export const incidentStatuses = ["pending", "resolved", "escalated"] as const;
export type IncidentStatus = typeof incidentStatuses[number];

export const incidentTypes = ["disrespect", "fighting", "cheating", "bullying", "vandalism", "truancy", "classroom_disruption", "other"] as const;
export type IncidentType = typeof incidentTypes[number];

// Define action taken options based on incident types
export const actionTakenOptions = [
  "Verbal warning",
  "Contacted parents",
  "Detention assigned",
  "In-class consequence",
  "Behavior contract",
  "Peer mediation",
  "Counselor referral",
  "Loss of privileges",
  "Cooling off period",
  "Restorative practice",
  "Other"
] as const;
export type ActionTakenType = typeof actionTakenOptions[number];

// Incident Reports
export const incidentReports = pgTable("incident_reports", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  studentIds: jsonb("student_ids").notNull().$type<number[]>(), // Array of student IDs
  type: text("type", { enum: incidentTypes }).notNull(),
  description: text("description").notNull(),
  actionTaken: text("action_taken"), // What action the teacher took before escalating
  status: text("status", { enum: incidentStatuses }).notNull().default("pending"),
  adminResponse: text("admin_response"),
  adminId: integer("admin_id").references(() => users.id),
  incidentDate: timestamp("incident_date").notNull().defaultNow(),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIncidentReportSchema = createInsertSchema(incidentReports)
  .omit({ 
    id: true, 
    adminResponse: true, 
    adminId: true, 
    createdAt: true, 
    updatedAt: true, 
    status: true 
  });

// Data Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Pod = typeof pods.$inferSelect;
export type InsertPod = z.infer<typeof insertPodSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type BehaviorCategory = typeof behaviorCategories.$inferSelect;
export type InsertBehaviorCategory = z.infer<typeof insertBehaviorCategorySchema>;

export type BehaviorPoint = typeof behaviorPoints.$inferSelect;
export type InsertBehaviorPoint = z.infer<typeof insertBehaviorPointSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertRewardRedemption = z.infer<typeof insertRewardRedemptionSchema>;

export type IncidentReport = typeof incidentReports.$inferSelect;
export type InsertIncidentReport = z.infer<typeof insertIncidentReportSchema>;
