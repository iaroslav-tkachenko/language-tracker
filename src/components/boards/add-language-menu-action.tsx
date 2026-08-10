"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";

import {
  createLanguageBoardAndRedirect,
  type ResourceActionState,
} from "@/app/dashboard/actions";

type AddLanguageMenuActionProps = {
  boards: { id: string; name: string }[];
  destination: "statistics" | "cefr";
  accent: "blue" | "violet";
};

const initialActionState: ResourceActionState = { status: "idle" };

const accentClasses = {
  blue: {
    action: "text-blue-700 hover:bg-blue-50",
    input: "focus:border-blue-600 focus:ring-blue-100",
    confirm: "bg-blue-600 disabled:bg-blue-300",
  },
  violet: {
    action: "text-violet-700 hover:bg-violet-50",
    input: "focus:border-violet-600 focus:ring-violet-100",
    confirm: "bg-violet-600 disabled:bg-violet-300",
  },
} as const;

export function AddLanguageMenuAction({
  boards,
  destination,
  accent,
}: AddLanguageMenuActionProps) {
  const [state, formAction, pending] = useActionState(
    createLanguageBoardAndRedirect,
    initialActionState,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const trimmedName = name.trim();
  const duplicateName = boards.some(
    (board) => board.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  const limitReached = boards.length >= 6;
  const canCreate =
    trimmedName.length > 0 &&
    trimmedName.length <= 50 &&
    !duplicateName &&
    !limitReached;
  const colors = accentClasses[accent];

  return (
    <>
      <div className="mt-2 border-t border-slate-100 pt-2">
        {limitReached ? (
          <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-500">
            You can have up to 6 active language boards. Remove one in Settings
            before adding another.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${colors.action}`}
          >
            <Plus aria-hidden="true" className="size-4" />
            Add language
          </button>
        )}
      </div>

      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-add-language-heading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4"
        >
          <form
            action={formAction}
            onSubmit={(event) => {
              if (!canCreate) event.preventDefault();
            }}
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <input type="hidden" name="destination" value={destination} />
            <h2
              id="menu-add-language-heading"
              className="text-lg font-bold text-slate-950"
            >
              Add language
            </h2>
            <label className="mt-4 block text-sm font-semibold text-slate-800">
              Language name
              <input
                name="name"
                required
                maxLength={50}
                autoComplete="off"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="German"
                className={`mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base text-slate-950 outline-none focus:ring-2 ${colors.input}`}
              />
            </label>
            {duplicateName && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                You already have an active board with this name.
              </p>
            )}
            {state.status === "error" && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {state.message}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                  setName("");
                }}
                className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canCreate || pending}
                className={`min-h-11 flex-1 rounded-xl px-4 font-semibold text-white disabled:cursor-not-allowed ${colors.confirm}`}
              >
                {pending ? "Adding..." : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
