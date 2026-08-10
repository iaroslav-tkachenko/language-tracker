import Link from "next/link";
import { Linkedin, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 sm:px-6">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        <span>Built with Codex by Iaroslav Tkachenko, Product Manager.</span>
        <a
          href="https://www.linkedin.com/in/iaroslav-tkachenko/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-blue-700 hover:underline"
        >
          <Linkedin aria-hidden="true" className="size-3.5" />
          LinkedIn
        </a>
        <span aria-hidden="true">·</span>
        <Link
          href="/privacy"
          className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-blue-700 hover:underline"
        >
          <ShieldCheck aria-hidden="true" className="size-3.5" />
          Privacy
        </Link>
      </div>
    </footer>
  );
}
