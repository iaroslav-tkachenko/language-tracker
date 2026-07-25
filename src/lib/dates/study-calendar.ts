export type CalendarCell = {
  dateKey: string;
  inYear: boolean;
};

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDate(dateKey: string, amount: number) {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function getCalendarCells(year: number): CalendarCell[] {
  const firstDay = new Date(year, 0, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, 0, 1 - offset);
  const daysInYear =
    (new Date(year + 1, 0, 1).getTime() - firstDay.getTime()) / 86_400_000;
  const weekCount = Math.ceil((offset + daysInYear) / 7);

  return Array.from({ length: weekCount * 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      dateKey: toDateKey(date),
      inYear: date.getFullYear() === year,
    };
  });
}

export function studyHeatLevel(minutes: number) {
  if (minutes <= 0) return 0;
  if (minutes <= 14) return 1;
  if (minutes <= 29) return 2;
  if (minutes <= 59) return 3;
  if (minutes <= 119) return 4;
  if (minutes <= 180) return 5;
  return 6;
}
