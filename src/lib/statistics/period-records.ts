import { shiftDate } from "@/lib/dates/study-calendar";

export type PeriodRecord = {
  total: number;
  startDate: string;
  endDate: string;
};

export type PeriodRecords = {
  day: PeriodRecord | null;
  week: PeriodRecord | null;
  month: PeriodRecord | null;
};

type DatedValue = {
  date: string;
  value: number;
};

function startOfWeek(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const mondayOffset = (date.getDay() + 6) % 7;
  return shiftDate(dateKey, -mondayOffset);
}

function endOfMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${monthKey}-${String(lastDay).padStart(2, "0")}`;
}

function findRecord(
  totals: Map<string, number>,
  getEndDate: (key: string) => string,
): PeriodRecord | null {
  let record: PeriodRecord | null = null;

  for (const [startDate, total] of totals) {
    if (
      total > 0 &&
      (record === null ||
        total > record.total ||
        (total === record.total && startDate > record.startDate))
    ) {
      record = { total, startDate, endDate: getEndDate(startDate) };
    }
  }

  return record;
}

export function calculatePeriodRecords(
  values: DatedValue[],
  todayKey: string,
): PeriodRecords {
  const dayTotals = new Map<string, number>();
  const weekTotals = new Map<string, number>();
  const monthTotals = new Map<string, number>();

  for (const item of values) {
    if (item.date > todayKey) continue;

    const weekStart = startOfWeek(item.date);
    const monthStart = `${item.date.slice(0, 7)}-01`;
    dayTotals.set(item.date, (dayTotals.get(item.date) ?? 0) + item.value);
    weekTotals.set(weekStart, (weekTotals.get(weekStart) ?? 0) + item.value);
    monthTotals.set(
      monthStart,
      (monthTotals.get(monthStart) ?? 0) + item.value,
    );
  }

  return {
    day: findRecord(dayTotals, (date) => date),
    week: findRecord(weekTotals, (date) => shiftDate(date, 6)),
    month: findRecord(monthTotals, (date) => endOfMonth(date.slice(0, 7))),
  };
}
