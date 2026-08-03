import { GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";

export function CefrLevelPrompt({
  href,
  context,
  accent = "violet",
}: {
  href: string;
  context: "study" | "vocabulary" | "statistics";
  accent?: "blue" | "green" | "violet";
}) {
  const accentClasses = {
    blue: "border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100",
    green:
      "border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100",
    violet:
      "border-violet-200 bg-violet-50/80 text-violet-700 hover:bg-violet-100",
  };
  const text = {
    study:
      "Set your current language level to unlock more detailed Study Time progress analytics.",
    vocabulary:
      "Set your current language level to unlock more detailed Vocabulary progress analytics.",
    statistics:
      "Set your current language level to unlock estimated totals and richer progress analytics.",
  };

  return (
    <section
      aria-label="Language level setup"
      className={`rounded-3xl border p-4 shadow-sm sm:p-5 ${accentClasses[accent]}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/80">
            <GraduationCap aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Add your current level
            </h2>
            <p className="mt-1 max-w-3xl leading-7 text-slate-700">
              {text[context]}
            </p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 font-bold text-white hover:bg-slate-800"
        >
          <Sparkles aria-hidden="true" className="size-4.5" />
          Set level
        </Link>
      </div>
    </section>
  );
}

export function MissingLevelBubble() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-amber-400 text-[13px] font-black leading-none text-slate-950 ring-2 ring-white"
    >
      !
    </span>
  );
}
