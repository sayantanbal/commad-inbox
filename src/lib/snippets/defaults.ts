export const DEFAULT_SNIPPETS = [
  {
    name: "follow-up",
    body: "<p>Hi {{first_name}},</p><p>Just following up on my last note — wanted to check if you had a chance to review.</p><p>Best,</p>",
    variables: ["first_name"],
  },
  {
    name: "intro",
    body: "<p>Hi {{first_name}},</p><p>Great to connect. I wanted to reach out about {{project_name}}.</p>",
    variables: ["first_name", "project_name"],
  },
  {
    name: "invoice",
    body: "<p>Hi {{first_name}},</p><p>Please find the invoice attached for {{project_name}}. Let me know if you have any questions.</p>",
    variables: ["first_name", "project_name"],
  },
  {
    name: "scheduling",
    body: "<p>Hi {{first_name}},</p><p>Would any of these times work for a quick call?</p>",
    variables: ["first_name"],
  },
  {
    name: "ooo",
    body: "<p>Thanks for your email. I'm checking messages at set times during the day and will get back to you soon.</p>",
    variables: [],
  },
] as const;
