import { Check, Target } from "lucide-react";

import {
  getWeeklyHours,
  WEEKLY_PLAN_HOURS,
  type RecommendationActivity,
  type WeeklyRecommendation,
} from "@/lib/cefr/recommendations";

const activityColors: Record<RecommendationActivity, string> = {
  Vocabulary: "#10b981",
  Grammar: "#8b5cf6",
  Shadowing: "#3b82f6",
  Conversation: "#f97316",
  Listening: "#06b6d4",
  Reading: "#f59e0b",
};

function formatHours(hours: number) {
  return `${hours.toLocaleString("en", {
    maximumFractionDigits: Number.isInteger(hours) ? 0 : 1,
  })}h`;
}

function chartBackground(recommendation: WeeklyRecommendation) {
  let cursor = 0;
  const segments = recommendation.segments.map((segment) => {
    const start = cursor;
    const end = cursor + segment.percent;
    cursor = end;
    return `${activityColors[segment.activity]} ${start}% ${end}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

export function WeeklyPlanCard({
  recommendation,
}: {
  recommendation: WeeklyRecommendation;
}) {
  return (
    <section className="rounded-4xl border border-violet-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <Target aria-hidden="true" className="size-6" />
        </span>
        <div>
          <h2 className="text-2xl font-black text-slate-950">
            Weekly plan to reach {recommendation.targetLevel}
          </h2>
          <p className="mt-1 text-slate-600">
            A suggested {WEEKLY_PLAN_HOURS}-hour weekly mix for faster progress.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.55fr]">
        <div className="rounded-3xl bg-slate-50 p-5">
          <div className="grid gap-5 sm:grid-cols-[220px_1fr] sm:items-center lg:grid-cols-1">
            <div
              aria-hidden="true"
              className="relative mx-auto size-56 rounded-full"
              style={{ background: chartBackground(recommendation) }}
            >
              <div className="absolute inset-9 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                <strong className="text-4xl font-black text-slate-950">
                  {WEEKLY_PLAN_HOURS}h
                </strong>
                <span className="text-slate-500">per week</span>
              </div>
            </div>

            <ul className="space-y-3">
              {recommendation.segments.map((segment) => {
                const hours = getWeeklyHours(segment.percent);
                return (
                  <li
                    key={segment.activity}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="inline-flex min-w-0 items-center gap-3 text-slate-700">
                      <span
                        aria-hidden="true"
                        className="size-3.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: activityColors[segment.activity],
                        }}
                      />
                      <span className="truncate">{segment.activity}</span>
                    </span>
                    <strong className="shrink-0 text-slate-950">
                      {segment.percent}% · {formatHours(hours)}
                    </strong>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-950">
            How to use this plan
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recommendation.advice.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Check aria-hidden="true" className="size-4.5" />
                  </span>
                  <p className="leading-7 text-slate-700">
                    <strong className="text-slate-950">{item.title}</strong>{" "}
                    {item.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
