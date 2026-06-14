import { processWebhook } from "corsair";
import { corsair } from "@/lib/corsair";
import { handleGmailMessageChanged } from "@/lib/webhooks/gmail-event";
import { handleCalendarEventChanged } from "@/lib/webhooks/calendar-event";
import { logWebhookAttempt } from "@/lib/webhooks/log";
import { webhookTenantIdSchema } from "@/lib/schemas/webhooks";

export const runtime = "nodejs";

function headersRecord(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export async function POST(request: Request) {
  const tenantIdParam = new URL(request.url).searchParams.get("tenantId");
  const tenantParsed = webhookTenantIdSchema.safeParse(tenantIdParam);
  if (!tenantParsed.success) {
    return new Response("Missing tenantId", { status: 400 });
  }
  const tenantId = tenantParsed.data;

  const rawBody = await request.text();
  const signature = request.headers.get("x-corsair-signature");

  let parsedBody: unknown;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    await logWebhookAttempt({
      userId: tenantId,
      payload: { raw: rawBody.slice(0, 500) },
      signature,
      verified: false,
      error: "invalid_json",
    });
    return new Response("Invalid JSON", { status: 400 });
  }

  try {
    const result = await processWebhook(
      corsair,
      headersRecord(request),
      rawBody,
      { tenantId }
    );

    await logWebhookAttempt({
      userId: tenantId,
      payload: { plugin: result.plugin, action: result.action, body: result.body },
      signature,
      verified: true,
    });

    if (result.plugin === "gmail" && result.action === "messageChanged") {
      void handleGmailMessageChanged(tenantId, result.body).catch((error) => {
        console.error("[webhook] gmail classify failed", error);
      });
    }

    if (result.plugin === "googlecalendar" && result.action === "eventChanged") {
      void handleCalendarEventChanged(tenantId).catch((error) => {
        console.error("[webhook] calendar sync failed", error);
      });
    }

    if (result.responseHeaders) {
      return new Response(JSON.stringify(result.response ?? { success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...result.responseHeaders },
      });
    }

    return Response.json(result.response ?? { success: true, plugin: result.plugin });
  } catch (error) {
    const message = error instanceof Error ? error.message : "webhook_failed";
    await logWebhookAttempt({
      userId: tenantId,
      payload: parsedBody,
      signature,
      verified: false,
      error: message,
    });
    return new Response(message, { status: 500 });
  }
}
