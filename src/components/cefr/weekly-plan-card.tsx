import { Check } from "lucide-react";

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
    <section className="rounded-3xl border border-violet-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-xl font-bold text-slate-950">
          Weekly plan to reach {recommendation.targetLevel}
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          For meaningful progress, we recommend studying your chosen language
          for at least 10 focused hours each week. This does not mean you need
          to spend all that time with textbooks or grammar drills. It also
          includes focused listening and watching, such as podcasts, videos, and
          TV shows. This plan shows one suggested mix for your next level.
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.55fr]">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-[170px_1fr] sm:items-center lg:grid-cols-1">
            <div
              aria-hidden="true"
              className="relative mx-auto size-44 rounded-full"
              style={{ background: chartBackground(recommendation) }}
            >
              <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                <strong className="text-2xl font-bold text-slate-950">
                  {WEEKLY_PLAN_HOURS}h
                </strong>
                <span className="text-sm text-slate-500">per week</span>
              </div>
            </div>

            <ul className="space-y-2 text-sm">
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
                    <strong className="shrink-0 text-sm text-slate-950">
                      {segment.percent}% · {formatHours(hours)}
                    </strong>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-950">
            How to use this plan
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {recommendation.advice.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Check aria-hidden="true" className="size-4" />
                  </span>
                  <p className="text-sm leading-6 text-slate-700">
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
