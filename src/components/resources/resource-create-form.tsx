"use client";

import { useActionState } from "react";

import type { ResourceActionState } from "@/app/dashboard/actions";

const initialState: ResourceActionState = { status: "idle" };

type ResourceCreateFormProps = {
  action: (
    state: ResourceActionState,
    formData: FormData,
  ) => Promise<ResourceActionState>;
  label: string;
  placeholder: string;
  submitLabel: string;
  compact?: boolean;
};

export function ResourceCreateForm({
  action,
  label,
  placeholder,
  submitLabel,
  compact = false,
}: ResourceCreateFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className={compact ? "space-y-2" : "space-y-3"}>
      <label className="block text-sm font-semibold text-slate-800">
        {label}
        <input
          name="name"
          required
          maxLength={50}
          autoComplete="off"
          placeholder={placeholder}
          className={`mt-1.5 w-full border border-slate-300 bg-white text-slate-950 shadow-sm placeholder:text-slate-400 ${
            compact
              ? "min-h-9 rounded-lg px-2.5 text-sm"
              : "rounded-xl px-4 py-3 text-base"
          }`}
        />
      </label>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex w-full items-center justify-center bg-blue-600 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:bg-blue-300 ${
          compact
            ? "min-h-9 rounded-lg px-3 text-sm"
            : "min-h-11 rounded-xl px-5 py-3"
        }`}
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
