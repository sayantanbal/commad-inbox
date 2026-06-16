import { upsertAppContacts } from "@/lib/contacts/app-contacts";

/** Hackathon / demo contacts — no Google People API required. */
export const DEMO_CONTACTS = [
  { email: "friend@corsair.dev", displayName: "Friend (Corsair demo)" },
  { email: "priya@acme.io", displayName: "Priya Nair" },
  { email: "dana@studio.co", displayName: "Dana Whitfield" },
  { email: "marcus@client.dev", displayName: "Marcus Lee" },
] as const;

export async function importDemoContacts(userId: string) {
  return upsertAppContacts(userId, [...DEMO_CONTACTS], "demo");
}
