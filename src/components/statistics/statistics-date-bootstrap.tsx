"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { toDateKey } from "@/lib/dates/study-calendar";

export function StatisticsDateBootstrap({ boardId }: { boardId: string }) {
  const router = useRouter();

  useEffect(() => {
    const today = toDateKey(new Date());
    router.replace(
      `/statistics?board=${boardId}&year=${today.slice(0, 4)}&today=${today}`,
    );
  }, [boardId, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <p role="status" className="text-sm font-medium text-slate-500">
        Loading statistics...
      </p>
    </main>
  );
}
