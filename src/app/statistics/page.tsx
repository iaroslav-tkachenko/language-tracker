import { redirect } from "next/navigation";

import { StatisticsDateBootstrap } from "@/components/statistics/statistics-date-bootstrap";
import { StatisticsWorkspace } from "@/components/statistics/statistics-workspace";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type StatisticsPageProps = {
  searchParams: Promise<{
    board?: string;
    year?: string;
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

export default async function StatisticsPage({
  searchParams,
}: StatisticsPageProps) {
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

  if (boardsError) throw new Error("Language boards could not be loaded.");
  if (boards.length === 0) redirect("/dashboard");

  const {
    board: requestedBoardId,
    year: requestedYear,
    today: localToday,
  } = await searchParams;
  const selectedBoard =
    boards.find((board) => board.id === requestedBoardId) ?? boards[0];

  if (!isDateKey(localToday)) {
    return <StatisticsDateBootstrap boardId={selectedBoard.id} />;
  }

  const parsedYear = Number(requestedYear);
  const selectedYear =
    Number.isInteger(parsedYear) && parsedYear >= 1900 && parsedYear <= 9999
      ? parsedYear
      : Number(localToday.slice(0, 4));

  const [activitiesResult, entriesResult, vocabularyTotalsResult] =
    await Promise.all([
      supabase
        .from("activity_types")
        .select("id, name, system_key")
        .order("position")
        .order("created_at"),
      supabase
        .from("study_entries")
        .select("study_date, duration_minutes, activity_type_id")
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
    activitiesResult.error ||
    entriesResult.error ||
    vocabularyTotalsResult.error
  ) {
    console.error("Supabase statistics read failed", {
      activities: activitiesResult.error?.message,
      entries: entriesResult.error?.message,
      vocabularyTotals: vocabularyTotalsResult.error?.message,
    });
    throw new Error("Statistics could not be loaded.");
  }

  return (
    <StatisticsWorkspace
      boards={boards}
      selectedBoard={selectedBoard}
      activities={activitiesResult.data.map((activity) => ({
        id: activity.id,
        name: activity.name,
        systemKey: activity.system_key,
      }))}
      entries={entriesResult.data.map((entry) => ({
        studyDate: entry.study_date,
        durationMinutes: entry.duration_minutes,
        activityTypeId: entry.activity_type_id,
      }))}
      vocabularyTotals={vocabularyTotalsResult.data.map((total) => ({
        studyDate: total.study_date,
        wordsLearned: total.words_learned,
      }))}
      selectedYear={selectedYear}
      todayKey={localToday}
    />
  );
}
