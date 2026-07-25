import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getSiteUrl, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const supportedEmailTypes = new Set<EmailOtpType>(["email", "recovery"]);

function safeNext(value: string | null, type: EmailOtpType | null) {
  const fallback = type === "recovery" ? "/update-password" : "/dashboard";
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function parseEmailType(value: string | null): EmailOtpType | null {
  return supportedEmailTypes.has(value as EmailOtpType)
    ? (value as EmailOtpType)
    : null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = parseEmailType(requestUrl.searchParams.get("type"));
  const next = safeNext(requestUrl.searchParams.get("next"), type);
  const siteUrl = getSiteUrl();

  if (!isSupabaseConfigured() || !tokenHash || !type) {
    return NextResponse.redirect(
      new URL("/sign-in?error=confirmation", siteUrl),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/sign-in?error=confirmation", siteUrl),
    );
  }

  return NextResponse.redirect(new URL(next, siteUrl));
}
