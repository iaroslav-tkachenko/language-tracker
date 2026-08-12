"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { syncTodaySearchParams } from "@/lib/dates/today-query";

export function TodayQuerySync({
  dateParam,
  yearParam,
}: {
  dateParam?: string;
  yearParam?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    function sync() {
      const nextSearch = syncTodaySearchParams({
        search: searchParams.toString(),
        browserDate: new Date(),
        dateParam,
        yearParam,
      });

      if (!nextSearch) return;
      router.replace(`${pathname}?${nextSearch}`, { scroll: false });
    }

    sync();

    const intervalId = window.setInterval(sync, 60_000);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [dateParam, pathname, router, searchParams, yearParam]);

  return null;
}
