export interface CalendarDay {
  dayOfMonth: number;
  date: Date;
  isCurrentMonth: boolean;
  isWeekend: boolean;
}

/** Build a 6-week grid starting on Sunday (matches editorial month layout). */
export function getCalendarDays(month: Date): CalendarDay[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days: CalendarDay[] = [];

  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayOfMonth = prevMonthLastDay - i;
    const date = new Date(year, monthIndex - 1, dayOfMonth);
    const dayOfWeek = date.getDay();
    days.push({
      dayOfMonth,
      date,
      isCurrentMonth: false,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, monthIndex, i);
    const dayOfWeek = date.getDay();
    days.push({
      dayOfMonth: i,
      date,
      isCurrentMonth: true,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, monthIndex + 1, i);
    const dayOfWeek = date.getDay();
    days.push({
      dayOfMonth: i,
      date,
      isCurrentMonth: false,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  return days;
}
