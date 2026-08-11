import { fromDateKey } from "@/lib/dates/study-calendar";
import { STUDY_TIME_TRANSITIONS } from "@/lib/cefr/study-time";
import { VOCABULARY_LEVELS } from "@/lib/cefr/vocabulary";

type ForecastCalculationHelpProps = {
  effectiveDate: string;
  mode: "study" | "vocabulary" | "combined";
};

function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(fromDateKey(dateKey));
}

function formatHours(value: number) {
  return `${value.toLocaleString("en")} h`;
}

function formatHourRange(range: readonly [number, number]) {
  return `${range[0].toLocaleString("en")}-${range[1].toLocaleString("en")} h`;
}

function formatWords(value: number) {
  return `${value.toLocaleString("en")} words`;
}

function formatWordRange(range: readonly [number, number | null] | null) {
  if (!range) return "0 words";
  const [minimum, maximum] = range;
  if (maximum === null) return `${minimum.toLocaleString("en")}-8,000+ words`;
  return `${minimum.toLocaleString("en")}-${maximum.toLocaleString("en")} words`;
}

function StudyTimeReferenceTable() {
  const rows = STUDY_TIME_TRANSITIONS.reduce<
    Array<{
      transition: (typeof STUDY_TIME_TRANSITIONS)[number];
      cumulativeMin: number;
      cumulativeMax: number;
      cumulativeCalculation: number;
    }>
  >((result, transition) => {
    const previous = result.at(-1);
    return [
      ...result,
      {
        transition,
        cumulativeMin:
          (previous?.cumulativeMin ?? 0) + transition.indicativeRangeHours[0],
        cumulativeMax:
          (previous?.cumulativeMax ?? 0) + transition.indicativeRangeHours[1],
        cumulativeCalculation:
          (previous?.cumulativeCalculation ?? 0) + transition.calculationHours,
      },
    ];
  }, []);

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs font-bold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-3 py-3">Step</th>
            <th className="px-3 py-3">Typical hours for this step</th>
            <th className="px-3 py-3">Hours used in the app</th>
            <th className="px-3 py-3">Total typical hours from A0</th>
            <th className="px-3 py-3">Total hours used in the app</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map(
            ({
              transition,
              cumulativeMin,
              cumulativeMax,
              cumulativeCalculation,
            }) => (
              <tr key={`${transition.from}-${transition.to}`}>
                <th className="px-3 py-3 font-bold text-slate-900">
                  {transition.from} {"->"} {transition.to}
                </th>
                <td className="px-3 py-3">
                  {formatHourRange(transition.indicativeRangeHours)}
                </td>
                <td className="px-3 py-3 font-bold text-slate-900">
                  {formatHours(transition.calculationHours)}
                </td>
                <td className="px-3 py-3">
                  {formatHourRange([cumulativeMin, cumulativeMax])}
                </td>
                <td className="px-3 py-3 font-bold text-slate-900">
                  {formatHours(cumulativeCalculation)}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

function VocabularyReferenceTable() {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-[500px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs font-bold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-3 py-3">Level</th>
            <th className="px-3 py-3">Typical vocabulary range</th>
            <th className="px-3 py-3">Words used in the app</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {VOCABULARY_LEVELS.map((reference) => (
            <tr key={reference.level}>
              <th className="px-3 py-3 font-bold text-slate-900">
                {reference.level}
              </th>
              <td className="px-3 py-3">
                {formatWordRange(reference.indicativeRangeWords)}
              </td>
              <td className="px-3 py-3 font-bold text-slate-900">
                {formatWords(reference.midpointWords)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ForecastCalculationHelp({
  effectiveDate,
  mode,
}: ForecastCalculationHelpProps) {
  const isCombined = mode === "combined";
  const showStudyTime = mode === "study" || isCombined;
  const showVocabulary = mode === "vocabulary" || isCombined;
  const formattedDate = formatLongDate(effectiveDate);

  return (
    <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <summary className="cursor-pointer text-sm font-bold text-slate-700">
        {isCombined ? "How progress is calculated" : "How we calculate this"}
      </summary>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {isCombined
          ? `We estimate progress from your current declared level and the Study Time and Vocabulary recorded since that level's start date: ${formattedDate}. Future-dated sessions and word totals are not included.`
          : mode === "study"
            ? `We estimate Study Time progress from your current declared level and the study time recorded since that level's start date: ${formattedDate}. Future-dated sessions are not included.`
            : `We estimate Vocabulary progress from your current declared level and the words recorded since that level's start date: ${formattedDate}. Future-dated vocabulary totals are not included.`}
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {isCombined
          ? "The tables show typical ranges, the exact values the app uses for calculations, and the cumulative totals from A0 where applicable."
          : mode === "study"
            ? "The table shows typical hour ranges for each level step, the exact value the app uses for calculations, and the cumulative totals from A0."
            : "The table shows typical vocabulary ranges for each level, and the exact value the app uses for calculations."}
      </p>

      {showStudyTime && (
        <div className={isCombined ? "mt-5" : ""}>
          {isCombined && (
            <h3 className="text-sm font-bold text-slate-900">Study Time</h3>
          )}
          <StudyTimeReferenceTable />
        </div>
      )}

      {showVocabulary && (
        <div className={isCombined ? "mt-6" : ""}>
          {isCombined && (
            <h3 className="text-sm font-bold text-slate-900">Vocabulary</h3>
          )}
          <VocabularyReferenceTable />
        </div>
      )}

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {isCombined
          ? "Forecasts use your average pace over the last 7 and 30 calendar days, including days with no recorded study time or zero recorded words."
          : mode === "study"
            ? "Forecasts use your average pace over the last 7 and 30 calendar days, including days with no recorded study time."
            : "Forecasts use your average pace over the last 7 and 30 calendar days, including days with zero recorded words."}
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {isCombined || mode === "study"
          ? "These figures are approximate guides, not guaranteed timeframes. Progress can develop unevenly across skills depending on the activities you do most: more reading may move reading forward faster, more speaking practice may move speaking forward faster, and the same applies to listening and writing."
          : "Recorded words are an approximate progress signal. The app stores daily totals, not individual words, so repeated vocabulary cannot be deduplicated. Skill progress can develop unevenly depending on the activities you do most: reading, speaking, listening, and writing may not all grow at the same pace."}
      </p>

      {isCombined && (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The app stores daily vocabulary totals, not individual words, so
          repeated vocabulary cannot be deduplicated.
        </p>
      )}
    </details>
  );
}
