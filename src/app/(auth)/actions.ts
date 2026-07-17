"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";

import { getSiteUrl, isSupabaseConfigured } from "@/lib/env";
import {
  credentialsSchema,
  emailSchema,
  resetPasswordSchema,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function configurationError(): AuthActionState | null {
  return isSupabaseConfigured()
    ? null
    : {
        status: "error",
        message:
          "Authentication is not connected yet. Add the Supabase values from .env.example.",
      };
}

function validationError(error: z.ZodError): AuthActionState {
  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function authError(message: string): AuthActionState {
  return { status: "error", message };
}

export async function signIn(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const configError = configurationError();
  if (configError) return configError;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return authError("Email or password is incorrect.");

  redirect("/dashboard");
}

export async function signUp(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const configError = configurationError();
  if (configError) return configError;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return authError("Account creation failed. Please try again.");
  if (data.session) redirect("/dashboard");

  return {
    status: "success",
    message: "Check your email and follow the confirmation link to continue.",
  };
}

export async function requestPasswordReset(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const configError = configurationError();
  if (configError) return configError;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/update-password`,
  });

  return {
    status: "success",
    message:
      "If an account exists for this email, a password reset link is on its way.",
  };
}

export async function updatePassword(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const configError = configurationError();
  if (configError) return configError;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub)
    return authError("This recovery link is invalid or expired.");

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error)
    return authError("Password update failed. Request a new recovery link.");

  redirect("/dashboard?password=updated");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/sign-in");
}
