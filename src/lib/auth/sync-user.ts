import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function syncAppUser(input: {
  id: string;
  email: string;
  name: string | null;
}): Promise<void> {
  await db
    .insert(users)
    .values({
      id: input.id,
      email: input.email,
      name: input.name,
      corsairTenantId: input.id,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: input.email,
        name: input.name,
        corsairTenantId: input.id,
        updatedAt: new Date(),
      },
    });

  // Ensure tenant id is set even if row existed without it.
  await db
    .update(users)
    .set({ corsairTenantId: input.id, updatedAt: new Date() })
    .where(eq(users.id, input.id));
}
