import { NextResponse } from "next/server";
import { corsair } from "@/lib/corsair";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { expireSnoozes } from "@/lib/inbox/snoozes";
import { processDueSends } from "@/lib/inbox/scheduled-sends";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!env.CRON_SECRET || token !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
  const emailById = new Map(allUsers.map((user) => [user.id, user.email]));

  const [sentCount, expiredSnoozes] = await Promise.all([
    processDueSends((userId) => corsair.withTenant(userId), emailById),
    expireSnoozes(),
  ]);

  return NextResponse.json({
    success: true,
    sentCount,
    expiredSnoozes: expiredSnoozes.length,
  });
}
