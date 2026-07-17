import { redirect } from "next/navigation";

import { signOut } from "@/app/(auth)/actions";
import { LanguageTrackerDemo } from "@/components/language-tracker-demo";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) redirect("/demo");

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/sign-in");

  return (
    <>
      <div className="border-b border-blue-100 bg-blue-50 px-4 py-2 text-center text-sm text-blue-900">
        Authentication foundation preview ·{" "}
        <form action={signOut} className="inline">
          <button
            type="submit"
            className="font-semibold underline underline-offset-2"
          >
            Sign out
          </button>
        </form>
      </div>
      <LanguageTrackerDemo />
    </>
  );
}
