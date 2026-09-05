import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  createActivityType,
  createLanguageBoard,
} from "@/app/dashboard/actions";
import { ConfirmSignOutForm } from "@/components/auth/confirm-sign-out-form";
import { AppInstallCard } from "@/components/install/app-install-card";
import { ResourceCreateForm } from "@/components/resources/resource-create-form";
import {
  ActivitySettingsList,
  BoardSettingsList,
} from "@/components/settings/settings-resource-lists";
import { ThemeSelector } from "@/components/settings/theme-selector";
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
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex min-h-14 max-w-4xl items-center justify-between">
            <Link
              href="/dashboard"
              className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              <ArrowLeft aria-hidden="true" className="size-4.5" />
              Home screen
            </Link>
            <ConfirmSignOutForm>
              <button
                type="submit"
                className="min-h-9 rounded-lg px-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                Sign out
              </button>
            </ConfirmSignOutForm>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold text-slate-950">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your language boards and activity library.
        </p>

        <div className="mt-6 grid max-w-4xl items-start gap-4 lg:grid-cols-2">
          <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Languages</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {boards.length} of 6 active boards
              </p>
            </div>
            <div className="my-3">
              <BoardSettingsList boards={boards} />
            </div>
            <div className="mt-auto pt-3">
              <ResourceCreateForm
                action={createLanguageBoard}
                label="Add language"
                placeholder="For example, Italian"
                submitLabel="Add language"
                compact
              />
            </div>
          </section>

          <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Activities</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {activities.length} of 30 active activities
              </p>
            </div>
            <div className="my-3">
              <ActivitySettingsList
                activities={activities.map((activity) => ({
                  id: activity.id,
                  name: activity.name,
                  systemKey: activity.system_key,
                }))}
              />
            </div>
            <div className="mt-auto pt-3">
              <ResourceCreateForm
                action={createActivityType}
                label="Add custom activity"
                placeholder="For example, Shadowing"
                submitLabel="Add activity"
                compact
              />
            </div>
          </section>
        </div>

        <ThemeSelector />
        <AppInstallCard compact />

        <section className="mt-6 max-w-4xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Image
                src="/iaroslav-open-to-work.png"
                alt="Iaroslav Tkachenko, open to work"
                width={80}
                height={80}
                className="size-20 shrink-0 rounded-full object-cover"
              />
              <div className="max-w-2xl">
                <h2 className="text-base font-bold text-slate-950">
                  Hi, I&apos;m Iaroslav.
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  I&apos;m a Product Manager with more than five years of
                  experience. I built Language Tracker for my own learning with
                  Codex. I enjoy turning ideas into useful products with AI. If
                  you are looking for a Product Manager who works confidently
                  with AI, or know someone who is, I&apos;d love to connect on
                  LinkedIn.
                </p>
              </div>
            </div>
            <a
              href="https://www.linkedin.com/in/iaroslav-tkachenko"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0a66c2] px-3 text-sm font-semibold text-white hover:bg-[#004182]"
            >
              <span
                aria-hidden="true"
                className="flex size-4 items-center justify-center rounded-sm border border-white/80 text-[10px] font-bold leading-none"
              >
                in
              </span>
              LinkedIn
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
