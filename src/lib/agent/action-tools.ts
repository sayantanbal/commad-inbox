import { tool, type ToolSet } from "ai";
import { createCalendarEventWithMeet, sendGmailMessage } from "@/lib/corsair/actions";
import type { CorsairInstance } from "@/lib/corsair";
import {
  createCalendarInviteToolInputSchema,
  sendEmailToolInputSchema,
} from "@/lib/schemas/agent-tools";

function toHtmlBody(body: string): string {
  if (/<[a-z][\s\S]*>/i.test(body)) return body;
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function buildAgentActionTools(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  userEmail: string
): ToolSet {
  return {
    send_email: tool({
      description:
        "Send an email from the user's Gmail account. Always use this tool for sending mail — never use run_script for email. The user will review a preview and confirm before the message is sent.",
      inputSchema: sendEmailToolInputSchema,
      needsApproval: true,
      execute: async ({ to, subject, body, threadId }) => {
        const recipients = Array.isArray(to) ? to : [to];
        const result = await sendGmailMessage(tenant, {
          from: userEmail,
          to: recipients,
          subject,
          bodyHtml: toHtmlBody(body),
          threadId,
        });
        return `Email sent to ${recipients.join(", ")} (message id: ${result.messageId}).`;
      },
    }),
    create_calendar_invite: tool({
      description:
        "Create a Google Calendar event with a Meet link and email attendees. Always use this tool for new invites — never use run_script for calendar creates. The user will review details and confirm before the invite is sent.",
      inputSchema: createCalendarInviteToolInputSchema,
      needsApproval: true,
      execute: async ({ summary, start, durationMinutes, attendees, description }) => {
        const result = await createCalendarEventWithMeet(tenant, {
          summary,
          start: new Date(start),
          durationMinutes,
          attendees,
          description,
        });
        const meet = result.hangoutLink ? ` Meet link: ${result.hangoutLink}.` : "";
        return `Calendar invite sent: "${summary}" at ${new Date(start).toLocaleString()}.${meet}`;
      },
    }),
  };
}
