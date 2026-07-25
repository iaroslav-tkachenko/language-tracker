import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  createActivityType,
  createLanguageBoard,
} from "@/app/dashboard/actions";
import { ConfirmSignOutForm } from "@/components/auth/confirm-sign-out-form";
import { ResourceCreateForm } from "@/components/resources/resource-create-form";
import {
  ActivitySettingsList,
  BoardSettingsList,
} from "@/components/settings/settings-resource-lists";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) redirect("/demo");

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/sign-in");

  const [boardsResult, activitiesResult] = await Promise.all([
    supabase
      .from("language_boards")
      .select("id, name, position")
      .is("archived_at", null)
      .order("position")
      .order("created_at"),
    supabase
      .from("activity_types")
      .select("id, name, system_key, position")
      .is("archived_at", null)
      .order("position")
      .order("created_at"),
  ]);

  if (boardsResult.error || activitiesResult.error) {
    console.error("Supabase settings read failed", {
      boards: boardsResult.error?.message,
      activities: activitiesResult.error?.message,
    });
    throw new Error("Settings could not be loaded.");
  }

  const boards = boardsResult.data;
  const activities = activitiesResult.data;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-17 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
            Study Time
          </Link>
          <ConfirmSignOutForm>
            <button
              type="submit"
              className="min-h-11 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            >
              Sign out
            </button>
          </ConfirmSignOutForm>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Settings
        </h1>
        <p className="mt-2 text-slate-600">
          Manage language boards and activities available across every board.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Languages</h2>
              <p className="mt-1 text-sm text-slate-500">
                {boards.length} of 6 active boards
              </p>
            </div>
            <div className="my-6">
              <BoardSettingsList boards={boards} />
            </div>
            <ResourceCreateForm
              action={createLanguageBoard}
              label="Add language"
              placeholder="For example, Italian"
              submitLabel="Add language"
            />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Activities</h2>
              <p className="mt-1 text-sm text-slate-500">
                {activities.length} of 30 active activities
              </p>
            </div>
            <div className="my-6">
              <ActivitySettingsList
                activities={activities.map((activity) => ({
                  id: activity.id,
                  name: activity.name,
                  systemKey: activity.system_key,
                }))}
              />
            </div>
            <ResourceCreateForm
              action={createActivityType}
              label="Add custom activity"
              placeholder="For example, Shadowing"
              submitLabel="Add activity"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
