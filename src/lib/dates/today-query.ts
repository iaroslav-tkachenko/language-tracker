import { toDateKey } from "@/lib/dates/study-calendar";

export function syncTodaySearchParams({
  search,
  browserDate,
  dateParam,
  yearParam,
}: {
  search: string;
  browserDate: Date;
  dateParam?: string;
  yearParam?: string;
}) {
  const params = new URLSearchParams(search);
  const currentToday = params.get("today");
  const browserToday = toDateKey(browserDate);

  if (currentToday === browserToday) return null;

  params.set("today", browserToday);

  if (dateParam && params.get(dateParam) === currentToday) {
    params.set(dateParam, browserToday);
  }

  if (
    yearParam &&
    currentToday &&
    params.get(yearParam) === currentToday.slice(0, 4)
  ) {
    params.set(yearParam, browserToday.slice(0, 4));
  }

  return params.toString();
}
