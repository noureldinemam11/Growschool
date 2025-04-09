CREATE TABLE "behavior_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_positive" boolean NOT NULL,
	"point_value" integer NOT NULL,
	CONSTRAINT "behavior_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "behavior_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"points" integer NOT NULL,
	"notes" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"pod_id" integer NOT NULL,
	"grade_level" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "incident_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"student_ids" jsonb NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"action_taken" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_response" text,
	"admin_id" integer,
	"incident_date" timestamp DEFAULT now() NOT NULL,
	"attachment_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"description" text,
	"logo_url" text,
	"points" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pods_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "reward_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"reward_id" integer NOT NULL,
	"points_spent" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"point_cost" integer NOT NULL,
	"quantity" integer NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text NOT NULL,
	"email" text NOT NULL,
	"grade_level" text,
	"section" text,
	"parent_id" integer,
	"class_id" integer,
	"pod_id" integer,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "behavior_points" ADD CONSTRAINT "behavior_points_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_points" ADD CONSTRAINT "behavior_points_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_points" ADD CONSTRAINT "behavior_points_category_id_behavior_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."behavior_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;