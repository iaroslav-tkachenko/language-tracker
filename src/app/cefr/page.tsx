import { redirect } from "next/navigation";

import { CefrDateBootstrap } from "@/components/cefr/cefr-date-bootstrap";
import { CefrHistoryWorkspace } from "@/components/cefr/cefr-history-workspace";
import { isCefrLevel } from "@/lib/cefr/reference";
import { sortCefrHistoryNewestFirst } from "@/lib/cefr/history";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CefrPageProps = {
  searchParams: Promise<{
    board?: string;
    today?: string;
  }>;
};

function isDateKey(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export default async function CefrPage({ searchParams }: CefrPageProps) {
  if (!isSupabaseConfigured()) redirect("/demo");

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/sign-in");

  const { data: boards, error: boardsError } = await supabase
    .from("language_boards")
    .select("id, name")
    .is("archived_at", null)
    .order("position")
    .order("created_at");

  if (boardsError) {
    console.error("Supabase CEFR board read failed", {
      code: boardsError.code,
      message: boardsError.message,
    });
    throw new Error("Language boards could not be loaded.");
  }

  if (boards.length === 0) redirect("/dashboard");

  const { board: requestedBoardId, today: localToday } = await searchParams;
  const selectedBoard =
    boards.find((board) => board.id === requestedBoardId) ?? boards[0];

  if (!isDateKey(localToday)) {
    return <CefrDateBootstrap boardId={selectedBoard.id} />;
  }

  const [levelEventsResult, entriesResult, vocabularyTotalsResult] =
    await Promise.all([
      supabase
        .from("cefr_level_events")
        .select("id, level, effective_date, created_at")
        .eq("board_id", selectedBoard.id)
        .order("effective_date", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),
      supabase
        .from("study_entries")
        .select("study_date, duration_minutes")
        .eq("board_id", selectedBoard.id)
        .order("study_date")
        .order("created_at"),
      supabase
        .from("vocabulary_daily_totals")
        .select("study_date, words_learned")
        .eq("board_id", selectedBoard.id)
        .order("study_date"),
    ]);

  if (
    levelEventsResult.error ||
    entriesResult.error ||
    vocabularyTotalsResult.error
  ) {
    console.error("Supabase CEFR page read failed", {
      levelEvents: levelEventsResult.error?.message,
      entries: entriesResult.error?.message,
      vocabularyTotals: vocabularyTotalsResult.error?.message,
    });
    throw new Error("Language level data could not be loaded.");
  }

  const history = sortCefrHistoryNewestFirst(
    levelEventsResult.data.flatMap((event) => {
      if (!isCefrLevel(event.level)) return [];
      return [
        {
          id: event.id,
          level: event.level,
          effectiveDate: event.effective_date,
          createdAt: event.created_at,
        },
      ];
    }),
  );

  return (
    <CefrHistoryWorkspace
      boards={boards}
      selectedBoard={selectedBoard}
      history={history}
      entries={entriesResult.data.map((entry) => ({
        studyDate: entry.study_date,
        durationMinutes: entry.duration_minutes,
      }))}
      vocabularyTotals={vocabularyTotalsResult.data.map((total) => ({
        studyDate: total.study_date,
        wordsLearned: total.words_learned,
      }))}
      todayKey={localToday}
    />
  );
}
