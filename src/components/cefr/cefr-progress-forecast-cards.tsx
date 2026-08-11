"use client";

import { BookOpen, Clock3 } from "lucide-react";

import { ForecastCalculationHelp } from "@/components/cefr/forecast-calculation-help";
import {
  PROGRESS_FORECAST_DESCRIPTION,
  highestLevelDescription,
  progressForecastDescription,
} from "@/lib/cefr/copy";
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

function formatCompactForecastValue(value: string, unit: "h" | "w") {
  return value.replace(/\s+(?:hour|hours|word|words)$/, ` ${unit}`);
}

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
        className={`min-w-0 rounded-3xl border ${accentClasses.border} ${accentClasses.bg} p-5 sm:p-6`}
      >
        <div className="flex min-w-0 items-start gap-4">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${accentClasses.icon}`}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-slate-950">{title}</h3>
            <p className="mt-1 leading-6 text-slate-600">
              {highestLevelDescription(forecast.currentLevel)}
            </p>
            <p className="mt-3 text-sm font-bold tracking-wide text-slate-500 uppercase">
              {totalLabel}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              &gt; {total}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const isStudyTime = "estimatedTotalLearningMinutes" in forecast;
  const completedPercent = Math.round(forecast.progressRatio * 100);
  const baseline = formatCompactForecastValue(
    isStudyTime
      ? formatForecastHours(forecast.baselineMinutes)
      : formatVocabularyWords(forecast.baselineWords),
    isStudyTime ? "h" : "w",
  );
  const added = isStudyTime
    ? formatForecastHours(forecast.eligibleMinutes)
    : formatVocabularyWords(forecast.eligibleWords);
  const estimatedNow = formatCompactForecastValue(
    isStudyTime
      ? formatForecastHours(forecast.estimatedTotalLearningMinutes)
      : formatVocabularyWords(forecast.estimatedVocabularySize),
    isStudyTime ? "h" : "w",
  );
  const nextTotal = formatCompactForecastValue(
    isStudyTime
      ? formatForecastHours(forecast.nextLevelBaselineMinutes)
      : formatVocabularyWords(forecast.nextLevelBaselineWords),
    isStudyTime ? "h" : "w",
  );
  const remaining = isStudyTime
    ? formatForecastHours(forecast.remainingMinutes)
    : formatVocabularyWords(forecast.remainingWords);
  const paceColumns = [forecast.sevenDayPace, forecast.thirtyDayPace];

  return (
    <section
      className={`min-w-0 overflow-hidden rounded-3xl border ${accentClasses.border} bg-white p-5 shadow-sm sm:p-6`}
    >
      <div className="flex min-w-0 items-start gap-4">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${accentClasses.icon}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {progressForecastDescription(
              forecast.currentLevel,
              forecast.nextLevel,
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            Current
          </p>
          <p className="mt-2 flex min-h-11 items-center gap-2">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {forecast.currentLevel}
            </span>
            <span className="min-w-0 text-sm leading-5 text-slate-600">
              ≈ {baseline}
            </span>
          </p>
        </div>

        <div className="min-w-0 text-left md:text-center">
          <p
            className={`text-xs font-bold tracking-wide uppercase ${accentClasses.text}`}
          >
            Progress
          </p>
          <p className="mt-2 text-xl font-bold leading-6 text-slate-950">
            +{added}
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            ≈ {estimatedNow} now
          </p>
        </div>

        <div className="min-w-0 md:text-right">
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            Next
          </p>
          <p className="mt-2 flex min-h-11 items-center gap-2 md:justify-end">
            <span className="min-w-0 text-sm leading-5 text-slate-600">
              ≈ {nextTotal} total
            </span>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
              {forecast.nextLevel}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${accentClasses.bar}`}
            style={{ width: `${completedPercent}%` }}
          />
        </div>
        <p
          className={`mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-base font-bold ${accentClasses.text}`}
        >
          <span>{completedPercent}% completed</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-700">≈ {remaining} left</span>
        </p>
      </div>

      <div
        className={`mt-8 rounded-2xl border ${accentClasses.tableBorder} ${accentClasses.bg} p-4`}
      >
        <h4 className="break-words text-base font-bold text-slate-700">
          Forecast to reach {forecast.nextLevel} with your current pace
        </h4>
        <div className="mt-4 w-full max-w-full overflow-x-auto rounded-2xl border border-white/70 bg-white/80">
          <div
            className={`grid min-w-[440px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder} text-sm font-bold text-slate-700`}
          >
            <div className="px-3 py-3 text-slate-500" />
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-3 py-3">
                Last {pace.periodDays} days
              </div>
            ))}
          </div>
          <div
            className={`grid min-w-[440px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder}`}
          >
            <div className="px-3 py-3 text-sm text-slate-700">Active days</div>
            {paceColumns.map((pace) => (
              <div
                key={pace.periodDays}
                className="px-3 py-3 text-sm text-slate-700"
              >
                {pace.entryDays} {pace.entryDays === 1 ? "day" : "days"}
              </div>
            ))}
          </div>
          <div
            className={`grid min-w-[440px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder}`}
          >
            <div className="px-3 py-3 text-sm text-slate-700">Average pace</div>
            {paceColumns.map((pace) => (
              <div
                key={pace.periodDays}
                className="px-3 py-3 text-sm text-slate-700"
              >
                {"averageMinutes" in pace
                  ? formatPaceMinutes(pace.averageMinutes)
                  : formatVocabularyPace(pace.averageWords)}
              </div>
            ))}
          </div>
          <div
            className={`grid min-w-[440px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder}`}
          >
            <div className="px-3 py-3 text-sm text-slate-700">
              Reach {forecast.nextLevel} in
            </div>
            {paceColumns.map((pace) => (
              <div
                key={pace.periodDays}
                className="px-3 py-3 text-sm text-slate-700"
              >
                {pace.estimate
                  ? `≈ ${formatCalendarDuration(pace.estimate.duration)}`
                  : "Not available"}
              </div>
            ))}
          </div>
          <div className="grid min-w-[440px] grid-cols-[1.05fr_1fr_1fr]">
            <div className="px-3 py-3 text-sm text-slate-700">
              Estimated date
            </div>
            {paceColumns.map((pace) => (
              <div
                key={pace.periodDays}
                className="px-3 py-3 text-sm text-slate-700"
              >
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

function forecastEffectiveDate(
  forecast: StudyTimeForecast | VocabularyForecast,
) {
  return forecast.status === "no-level" ? null : forecast.effectiveDate;
}

export function CefrProgressForecastCards({
  studyTimeForecast,
  vocabularyForecast,
}: {
  studyTimeForecast: StudyTimeForecast;
  vocabularyForecast: VocabularyForecast;
}) {
  const effectiveDate = forecastEffectiveDate(studyTimeForecast);

  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-950">
          Progress toward the next level
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {PROGRESS_FORECAST_DESCRIPTION}
        </p>
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
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
      {effectiveDate && (
        <ForecastCalculationHelp
          effectiveDate={effectiveDate}
          mode="combined"
        />
      )}
    </section>
  );
}
