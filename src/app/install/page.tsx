import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AppInstallCard } from "@/components/install/app-install-card";

export const metadata: Metadata = {
  title: "Install | Language Tracker",
  description: "Install Language Tracker on your phone or computer.",
};

export default function InstallPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <nav
          className="mb-8 flex items-center justify-between"
          aria-label="Installation page"
        >
          <Link href="/" className="font-bold text-slate-950">
            Language Tracker
          </Link>
          <Link
            href="/sign-in"
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            Sign in
          </Link>
        </nav>

        <header className="mb-6 text-center">
          <Image
            src="/icons/language-tracker-icon-192.png"
            alt="Language Tracker app icon"
            width={112}
            height={112}
            priority
            className="mx-auto size-28 rounded-[24px] shadow-lg"
          />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Install Language Tracker
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600">
            Add it to your home screen for quick access.
          </p>
        </header>

        <AppInstallCard />
      </div>
    </main>
  );
}
