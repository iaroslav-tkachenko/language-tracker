import { Languages } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { createFirstLanguageBoard } from "@/app/dashboard/actions";
import { ResourceCreateForm } from "@/components/resources/resource-create-form";

export function FirstBoardOnboarding() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-950">
            Language Tracker
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-950"
            >
              Sign out
            </button>
          </form>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Languages aria-hidden="true" className="size-7" />
          </div>
          <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase">
            Your first board
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Create your first language board
          </h1>
          <p className="mt-4 max-w-md leading-7 text-slate-600">
            Use one board for each language. Your study sessions, heatmap, and
            statistics will stay separate.
          </p>

          <div className="mt-8">
            <ResourceCreateForm
              action={createFirstLanguageBoard}
              label="Language"
              placeholder="For example, German"
              submitLabel="Create language board"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
