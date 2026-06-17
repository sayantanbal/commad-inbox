import { NextResponse } from "next/server";
import { corsair } from "@/lib/corsair";
import { processCommitmentFollowUps } from "@/lib/commitments/follow-up";
import { rebuildContactsForUser } from "@/lib/contacts/rebuild";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!env.CRON_SECRET || token !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
  let contactsRebuilt = 0;
  let followUpsQueued = 0;

  for (const user of allUsers) {
    if (!user.email) continue;
    try {
      const tenant = corsair.withTenant(user.id);
      contactsRebuilt += await rebuildContactsForUser(user.id, tenant);
      followUpsQueued += await processCommitmentFollowUps(user.id);
    } catch (error) {
      console.error("[nightly] failed for user", user.id, error);
    }
  }

  return NextResponse.json({ success: true, contactsRebuilt, followUpsQueued });
}
