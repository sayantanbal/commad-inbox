import "server-only";

import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import { sendGmailMessage } from "@/lib/corsair/actions";
import type { CorsairInstance } from "@/lib/corsair";
import {
  getUserPreferences,
  hasAutoRepliedToday,
  isInFocusWindow,
  logAutoReply,
} from "@/lib/focus/window";

export async function maybeSendFocusAutoReply(
  userId: string,
  userEmail: string,
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  threadId: string
): Promise<void> {
  const inFocus = await isInFocusWindow(userId);
  if (!inFocus) return;

  const full = await tenant.gmail.api.threads.get({ id: threadId, format: "full" });
  const thread = mapGmailThread(full);
  if (!thread?.messages.length) return;

  const latest = thread.messages.at(-1)!;
  const senderEmail = latest.from.email.toLowerCase();
  if (senderEmail === userEmail.toLowerCase()) return;

  if (await hasAutoRepliedToday(userId, senderEmail)) return;

  const prefs = await getUserPreferences(userId);
  const bodyHtml = `<p>${prefs.autoResponderTemplate.replace(/\n/g, "<br>")}</p>`;

  await sendGmailMessage(tenant, {
    from: userEmail,
    to: [senderEmail],
    subject: thread.subject.startsWith("Re:") ? thread.subject : `Re: ${thread.subject}`,
    bodyHtml,
    threadId,
    inReplyTo: latest.id,
  });

  await logAutoReply(userId, senderEmail, threadId);
}
