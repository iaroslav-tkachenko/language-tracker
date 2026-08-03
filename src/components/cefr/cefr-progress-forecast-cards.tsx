"use client";

import { BookOpen, Clock3 } from "lucide-react";

import {
  formatCalendarDuration,
  formatEstimatedMonth,
  formatForecastHours,
  formatPaceMinutes,
  type StudyTimeForecast,
} from "@/lib/cefr/study-time";
import {
  formatVocabularyPace,
  formatVocabularyWords,
  type VocabularyForecast,
} from "@/lib/cefr/vocabulary";

function CompactForecastCard({
  accent,
  forecast,
  icon,
  title,
}: {
  accent: "blue" | "green";
  forecast: StudyTimeForecast | VocabularyForecast;
  icon: React.ReactNode;
  title: string;
}) {
  if (forecast.status === "no-level") return null;

  const accentClasses =
    accent === "green"
      ? {
          border: "border-emerald-200",
          bg: "bg-emerald-50/70",
          icon: "bg-emerald-50 text-emerald-700",
          text: "text-emerald-700",
          bar: "bg-emerald-600",
          tableBorder: "border-emerald-100",
        }
      : {
          border: "border-blue-200",
          bg: "bg-blue-50/70",
          icon: "bg-blue-50 text-blue-600",
          text: "text-blue-700",
          bar: "bg-blue-600",
          tableBorder: "border-blue-100",
        };

  if (forecast.status === "highest-level") {
    const total =
      "estimatedTotalLearningMinutes" in forecast
        ? formatForecastHours(forecast.estimatedTotalLearningMinutes)
        : formatVocabularyWords(forecast.estimatedVocabularySize);
    const totalLabel =
      "estimatedTotalLearningMinutes" in forecast
        ? "Estimated learning time"
        : "Estimated words known";

    return (
      <section
        className={`rounded-3xl border ${accentClasses.border} ${accentClasses.bg} p-5`}
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${accentClasses.icon}`}
          >
            {icon}
          </span>
          <div>
            <h3 className="text-xl font-black text-slate-950">{title}</h3>
            <p className="mt-1 leading-7 text-slate-600">
              {forecast.currentLevel} is the highest level in this model, so
              there is no next-level forecast.
            </p>
            <p className="mt-3 text-sm font-bold tracking-wide text-slate-500 uppercase">
              {totalLabel}
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              &gt; {total}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const isStudyTime = "estimatedTotalLearningMinutes" in forecast;
  const completedPercent = Math.round(forecast.progressRatio * 100);
  const baseline = isStudyTime
    ? formatForecastHours(forecast.baselineMinutes)
    : formatVocabularyWords(forecast.baselineWords);
  const added = isStudyTime
    ? formatForecastHours(forecast.eligibleMinutes)
    : formatVocabularyWords(forecast.eligibleWords);
  const estimatedNow = isStudyTime
    ? formatForecastHours(forecast.estimatedTotalLearningMinutes)
    : formatVocabularyWords(forecast.estimatedVocabularySize);
  const nextTotal = isStudyTime
    ? formatForecastHours(forecast.nextLevelBaselineMinutes)
    : formatVocabularyWords(forecast.nextLevelBaselineWords);
  const remaining = isStudyTime
    ? formatForecastHours(forecast.remainingMinutes)
    : formatVocabularyWords(forecast.remainingWords);
  const paceColumns = [forecast.sevenDayPace, forecast.thirtyDayPace];

  return (
    <section
      className={`rounded-3xl border ${accentClasses.border} bg-white p-4 shadow-sm`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${accentClasses.icon}`}
        >
          {icon}
        </span>
        <div>
          <h3 className="text-lg font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            Approximate progress from {forecast.currentLevel} to{" "}
            {forecast.nextLevel}.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1.15fr_1fr]">
        <div>
          <p className="text-xs font-black tracking-wide text-slate-500 uppercase">
            Current
          </p>
          <p className="mt-2 flex items-center gap-2">
            <span className="flex size-11 items-center justify-center rounded-full bg-slate-950 text-base font-black text-white">
              {forecast.currentLevel}
            </span>
            <span className="text-base text-slate-600">≈ {baseline}</span>
          </p>
        </div>

        <div className="text-left md:text-center">
          <p
            className={`text-xs font-black tracking-wide uppercase ${accentClasses.text}`}
          >
            Progress
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">+{added}</p>
          <p className="mt-1 text-base text-slate-600">≈ {estimatedNow} now</p>
        </div>

        <div className="md:text-right">
          <p className="text-xs font-black tracking-wide text-slate-500 uppercase">
            Next
          </p>
          <p className="mt-2 flex items-center gap-2 md:justify-end">
            <span className="text-base text-slate-600">
              ≈ {nextTotal} total
            </span>
            <span className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-base font-black text-slate-500">
              {forecast.nextLevel}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${accentClasses.bar}`}
            style={{ width: `${completedPercent}%` }}
          />
        </div>
        <p
          className={`mt-3 text-center text-base font-black ${accentClasses.text}`}
        >
          {completedPercent}% completed
          <span className="px-2 text-slate-300">•</span>
          <span className="text-slate-700">≈ {remaining} left</span>
        </p>
      </div>

      <div
        className={`mt-5 rounded-2xl border ${accentClasses.tableBorder} ${accentClasses.bg} p-3`}
      >
        <h4 className={`text-lg font-black ${accentClasses.text}`}>
          Forecast to reach {forecast.nextLevel} with your current pace
        </h4>
        <p className="mt-1 text-sm text-slate-600">
          Based on every calendar day in the last 7 and 30 days.
        </p>
        <div className="mt-3 max-w-2xl overflow-x-auto rounded-2xl border border-white/70 bg-white/80">
          <div
            className={`grid min-w-[500px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder} text-base font-black ${accentClasses.text}`}
          >
            <div className="px-4 py-3 text-slate-500" />
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3">
                Last {pace.periodDays} days
              </div>
            ))}
          </div>
          <div
            className={`grid min-w-[500px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder}`}
          >
            <div className="px-4 py-3 text-slate-500">Active days</div>
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3 text-slate-700">
                {pace.entryDays} {pace.entryDays === 1 ? "day" : "days"}
              </div>
            ))}
          </div>
          <div
            className={`grid min-w-[500px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder}`}
          >
            <div className="px-4 py-3 text-slate-500">Average pace</div>
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3 text-slate-950">
                {"averageMinutes" in pace
                  ? formatPaceMinutes(pace.averageMinutes)
                  : formatVocabularyPace(pace.averageWords)}
              </div>
            ))}
          </div>
          <div
            className={`grid min-w-[500px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder}`}
          >
            <div className="px-4 py-3 text-slate-500">
              Reach {forecast.nextLevel} in
            </div>
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3 text-slate-950">
                {pace.estimate
                  ? `≈ ${formatCalendarDuration(pace.estimate.duration)}`
                  : "Not available"}
              </div>
            ))}
          </div>
          <div className="grid min-w-[500px] grid-cols-[1.05fr_1fr_1fr]">
            <div className="px-4 py-3 text-slate-500">Estimated date</div>
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3 text-slate-700">
                {pace.estimate
                  ? formatEstimatedMonth(pace.estimate.estimatedDate)
                  : "Not available"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CefrProgressForecastCards({
  studyTimeForecast,
  vocabularyForecast,
}: {
  studyTimeForecast: StudyTimeForecast;
  vocabularyForecast: VocabularyForecast;
}) {
  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-2xl font-black text-slate-950">
          Progress toward the next level
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Approximate Study Time and Vocabulary forecasts for this language.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <CompactForecastCard
          accent="blue"
          forecast={studyTimeForecast}
          icon={<Clock3 aria-hidden="true" className="size-5" />}
          title="Study Time progress"
        />
        <CompactForecastCard
          accent="green"
          forecast={vocabularyForecast}
          icon={<BookOpen aria-hidden="true" className="size-5" />}
          title="Vocabulary progress"
        />
      </div>
    </section>
  );
}
