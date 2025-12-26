CREATE TYPE "public"."deployment_status" AS ENUM('pending', 'building', 'deployed', 'failed');--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"project_name" text NOT NULL,
	"repo_full_name" text NOT NULL,
	"repo_clone_url" text NOT NULL,
	"default_branch" text NOT NULL,
	"status" "deployment_status" DEFAULT 'pending' NOT NULL,
	"deploy_url" text,
	"build_logs" text,
	"cloud_run_job_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_id" text NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"access_token" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deployment_user_id_idx" ON "deployments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deployment_status_idx" ON "deployments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "github_id_idx" ON "users" USING btree ("github_id");