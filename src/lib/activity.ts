export type ActivityType = "scheduled_send" | "snooze" | "background";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  label: string;
  detail?: string;
  at?: Date;
  progress?: number;
  scheduledSendId?: string;
}

export function getSnoozePresets(): { label: string; until: Date }[] {
  const now = new Date();

  const laterToday = new Date(now);
  laterToday.setHours(20, 0, 0, 0);
  if (laterToday <= now) laterToday.setDate(laterToday.getDate() + 1);

  const tomorrow9 = new Date(now);
  tomorrow9.setDate(tomorrow9.getDate() + 1);
  tomorrow9.setHours(9, 0, 0, 0);

  const monday9 = new Date(now);
  const daysUntilMonday = (8 - monday9.getDay()) % 7 || 7;
  monday9.setDate(monday9.getDate() + daysUntilMonday);
  monday9.setHours(9, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(9, 0, 0, 0);

  return [
    { label: "Later today · 8pm", until: laterToday },
    { label: "Tomorrow · 9am", until: tomorrow9 },
    { label: "Monday · 9am", until: monday9 },
    { label: "Next week · 9am", until: nextWeek },
  ];
}

export function getSendLaterPresets(): { label: string; at: Date }[] {
  const now = new Date();

  const inOneHour = new Date(now.getTime() + 3_600_000);

  const tonight8 = new Date(now);
  tonight8.setHours(20, 0, 0, 0);
  if (tonight8 <= now) tonight8.setDate(tonight8.getDate() + 1);

  const tomorrow9 = new Date(now);
  tomorrow9.setDate(tomorrow9.getDate() + 1);
  tomorrow9.setHours(9, 0, 0, 0);

  const monday9 = new Date(now);
  const daysUntilMonday = (8 - monday9.getDay()) % 7 || 7;
  monday9.setDate(monday9.getDate() + daysUntilMonday);
  monday9.setHours(9, 0, 0, 0);

  return [
    { label: "In 1 hour", at: inOneHour },
    { label: "Tonight · 8pm", at: tonight8 },
    { label: "Tomorrow · 9am", at: tomorrow9 },
    { label: `Monday · 9am`, at: monday9 },
  ];
}
