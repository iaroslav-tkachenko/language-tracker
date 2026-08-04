"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { toDateKey } from "@/lib/dates/study-calendar";

export function CefrDateBootstrap({ boardId }: { boardId: string }) {
  const router = useRouter();

  useEffect(() => {
    const today = toDateKey(new Date());
    router.replace(`/cefr?board=${boardId}&today=${today}`);
  }, [boardId, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <p role="status" className="text-sm font-medium text-slate-500">
        Loading language level...
      </p>
    </main>
  );
}
