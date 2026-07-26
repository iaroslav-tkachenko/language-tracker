"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DashboardDateBootstrap({
  boardId,
  tracker,
}: {
  boardId: string;
  tracker?: "vocabulary";
}) {
  const router = useRouter();

  useEffect(() => {
    const today = localDateKey(new Date());
    const trackerQuery = tracker ? `&tracker=${tracker}` : "";
    router.replace(
      `/dashboard?board=${boardId}&date=${today}&today=${today}${trackerQuery}`,
    );
  }, [boardId, router, tracker]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <p role="status" className="text-sm font-medium text-slate-500">
        Opening today...
      </p>
    </main>
  );
}
