"use client";

import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Clock3,
  Flame,
  Headphones,
  Layers3,
  MessagesSquare,
  PenLine,
  Pencil,
  Plus,
  Settings,
  Shapes,
  SpellCheck2,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

type View = "study" | "statistics";
type StudyEntry = {
  id: number;
  date: string;
  duration: number;
  activity: string;
};
type CalendarCell = {
  date: Date;
  dateKey: string;
  inYear: boolean;
  week: number;
  weekday: number;
};

const quickDurations = [10, 15, 20, 30, 45, 60, 90, 120];
const initialActivities = [
  "Reading",
  "Podcast",
  "Speaking",
  "Writing",
  "Anki",
  "Grammar",
  "TV Show / Film",
];
const standardActivityIcons: Record<string, LucideIcon> = {
  Reading: BookOpen,
  Podcast: Headphones,
  Speaking: MessagesSquare,
  Writing: PenLine,
  Anki: Layers3,
  Grammar: SpellCheck2,
  "TV Show / Film": Clapperboard,
};
const heatColors = {
  pastEmpty: "#f2aaa4",
  empty: "#f8fafc",
  levels: ["#fff1b8", "#ffe18a", "#f7c95e", "#b8d79c", "#78b76d", "#3f8249"],
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(fromDateKey(dateKey));
}

function shiftDate(dateKey: string, offset: number) {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
}

function getCalendarCells(year: number): CalendarCell[] {
  const start = new Date(year, 0, 1);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 53 * 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      dateKey: toDateKey(date),
      inYear: date.getFullYear() === year,
      week: Math.floor(index / 7),
      weekday: index % 7,
    };
  });
}

function demoMinutes(date: Date, todayKey: string) {
  if (toDateKey(date) > todayKey) return 0;
  const start = new Date(date.getFullYear(), 0, 1);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  const hash = Math.abs((day * 47 + date.getFullYear() * 13) % 19);
  if (hash < 3) return 0;
  if (hash < 7) return 10;
  if (hash < 11) return 25;
  if (hash < 15) return 45;
  if (hash < 17) return 75;
  if (hash === 17) return 135;
  return 190;
}

function heatLevel(minutes: number) {
  if (minutes <= 0) return 0;
  if (minutes <= 14) return 1;
  if (minutes <= 29) return 2;
  if (minutes <= 59) return 3;
  if (minutes <= 119) return 4;
  if (minutes <= 180) return 5;
  return 6;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function heatColor(minutes: number, dateKey: string, todayKey: string) {
  if (minutes <= 0)
    return dateKey < todayKey ? heatColors.pastEmpty : heatColors.empty;
  return heatColors.levels[heatLevel(minutes) - 1];
}

export function LanguageTrackerDemo() {
  const todayKey = toDateKey(new Date());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [entries, setEntries] = useState<StudyEntry[]>([
    { id: 1, date: todayKey, duration: 30, activity: "Anki" },
  ]);
  const [activities, setActivities] = useState(initialActivities);
  const [boards, setBoards] = useState(["German", "English"]);
  const [activeBoard, setActiveBoard] = useState("German");
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState<View>("study");

  const calendarCells = useMemo(() => getCalendarCells(year), [year]);
  const entryMinutes = useMemo(
    () =>
      entries.reduce<Record<string, number>>((totals, entry) => {
        totals[entry.date] = (totals[entry.date] ?? 0) + entry.duration;
        return totals;
      }, {}),
    [entries],
  );
  const selectedEntries = entries.filter(
    (entry) => entry.date === selectedDate,
  );
  const selectedDayTotal = selectedEntries.reduce(
    (total, entry) => total + entry.duration,
    0,
  );
  const annualMinutes = calendarCells.reduce(
    (total, cell) =>
      cell.inYear
        ? total +
          demoMinutes(cell.date, todayKey) +
          (entryMinutes[cell.dateKey] ?? 0)
        : total,
    0,
  );
  const activeDays = calendarCells.filter(
    (cell) =>
      cell.inYear &&
      cell.dateKey <= todayKey &&
      demoMinutes(cell.date, todayKey) + (entryMinutes[cell.dateKey] ?? 0) > 0,
  ).length;

  function saveEntry() {
    const duration = customDuration ? Number(customDuration) : selectedDuration;
    if (!duration || duration < 1 || duration > 1440 || !selectedActivity)
      return;
    setEntries((current) => [
      ...current,
      {
        id: Date.now(),
        date: selectedDate,
        duration,
        activity: selectedActivity,
      },
    ]);
    setSelectedActivity("");
    setSelectedDuration(null);
    setCustomDuration("");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid min-h-17 max-w-[1540px] grid-cols-[1fr_auto] items-center gap-x-3 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
          <div className="relative col-start-1 row-start-1 min-w-0 lg:col-start-auto lg:row-start-auto">
            <button
              type="button"
              className="flex min-w-0 items-center gap-2 rounded-xl px-2 py-2 text-left font-semibold hover:bg-slate-100"
              onClick={() => setBoardMenuOpen((open) => !open)}
              aria-expanded={boardMenuOpen}
            >
              <span className="truncate">{activeBoard}</span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
            {boardMenuOpen ? (
              <div className="absolute left-0 top-12 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                {boards.map((board) => (
                  <button
                    key={board}
                    type="button"
                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                      board === activeBoard
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      setActiveBoard(board);
                      setBoardMenuOpen(false);
                    }}
                  >
                    {board}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <nav
            className="col-span-2 col-start-1 row-start-2 flex min-w-0 justify-center self-end lg:col-span-1 lg:col-start-auto lg:row-start-auto"
            aria-label="Tracker navigation"
          >
            <button
              type="button"
              className={`flex h-12 items-center gap-2 border-b-3 px-3 text-sm font-semibold sm:px-5 sm:text-base ${
                view === "study"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600"
              }`}
              onClick={() => setView("study")}
            >
              <Clock3 className="h-5 w-5" /> Study Time
            </button>
            <button
              type="button"
              className="flex h-12 cursor-not-allowed items-center gap-2 border-b-3 border-transparent px-3 text-sm text-slate-400 sm:px-5 sm:text-base"
              disabled
            >
              <BookOpen className="h-5 w-5" /> Vocabulary
              <span className="hidden rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-500 sm:inline">
                Coming soon
              </span>
            </button>
          </nav>

          <nav
            className="fixed right-2 top-2 z-40 flex min-w-0 items-center justify-end gap-1 bg-white/95 lg:static lg:col-start-auto lg:row-start-auto lg:bg-transparent"
            aria-label="Primary navigation"
          >
            <button
              type="button"
              className={`rounded-xl px-2 py-2 text-sm font-semibold sm:px-3 ${view === "statistics" ? "bg-blue-50 text-blue-700" : "text-blue-600 hover:bg-blue-50"}`}
              onClick={() => setView("statistics")}
            >
              Statistics
            </button>
            <span className="mx-1 h-7 w-px bg-slate-200" aria-hidden="true" />
            <button
              type="button"
              className="rounded-xl p-2.5 text-slate-700 hover:bg-slate-100"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-[1540px] px-4 pb-12 pt-4 sm:px-6 lg:px-10">
        <section className="min-w-0" aria-labelledby="year-heading">
          <div className="mb-4 flex items-center gap-4 sm:gap-5">
            <YearButton
              label="Previous year"
              onClick={() => setYear((value) => value - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </YearButton>
            <h1
              id="year-heading"
              className="min-w-24 text-center text-3xl font-bold tracking-tight"
            >
              {year}
            </h1>
            <YearButton
              label="Next year"
              onClick={() => setYear((value) => value + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </YearButton>
          </div>

          <Heatmap
            year={year}
            cells={calendarCells}
            selectedDate={selectedDate}
            todayKey={todayKey}
            entryMinutes={entryMinutes}
            onSelect={setSelectedDate}
          />
        </section>

        <SummaryCards
          annualMinutes={annualMinutes}
          activeDays={activeDays}
          year={year}
        />

        {view === "statistics" ? (
          <StatisticsPreview year={year} />
        ) : (
          <DayPanel
            date={selectedDate}
            todayKey={todayKey}
            entries={selectedEntries}
            total={selectedDayTotal}
            activities={activities}
            selectedActivity={selectedActivity}
            selectedDuration={selectedDuration}
            customDuration={customDuration}
            onActivity={setSelectedActivity}
            onDuration={(duration) => {
              setSelectedDuration(duration);
              setCustomDuration("");
            }}
            onCustomDuration={(value) => {
              setCustomDuration(value);
              setSelectedDuration(null);
            }}
            onDelete={(id) =>
              setEntries((current) =>
                current.filter((entry) => entry.id !== id),
              )
            }
            onSave={saveEntry}
            onDate={(date) => {
              setSelectedDate(date);
              setYear(fromDateKey(date).getFullYear());
            }}
            onOther={() => setSettingsOpen(true)}
          />
        )}
      </main>

      {settingsOpen ? (
        <SettingsDrawer
          activities={activities}
          boards={boards}
          onActivities={setActivities}
          onBoards={setBoards}
          onBoard={setActiveBoard}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </div>
  );
}

function YearButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="rounded-xl border border-slate-300 p-2 hover:bg-slate-50"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function SummaryCards({
  annualMinutes,
  activeDays,
  year,
}: {
  annualMinutes: number;
  activeDays: number;
  year: number;
}) {
  return (
    <section
      className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.45fr]"
      aria-label="Year summary"
    >
      <MetricCard
        icon={Clock3}
        iconClass="bg-blue-50 text-blue-600"
        value={formatDuration(annualMinutes)}
        label={`Total (${year})`}
      />
      <MetricCard
        icon={CalendarDays}
        iconClass="bg-lime-50 text-green-700"
        value={String(activeDays)}
        label="Days studied"
      />
      <MetricCard
        icon={Flame}
        iconClass="bg-orange-50 text-orange-600"
        value="195"
        label="Current streak"
      />
      <article className="flex min-h-24 min-w-0 items-center justify-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:gap-5 sm:px-5">
        <div className="text-center">
          <strong className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-xl font-bold text-violet-700">
            B1
          </strong>
          <span className="mt-1.5 block text-sm text-slate-600">
            Current level
          </span>
        </div>
        <span className="h-14 w-px bg-slate-200" aria-hidden="true" />
        <div className="min-w-0">
          <strong className="text-base font-bold text-violet-700 sm:text-lg">
            B2{" "}
            <span className="font-normal text-slate-600">
              in about 6 months
            </span>
          </strong>
          <span className="mt-1 block text-sm text-slate-600">
            at this pace
          </span>
        </div>
      </article>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  iconClass,
  value,
  label,
}: {
  icon: LucideIcon;
  iconClass: string;
  value: string;
  label: string;
}) {
  return (
    <article className="flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <strong className="block text-2xl font-bold">{value}</strong>
        <span className="mt-0.5 block text-sm text-slate-600">{label}</span>
      </div>
    </article>
  );
}

function Heatmap({
  year,
  cells,
  selectedDate,
  todayKey,
  entryMinutes,
  onSelect,
}: {
  year: number;
  cells: CalendarCell[];
  selectedDate: string;
  todayKey: string;
  entryMinutes: Record<string, number>;
  onSelect: (date: string) => void;
}) {
  const monthLabels = Array.from({ length: 12 }, (_, month) => {
    const cell = cells.find(
      (item) =>
        item.inYear &&
        item.date.getMonth() === month &&
        item.date.getDate() <= 7,
    );
    return {
      name: new Intl.DateTimeFormat("en", { month: "short" }).format(
        new Date(year, month, 1),
      ),
      week: cell?.week ?? 0,
    };
  });

  return (
    <div
      className="w-full max-w-full overflow-x-auto pb-1"
      aria-label={`${year} study heatmap`}
    >
      <div className="w-max min-w-[1086px]">
        <div
          className="ml-8 grid h-5 text-[10px] text-slate-500"
          style={{ gridTemplateColumns: "repeat(53, 17px)", columnGap: "3px" }}
        >
          {monthLabels.map((label) => (
            <span
              key={label.name}
              style={{
                gridColumnStart: label.week + 1,
                gridColumnEnd: "span 4",
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="grid h-[137px] w-6 grid-rows-7 text-[10px] leading-[17px] text-slate-500">
            <span />
            <span>M</span>
            <span />
            <span>W</span>
            <span />
            <span>F</span>
            <span />
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(53, 17px)",
              gridTemplateRows: "repeat(7, 17px)",
              gap: "3px",
            }}
          >
            {cells.map((cell) => {
              const minutes =
                demoMinutes(cell.date, todayKey) +
                (entryMinutes[cell.dateKey] ?? 0);
              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  className={`rounded-[2px] transition hover:scale-125 hover:ring-2 hover:ring-slate-500 ${
                    cell.dateKey === selectedDate
                      ? "ring-2 ring-slate-950 ring-offset-1"
                      : ""
                  } ${cell.inYear ? "" : "pointer-events-none opacity-0"}`}
                  style={{
                    backgroundColor: heatColor(minutes, cell.dateKey, todayKey),
                    gridColumn: cell.week + 1,
                    gridRow: cell.weekday + 1,
                  }}
                  onClick={() => onSelect(cell.dateKey)}
                  aria-label={`${formatLongDate(cell.dateKey)}: ${minutes} minutes`}
                  title={`${formatLongDate(cell.dateKey)} · ${minutes} min`}
                  tabIndex={cell.inYear ? 0 : -1}
                />
              );
            })}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 pl-8 text-xs text-slate-600">
          {[
            ["0 min", heatColors.pastEmpty],
            ["1–14 min", heatColors.levels[0]],
            ["15–29 min", heatColors.levels[1]],
            ["30–59 min", heatColors.levels[2]],
            ["60–119 min", heatColors.levels[3]],
            ["120–180 min", heatColors.levels[4]],
            ["181+ min", heatColors.levels[5]],
          ].map(([label, color]) => (
            <span key={label} className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-[3px] border border-black/5"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-[3px] border border-slate-200 bg-slate-50" />
            No data (future)
          </span>
        </div>
      </div>
    </div>
  );
}

function DayPanel({
  date,
  todayKey,
  entries,
  total,
  activities,
  selectedActivity,
  selectedDuration,
  customDuration,
  onActivity,
  onDuration,
  onCustomDuration,
  onDelete,
  onSave,
  onOther,
  onDate,
}: {
  date: string;
  todayKey: string;
  entries: StudyEntry[];
  total: number;
  activities: string[];
  selectedActivity: string;
  selectedDuration: number | null;
  customDuration: string;
  onActivity: (activity: string) => void;
  onDuration: (duration: number) => void;
  onCustomDuration: (value: string) => void;
  onDelete: (id: number) => void;
  onSave: () => void;
  onOther: () => void;
  onDate: (date: string) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  return (
    <section className="mt-5 border-t border-slate-200 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-slate-300 p-2.5 hover:bg-slate-50"
            onClick={() => onDate(shiftDate(date, -1))}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-48">
            <h2 className="text-2xl font-bold">
              {date === todayKey ? "Today" : "Selected day"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              {formatLongDate(date)}
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-300 p-2.5 hover:bg-slate-50"
            onClick={() => onDate(shiftDate(date, 1))}
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <p aria-label={`${total} minutes total`}>
          <strong className="text-3xl font-bold text-blue-600">{total}m</strong>{" "}
          <span className="text-lg font-semibold text-slate-700">total</span>
        </p>
      </div>

      <div className="mt-5 space-y-2">
        {entries.length ? (
          entries.map((entry) => {
            const Icon = standardActivityIcons[entry.activity] ?? Shapes;
            return (
              <article
                key={entry.id}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <strong className="text-lg">{entry.duration} min</strong>
                  <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
                  <span className="text-slate-600">{entry.activity}</span>
                </div>
                <div className="flex gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
                    onClick={() => setFormOpen(true)}
                    aria-label={`Edit ${entry.activity} entry`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-red-200 p-2.5 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete the ${entry.activity} study session?`,
                        )
                      )
                        onDelete(entry.id);
                    }}
                    aria-label={`Delete ${entry.activity} entry`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
            No entries for this day yet.
          </div>
        )}
      </div>

      {formOpen ? (
        <div className="mt-4 max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="font-semibold">How long?</h3>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {quickDurations.map((duration) => (
              <button
                key={duration}
                type="button"
                className={`rounded-xl border px-2 py-2.5 text-sm ${
                  selectedDuration === duration && !customDuration
                    ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                    : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
                onClick={() => onDuration(duration)}
              >
                {duration >= 60 && duration % 60 === 0
                  ? `${duration / 60} hour${duration > 60 ? "s" : ""}`
                  : `${duration} min`}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            max="1440"
            inputMode="numeric"
            placeholder="Custom minutes"
            className="mt-2 w-full rounded-xl border border-dashed border-slate-400 px-3 py-2.5 text-center text-sm"
            value={customDuration}
            onChange={(event) => onCustomDuration(event.target.value)}
          />

          <h3 className="mt-5 font-semibold">Activity</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {activities.map((activity) => {
              const Icon = standardActivityIcons[activity] ?? Shapes;
              return (
                <button
                  key={activity}
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
                    selectedActivity === activity
                      ? "border-blue-600 bg-blue-50 font-medium text-blue-700"
                      : "border-slate-300 hover:border-blue-400"
                  }`}
                  onClick={() => onActivity(activity)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {activity}
                </button>
              );
            })}
            <button
              type="button"
              className="rounded-full border border-dashed border-slate-400 px-3 py-1.5 text-sm text-slate-600 hover:border-blue-500 hover:text-blue-600"
              onClick={onOther}
            >
              + Other
            </button>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="min-w-28 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              onClick={() => {
                onSave();
                setFormOpen(false);
              }}
              disabled={
                !selectedActivity || (!selectedDuration && !customDuration)
              }
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="h-5 w-5" />
          Add study session
        </button>
      )}
    </section>
  );
}

function SettingsDrawer({
  activities,
  boards,
  onActivities,
  onBoards,
  onBoard,
  onClose,
}: {
  activities: string[];
  boards: string[];
  onActivities: (activities: string[]) => void;
  onBoards: (boards: string[]) => void;
  onBoard: (board: string) => void;
  onClose: () => void;
}) {
  const [newActivity, setNewActivity] = useState("");
  const [newBoard, setNewBoard] = useState("");
  function addUnique(value: string, values: string[]) {
    const name = value.trim();
    return name &&
      !values.some((item) => item.toLowerCase() === name.toLowerCase())
      ? [...values, name]
      : values;
  }
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/25"
      role="presentation"
      onMouseDown={onClose}
    >
      <aside
        className="h-full w-full max-w-sm overflow-y-auto bg-white p-5 shadow-2xl"
        aria-label="Settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SettingsGroup title="Language boards">
          <div className="flex flex-wrap gap-2">
            {boards.map((board) => (
              <span
                key={board}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm"
              >
                {board}
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Add language..."
              value={newBoard}
              onChange={(event) => setNewBoard(event.target.value)}
              maxLength={50}
            />
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
              disabled={!newBoard.trim() || boards.length >= 6}
              onClick={() => {
                const next = addUnique(newBoard, boards);
                if (next !== boards) {
                  onBoards(next);
                  onBoard(next.at(-1) ?? boards[0]);
                  setNewBoard("");
                }
              }}
            >
              Add
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {boards.length} of 6 boards
          </p>
        </SettingsGroup>

        <SettingsGroup title="Activities">
          <div className="flex flex-wrap gap-2">
            {activities.map((activity) => (
              <span
                key={activity}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm"
              >
                {activity}
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Add activity..."
              value={newActivity}
              onChange={(event) => setNewActivity(event.target.value)}
              maxLength={50}
            />
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
              disabled={!newActivity.trim() || activities.length >= 30}
              onClick={() => {
                const next = addUnique(newActivity, activities);
                if (next !== activities) {
                  onActivities(next);
                  setNewActivity("");
                }
              }}
            >
              Add
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {activities.length} of 30 activities
          </p>
        </SettingsGroup>
        <div className="mt-8 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
          Clickable visual preview. Data resets when the page is refreshed.
        </div>
      </aside>
    </div>
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-7 border-t border-slate-200 pt-6">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function StatisticsPreview({ year }: { year: number }) {
  const values = [32, 56, 42, 78, 66, 92, 81, 45, 71, 88, 62, 74];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return (
    <section className="mx-auto mt-8 max-w-3xl border-t border-slate-200 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Study distribution</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monthly minutes for {year}
          </p>
        </div>
        <div className="rounded-xl bg-slate-100 p-1 text-xs">
          <button
            type="button"
            className="rounded-lg bg-white px-3 py-2 font-semibold shadow-sm"
          >
            Month
          </button>
          <button type="button" className="px-3 py-2 text-slate-500">
            Year
          </button>
        </div>
      </div>
      <div className="mt-8 flex h-64 items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:gap-4">
        {values.map((value, index) => (
          <div
            key={months[index]}
            className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2"
          >
            <div
              className="w-full rounded-t-md bg-blue-500 hover:bg-blue-600"
              style={{ height: `${value}%` }}
              title={`${months[index]}: ${value * 10} minutes`}
            />
            <span className="truncate text-center text-[9px] text-slate-500 sm:text-xs">
              {months[index]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
