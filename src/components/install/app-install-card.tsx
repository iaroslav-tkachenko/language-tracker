"use client";

import { CheckCircle2, Download, Share2, Smartphone } from "lucide-react";
import Link from "next/link";

import { useAppInstall } from "@/components/install/use-app-install";

export function AppInstallCard({ compact = false }: { compact?: boolean }) {
  const { state, isIOS, install } = useAppInstall();
  const installed = state === "standalone" || state === "installed";

  return (
    <section
      aria-labelledby={compact ? "settings-install-heading" : "install-heading"}
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${compact ? "mt-4 max-w-4xl p-3 sm:p-4" : "p-5 sm:p-7"}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          {installed ? (
            <CheckCircle2 aria-hidden="true" className="size-5" />
          ) : (
            <Smartphone aria-hidden="true" className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id={compact ? "settings-install-heading" : "install-heading"}
            className="text-base font-bold text-slate-950"
          >
            {installed
              ? "Language Tracker is installed"
              : compact
                ? "Install Language Tracker"
                : "How to install on your phone"}
          </h2>
          <p
            className="mt-1 text-sm leading-6 text-slate-600"
            aria-live="polite"
          >
            {installed
              ? "You are using Language Tracker from your home screen."
              : "Open Language Tracker directly from your home screen."}
          </p>

          {state === "installable" && (
            <button
              type="button"
              onClick={() => void install()}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Download aria-hidden="true" className="size-4" />
              Install app
            </button>
          )}

          {!installed && state !== "installable" && state !== "checking" && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              {isIOS ? (
                <p>
                  <Share2 aria-hidden="true" className="mr-1.5 inline size-4" />
                  Open <strong>Share</strong>, then choose{" "}
                  <strong>Add to Home Screen</strong>.
                </p>
              ) : state === "manual" ? (
                <p>
                  Tap your browser menu <strong>⋮</strong>, then choose{" "}
                  <strong>Install app</strong> or{" "}
                  <strong>Add to Home screen</strong>.
                </p>
              ) : (
                <p>
                  Installation is not available in this browser. You can keep
                  using Language Tracker in the browser or try a browser that
                  supports app installation.
                </p>
              )}
            </div>
          )}

          {!installed && (
            <p className="mt-3 text-xs leading-5 text-slate-500">
              No app store needed. Internet connection required.
            </p>
          )}
          {compact && (
            <Link
              href="/install"
              className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:underline"
            >
              Installation help
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
