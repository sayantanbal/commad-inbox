import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";

export * from "./auth-schema";

export const priorityEnum = pgEnum("priority", ["high", "medium", "low"]);
export const laneEnum = pgEnum("triage_lane", ["reply", "schedule", "fyi", "done"]);
export const draftToneEnum = pgEnum("draft_tone", ["professional", "friendly", "brief"]);
export const scheduledSendStatusEnum = pgEnum("scheduled_send_status", [
  "pending",
  "sent",
  "cancelled",
  "failed",
]);

export type SchedulingIntent = {
  proposedTimes: string[];
  attendees: string[];
  duration: number;
  confidence: number;
};

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  corsairTenantId: text("corsair_tenant_id"),
  backfillCompletedAt: timestamp("backfill_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const classifications = pgTable(
  "classifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: text("thread_id").notNull(),
    priority: priorityEnum("priority").notNull(),
    lane: laneEnum("lane").notNull(),
    subject: text("subject").notNull(),
    sender: text("sender").notNull(),
    snippet: text("snippet").notNull(),
    schedulingIntent: json("scheduling_intent").$type<SchedulingIntent | null>(),
    classifiedAt: timestamp("classified_at", { withTimezone: true }).defaultNow().notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
  },
  (table) => [
    index("classifications_user_idx").on(table.userId),
    index("classifications_user_thread_idx").on(table.userId, table.threadId),
  ]
);

export const snoozes = pgTable(
  "snoozes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: text("thread_id").notNull(),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("snoozes_user_time_idx").on(table.userId, table.snoozedUntil)]
);

export const drafts = pgTable("drafts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  threadId: text("thread_id"),
  content: text("content").notNull(),
  tone: draftToneEnum("tone"),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scheduledSends = pgTable(
  "scheduled_sends",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: text("thread_id"),
    to: json("to").$type<string[]>().notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    sendAt: timestamp("send_at", { withTimezone: true }).notNull(),
    status: scheduledSendStatusEnum("status").notNull().default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("scheduled_sends_time_idx").on(table.status, table.sendAt)]
);

export const threadMeetings = pgTable(
  "thread_meetings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: text("thread_id").notNull(),
    eventId: text("event_id").notNull(),
    slotStart: timestamp("slot_start", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("thread_meetings_user_thread_idx").on(table.userId, table.threadId)]
);

export const webhookLogs = pgTable("webhook_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  payload: json("payload").notNull(),
  signature: text("signature"),
  verified: boolean("verified").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
  error: text("error"),
});

export const usersRelations = relations(users, ({ many }) => ({
  classifications: many(classifications),
  snoozes: many(snoozes),
  drafts: many(drafts),
  scheduledSends: many(scheduledSends),
  threadMeetings: many(threadMeetings),
}));
