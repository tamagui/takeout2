CREATE TABLE "device" (
	"id" varchar PRIMARY KEY NOT NULL,
	"userId" varchar NOT NULL,
	"sessionId" varchar NOT NULL,
	"type" varchar NOT NULL,
	"name" text,
	"appBundleId" varchar NOT NULL,
	"deviceToken" text NOT NULL,
	"brand" text,
	"model" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_sessionId_session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_device_user" ON "device" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_device_session" ON "device" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "idx_device_type" ON "device" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_device_appBundleId" ON "device" USING btree ("appBundleId");--> statement-breakpoint
CREATE INDEX "idx_device_deviceToken" ON "device" USING btree ("deviceToken");