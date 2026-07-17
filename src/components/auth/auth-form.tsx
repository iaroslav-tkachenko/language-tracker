"use client";

import { useActionState } from "react";

import type { AuthActionState } from "@/app/(auth)/actions";

type AuthFormProps = {
  action: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  submitLabel: string;
  fields: Array<{
    name: "email" | "password" | "confirmPassword";
    label: string;
    type: "email" | "password";
    autoComplete: string;
    placeholder: string;
  }>;
};

export function AuthForm({ action, submitLabel, fields }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
  } satisfies AuthActionState);

  return (
    <form action={formAction} className="mt-7 space-y-5" noValidate>
      {fields.map((field) => {
        const errors = state.fieldErrors?.[field.name];
        return (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              aria-invalid={Boolean(errors)}
              aria-describedby={errors ? `${field.name}-error` : undefined}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 shadow-sm transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:outline-none"
            />
            {errors && (
              <p
                id={`${field.name}-error`}
                className="mt-1.5 text-sm text-red-700"
              >
                {errors[0]}
              </p>
            )}
          </div>
        );
      })}

      {state.message && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-xl px-4 py-3 text-sm ${
            state.status === "error"
              ? "bg-red-50 text-red-800"
              : "bg-green-50 text-green-800"
          }`}
        >
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
