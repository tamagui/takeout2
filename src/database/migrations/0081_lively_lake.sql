DROP TABLE IF EXISTS "meetingUser";
--> statement-breakpoint
CREATE TABLE "meetingUser" (
	"meetingId" varchar NOT NULL,
	"userId" varchar NOT NULL,
	"participantToken" text,
	"joinedAt" timestamp DEFAULT now(),
	"leftAt" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "meetingUser_meetingId_userId_pk" PRIMARY KEY("meetingId","userId")
);
--> statement-breakpoint
ALTER TABLE "meetingUser" ADD CONSTRAINT "meetingUser_meetingId_meeting_id_fk" FOREIGN KEY ("meetingId") REFERENCES "public"."meeting"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "meetingUser" ADD CONSTRAINT "meetingUser_userId_userPublic_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_meetingUser_meeting" ON "meetingUser" USING btree ("meetingId","active");
--> statement-breakpoint
CREATE INDEX "idx_meetingUser_user" ON "meetingUser" USING btree ("userId","active");