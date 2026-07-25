import { redirect } from "next/navigation";

import { BoardWorkspace } from "@/components/boards/board-workspace";
import { DashboardDateBootstrap } from "@/components/boards/dashboard-date-bootstrap";
import { FirstBoardOnboarding } from "@/components/boards/first-board-onboarding";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ board?: string; date?: string; today?: string }>;
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

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  if (!isSupabaseConfigured()) redirect("/demo");

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/sign-in");

  const { data: boards, error } = await supabase
    .from("language_boards")
    .select("id, name")
    .is("archived_at", null)
    .order("position")
    .order("created_at");

  if (error) {
    console.error("Supabase board read failed", {
      code: error.code,
      message: error.message,
    });
    throw new Error("Language boards could not be loaded.");
  }

  if (boards.length === 0) return <FirstBoardOnboarding />;

  const {
    board: requestedBoardId,
    date: requestedDate,
    today: localToday,
  } = await searchParams;
  const selectedBoard =
    boards.find((board) => board.id === requestedBoardId) ?? boards[0];

  if (!isDateKey(requestedDate) || !isDateKey(localToday)) {
    return <DashboardDateBootstrap boardId={selectedBoard.id} />;
  }

  const year = Number(requestedDate.slice(0, 4));
  const [
    activitiesResult,
    entriesResult,
    earliestEntryResult,
    activeDateResult,
  ] = await Promise.all([
    supabase
      .from("activity_types")
      .select("id, name, system_key, archived_at")
      .order("position")
      .order("created_at"),
    supabase
      .from("study_entries")
      .select("id, study_date, duration_minutes, activity_type_id")
      .eq("board_id", selectedBoard.id)
      .gte("study_date", `${year}-01-01`)
      .lte("study_date", `${year}-12-31`)
      .order("study_date")
      .order("created_at"),
    supabase
      .from("study_entries")
      .select("study_date")
      .eq("board_id", selectedBoard.id)
      .order("study_date")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("study_entries")
      .select("study_date")
      .eq("board_id", selectedBoard.id)
      .lte("study_date", localToday)
      .order("study_date"),
  ]);

  if (
    activitiesResult.error ||
    entriesResult.error ||
    earliestEntryResult.error ||
    activeDateResult.error
  ) {
    console.error("Supabase board workspace read failed", {
      activities: activitiesResult.error?.message,
      entries: entriesResult.error?.message,
      earliestEntry: earliestEntryResult.error?.message,
      activeDates: activeDateResult.error?.message,
    });
    throw new Error("The language board could not be loaded.");
  }

  return (
    <BoardWorkspace
      boards={boards}
      selectedBoard={selectedBoard}
      activities={activitiesResult.data.map((activity) => ({
        id: activity.id,
        name: activity.name,
        systemKey: activity.system_key,
        archived: activity.archived_at !== null,
      }))}
      entries={entriesResult.data.map((entry) => ({
        id: entry.id,
        studyDate: entry.study_date,
        durationMinutes: entry.duration_minutes,
        activityTypeId: entry.activity_type_id,
      }))}
      earliestEntryDate={earliestEntryResult.data?.study_date ?? null}
      activeDateKeys={[
        ...new Set(activeDateResult.data.map((entry) => entry.study_date)),
      ]}
      selectedDate={requestedDate}
      year={year}
      todayKey={localToday}
    />
  );
}
