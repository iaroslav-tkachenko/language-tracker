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
};

export function ResourceCreateForm({
  action,
  label,
  placeholder,
  submitLabel,
}: ResourceCreateFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <label className="block text-sm font-semibold text-slate-800">
        {label}
        <input
          name="name"
          required
          maxLength={50}
          autoComplete="off"
          placeholder={placeholder}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 shadow-sm placeholder:text-slate-400"
        />
      </label>
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm text-red-700"
              : "text-sm text-emerald-700"
          }
        >
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:bg-blue-300"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
