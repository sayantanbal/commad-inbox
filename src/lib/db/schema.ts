import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  real,
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

export const commitmentDirectionEnum = pgEnum("commitment_direction", ["outbound", "inbound"]);
export const commitmentStatusEnum = pgEnum("commitment_status", [
  "pending_confirm",
  "open",
  "fulfilled",
  "dismissed",
]);
export const contactWarmthEnum = pgEnum("contact_warmth", ["cold", "warm", "active", "new"]);
export const externalProviderEnum = pgEnum("external_provider", ["linear", "notion", "github"]);

import type {
  DailyBrief,
  MeetingBriefStored,
  SchedulingIntentStored,
  SuggestedAction,
} from "@/lib/schemas/domain";
import { EMBEDDING_DIMENSIONS } from "@/lib/ai/providers";

export type SchedulingIntent = SchedulingIntentStored;

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  corsairTenantId: text("corsair_tenant_id"),
  backfillCompletedAt: timestamp("backfill_completed_at", { withTimezone: true }),
  gmailWatchExpiresAt: timestamp("gmail_watch_expires_at", { withTimezone: true }),
  calendarWatchExpiresAt: timestamp("calendar_watch_expires_at", { withTimezone: true }),
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
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    embeddingProvider: text("embedding_provider").$type<"gemini" | "openai" | null>(),
  },
  (table) => [
    index("classifications_user_idx").on(table.userId),
    index("classifications_user_thread_idx").on(table.userId, table.threadId),
    index("classifications_user_provider_idx").on(table.userId, table.embeddingProvider),
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

export const agentConversations = pgTable(
  "agent_conversations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("agent_conversations_user_updated_idx").on(table.userId, table.updatedAt)]
);

export const agentMessages = pgTable(
  "agent_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => agentConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    parts: json("parts").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("agent_messages_conversation_idx").on(table.conversationId, table.createdAt)]
);

export const threadSummaries = pgTable(
  "thread_summaries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: text("thread_id").notNull(),
    bullets: json("bullets").$type<string[]>().notNull(),
    actions: json("actions").$type<SuggestedAction[]>().notNull(),
    messageCount: integer("message_count").notNull(),
    provider: text("provider").$type<"gemini" | "openai" | null>(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("thread_summaries_user_thread_idx").on(table.userId, table.threadId)]
);

export const dailyBriefs = pgTable(
  "daily_briefs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brief: json("brief").$type<DailyBrief>().notNull(),
    sourceHash: text("source_hash").notNull(),
    provider: text("provider").$type<"gemini" | "openai" | null>(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("daily_briefs_user_idx").on(table.userId)]
);

export const commitments = pgTable(
  "commitments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: text("thread_id").notNull(),
    messageId: text("message_id").notNull(),
    direction: commitmentDirectionEnum("direction").notNull(),
    text: text("text").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    counterpartyEmail: text("counterparty_email").notNull(),
    status: commitmentStatusEnum("status").notNull().default("open"),
    confidence: real("confidence").notNull(),
    extractedAt: timestamp("extracted_at", { withTimezone: true }).defaultNow().notNull(),
    followUpDraftQueuedAt: timestamp("follow_up_draft_queued_at", { withTimezone: true }),
  },
  (table) => [
    index("commitments_user_status_idx").on(table.userId, table.status),
    index("commitments_user_thread_idx").on(table.userId, table.threadId),
  ]
);

export const contacts = pgTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    displayName: text("display_name").notNull().default(""),
    lastContactAt: timestamp("last_contact_at", { withTimezone: true }).notNull(),
    avgResponseHours: integer("avg_response_hours"),
    emailCount30d: integer("email_count_30d").notNull().default(0),
    warmth: contactWarmthEnum("warmth").notNull().default("new"),
    openCommitmentCount: integer("open_commitment_count").notNull().default(0),
  },
  (table) => [
    index("contacts_user_email_idx").on(table.userId, table.email),
    index("contacts_user_warmth_idx").on(table.userId, table.warmth),
  ]
);

export const emailSnippets = pgTable(
  "email_snippets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    body: text("body").notNull(),
    variables: json("variables").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("email_snippets_user_idx").on(table.userId)]
);

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  batchWindows: json("batch_windows").$type<string[]>().notNull().default(["09:00", "13:00", "17:00"]),
  focusModeEnabled: boolean("focus_mode_enabled").notNull().default(true),
  autoResponderTemplate: text("auto_responder_template")
    .notNull()
    .default("I check email at 9am, 1pm, and 5pm. I'll get back to you soon."),
  followUpDaysDefault: integer("follow_up_days_default").notNull().default(5),
  timezone: text("timezone").notNull().default("UTC"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const externalConnections = pgTable(
  "external_connections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: externalProviderEnum("provider").notNull(),
    accessToken: text("access_token").notNull(),
    teamId: text("team_id"),
    defaultProjectId: text("default_project_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("external_connections_user_provider_idx").on(table.userId, table.provider)]
);

export const threadExternalTasks = pgTable(
  "thread_external_tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: text("thread_id").notNull(),
    provider: externalProviderEnum("provider").notNull(),
    externalTaskId: text("external_task_id").notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("thread_external_tasks_user_thread_idx").on(table.userId, table.threadId)]
);

export const focusAutoReplies = pgTable(
  "focus_auto_replies",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    senderEmail: text("sender_email").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
    threadId: text("thread_id").notNull(),
  },
  (table) => [
    index("focus_auto_replies_user_sender_day_idx").on(table.userId, table.senderEmail, table.sentAt),
  ]
);

export const meetingBriefs = pgTable(
  "meeting_briefs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attendeeEmail: text("attendee_email").notNull(),
    briefDate: text("brief_date").notNull(),
    brief: json("brief").$type<MeetingBriefStored>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("meeting_briefs_user_attendee_date_idx").on(
      table.userId,
      table.attendeeEmail,
      table.briefDate
    ),
  ]
);

export const usersRelations = relations(users, ({ many, one }) => ({
  classifications: many(classifications),
  snoozes: many(snoozes),
  drafts: many(drafts),
  scheduledSends: many(scheduledSends),
  threadMeetings: many(threadMeetings),
  agentConversations: many(agentConversations),
  threadSummaries: many(threadSummaries),
  dailyBriefs: many(dailyBriefs),
  commitments: many(commitments),
  contacts: many(contacts),
  emailSnippets: many(emailSnippets),
  preferences: one(userPreferences),
  externalConnections: many(externalConnections),
  threadExternalTasks: many(threadExternalTasks),
  focusAutoReplies: many(focusAutoReplies),
  meetingBriefs: many(meetingBriefs),
}));

export const agentConversationsRelations = relations(agentConversations, ({ one, many }) => ({
  user: one(users, { fields: [agentConversations.userId], references: [users.id] }),
  messages: many(agentMessages),
}));

export const agentMessagesRelations = relations(agentMessages, ({ one }) => ({
  conversation: one(agentConversations, {
    fields: [agentMessages.conversationId],
    references: [agentConversations.id],
  }),
}));
