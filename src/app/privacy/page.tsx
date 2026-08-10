import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy | Language Tracker",
  description:
    "How Language Tracker stores and uses account and learning data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-bold text-slate-950">
            Language Tracker
          </Link>
          <Link
            href="/sign-in"
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-700 uppercase">
          <ShieldCheck aria-hidden="true" className="size-4.5" />
          Privacy
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Your learning data stays private
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Last updated August 10, 2026
        </p>
        <p className="mt-5 text-base leading-7 text-slate-700">
          Language Tracker is an independent service created by Iaroslav
          Tkachenko. It stores only the information needed to provide your
          private account and learning tracker.
        </p>

        <div className="mt-10 space-y-10">
          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Information we store
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>Your email address and authentication account details.</li>
              <li>
                Language boards, activity names, study sessions, vocabulary
                totals, and self-declared CEFR history that you save.
              </li>
              <li>
                Technical and authentication logs used to operate, secure, and
                troubleshoot the service.
              </li>
              <li>
                Your theme preference, stored locally in your browser rather
                than in your account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              How we use information
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              We use this information to authenticate you, display your saved
              learning history, calculate your private statistics and forecasts,
              deliver account emails, prevent abuse, and keep the service
              reliable. We do not sell your data or use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Services that process data
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Supabase provides authentication and database storage, Vercel
              hosts the application, and Brevo delivers transactional account
              emails. These providers process data only as needed to provide
              their services. Data may be processed in countries where these
              providers operate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Retention and your choices
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Your account data remains available while your account is active.
              You can edit or remove tracker records in the application. Some
              used resources are archived so historical statistics remain
              accurate. You can request access, correction, or deletion of your
              account data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Cookies and local storage
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Language Tracker uses essential authentication storage to keep you
              signed in and local storage to remember your theme. It does not
              use advertising cookies or third-party analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">Contact</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Questions or data requests can be sent to:
            </p>
            <a
              href="mailto:language.tracker.app@gmail.com"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
            >
              <Mail aria-hidden="true" className="size-4" />
              language.tracker.app@gmail.com
            </a>
          </section>
        </div>
      </article>
    </main>
  );
}
