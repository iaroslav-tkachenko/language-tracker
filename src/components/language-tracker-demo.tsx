"use client";

import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

type View = "home" | "statistics";
type StudyEntry = {
  id: number;
  date: string;
  duration: number;
  activity: string;
  comment?: string;
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
const heatColors = [
  "#e8ebf0",
  "#dbeafe",
  "#bfdbfe",
  "#93c5fd",
  "#60a5fa",
  "#2563eb",
  "#172033",
];

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

export function LanguageTrackerDemo() {
  const todayKey = toDateKey(new Date());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(30);
  const [customDuration, setCustomDuration] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("Anki");
  const [comment, setComment] = useState("");
  const [entries, setEntries] = useState<StudyEntry[]>([
    { id: 1, date: todayKey, duration: 30, activity: "Anki", comment: "German review" },
  ]);
  const [activities, setActivities] = useState(initialActivities);
  const [boards, setBoards] = useState(["German", "English"]);
  const [activeBoard, setActiveBoard] = useState("German");
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState<View>("home");

  const calendarCells = useMemo(() => getCalendarCells(year), [year]);
  const entryMinutes = useMemo(
    () =>
      entries.reduce<Record<string, number>>((totals, entry) => {
        totals[entry.date] = (totals[entry.date] ?? 0) + entry.duration;
        return totals;
      }, {}),
    [entries],
  );
  const selectedEntries = entries.filter((entry) => entry.date === selectedDate);
  const selectedDayTotal = selectedEntries.reduce((total, entry) => total + entry.duration, 0);
  const annualMinutes = calendarCells.reduce(
    (total, cell) =>
      cell.inYear
        ? total + demoMinutes(cell.date, todayKey) + (entryMinutes[cell.dateKey] ?? 0)
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
    if (!duration || duration < 1 || duration > 1440 || !selectedActivity) return;
    setEntries((current) => [
      ...current,
      {
        id: Date.now(),
        date: selectedDate,
        duration,
        activity: selectedActivity,
        comment: comment.trim() || undefined,
      },
    ]);
    setComment("");
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-17 max-w-[1480px] items-center justify-between px-4 sm:px-6">
          <div className="relative">
            <button
              type="button"
              className="flex min-w-36 items-center gap-2 rounded-xl px-2 py-2 text-left font-semibold hover:bg-slate-100"
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

          <nav className="flex items-center gap-1" aria-label="Primary navigation">
            <NavButton active={view === "home"} label="Home" onClick={() => setView("home")}>
              <Home className="h-5 w-5" />
            </NavButton>
            <NavButton
              active={view === "statistics"}
              label="Statistics"
              onClick={() => setView("statistics")}
            >
              <BarChart3 className="h-5 w-5" />
            </NavButton>
            <NavButton label="Settings" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-5 w-5" />
            </NavButton>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 sm:py-12">
        <section aria-labelledby="year-heading">
          <div className="mb-7 flex items-center justify-center gap-4">
            <YearButton label="Previous year" onClick={() => setYear((value) => value - 1)}>
              <ChevronLeft className="h-5 w-5" />
            </YearButton>
            <h1 id="year-heading" className="min-w-24 text-center text-3xl font-bold tracking-tight">
              {year}
            </h1>
            <YearButton label="Next year" onClick={() => setYear((value) => value + 1)}>
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

        <section className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [formatDuration(annualMinutes), `Total (${year})`],
            [String(activeDays), "Active days"],
            ["12", "Current streak"],
            ["Anki", "Top activity"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-5 text-center"
            >
              <strong className="block text-xl font-bold text-blue-600 sm:text-2xl">{value}</strong>
              <span className="mt-1 block text-xs text-slate-500 sm:text-sm">{label}</span>
            </div>
          ))}
        </section>

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
            comment={comment}
            onActivity={setSelectedActivity}
            onDuration={(duration) => {
              setSelectedDuration(duration);
              setCustomDuration("");
            }}
            onCustomDuration={(value) => {
              setCustomDuration(value);
              setSelectedDuration(null);
            }}
            onComment={setComment}
            onDelete={(id) => setEntries((current) => current.filter((entry) => entry.id !== id))}
            onSave={saveEntry}
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

function NavButton({
  active = false,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`rounded-xl p-2.5 ${
        active ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"
      }`}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function YearButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
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
      (item) => item.inYear && item.date.getMonth() === month && item.date.getDate() <= 7,
    );
    return {
      name: new Intl.DateTimeFormat("en", { month: "short" }).format(
        new Date(year, month, 1),
      ),
      week: cell?.week ?? 0,
    };
  });

  return (
    <div className="overflow-x-auto pb-3" aria-label={`${year} study heatmap`}>
      <div className="mx-auto w-max min-w-[835px]">
        <div
          className="ml-8 grid h-5 text-[10px] text-slate-500"
          style={{ gridTemplateColumns: "repeat(53, 12px)", columnGap: "3px" }}
        >
          {monthLabels.map((label) => (
            <span
              key={label.name}
              style={{ gridColumnStart: label.week + 1, gridColumnEnd: "span 4" }}
            >
              {label.name}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="grid h-[102px] w-6 grid-rows-7 text-[10px] leading-3 text-slate-500">
            <span /><span>M</span><span /><span>W</span><span /><span>F</span><span />
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(53, 12px)",
              gridTemplateRows: "repeat(7, 12px)",
              gap: "3px",
            }}
          >
            {cells.map((cell) => {
              const minutes =
                demoMinutes(cell.date, todayKey) + (entryMinutes[cell.dateKey] ?? 0);
              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  className={`rounded-[2px] transition hover:scale-125 hover:ring-2 hover:ring-slate-500 ${
                    cell.dateKey === selectedDate ? "ring-2 ring-slate-950 ring-offset-1" : ""
                  } ${cell.inYear ? "" : "pointer-events-none opacity-0"}`}
                  style={{
                    backgroundColor: heatColors[heatLevel(minutes)],
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
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
          <span>Less</span>
          {heatColors.map((color, index) => (
            <span
              key={color}
              className="h-3.5 w-3.5 rounded-[3px]"
              style={{ backgroundColor: color }}
              aria-label={`Intensity level ${index}`}
            />
          ))}
          <span>More</span>
        </div>
        <div className="mt-2 flex justify-center gap-5 text-xs text-slate-400">
          <span>15 min</span><span>30 min</span><span>1 hour</span>
          <span>2 hours</span><span>3+ hours</span>
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
  comment,
  onActivity,
  onDuration,
  onCustomDuration,
  onComment,
  onDelete,
  onSave,
  onOther,
}: {
  date: string;
  todayKey: string;
  entries: StudyEntry[];
  total: number;
  activities: string[];
  selectedActivity: string;
  selectedDuration: number | null;
  customDuration: string;
  comment: string;
  onActivity: (activity: string) => void;
  onDuration: (duration: number) => void;
  onCustomDuration: (value: string) => void;
  onComment: (value: string) => void;
  onDelete: (id: number) => void;
  onSave: () => void;
  onOther: () => void;
}) {
  return (
    <section className="mx-auto mt-8 max-w-2xl border-t border-slate-200 pt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{date === todayKey ? "Today" : "Selected day"}</h2>
          <p className="mt-1 text-sm text-slate-500">{formatLongDate(date)}</p>
        </div>
        <span className="font-medium text-blue-600">{total}m total</span>
      </div>

      <div className="mt-5 space-y-2">
        {entries.length ? (
          entries.map((entry) => (
            <article
              key={entry.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <strong>{entry.duration} min</strong>
                  <span className="text-sm text-slate-500">{entry.comment}</span>
                </div>
                <span className="mt-2 inline-block rounded-full bg-slate-200 px-2.5 py-1 text-xs text-slate-600">
                  {entry.activity}
                </span>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => onDelete(entry.id)}
                aria-label={`Delete ${entry.activity} entry`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
            No entries for this day yet.
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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
          {activities.map((activity) => (
            <button
              key={activity}
              type="button"
              className={`rounded-full border px-3 py-1.5 text-sm ${
                selectedActivity === activity
                  ? "border-blue-600 bg-blue-50 font-medium text-blue-700"
                  : "border-slate-300 hover:border-blue-400"
              }`}
              onClick={() => onActivity(activity)}
            >
              {activity}
            </button>
          ))}
          <button
            type="button"
            className="rounded-full border border-dashed border-slate-400 px-3 py-1.5 text-sm text-slate-600 hover:border-blue-500 hover:text-blue-600"
            onClick={onOther}
          >
            + Other
          </button>
        </div>
        <textarea
          maxLength={150}
          rows={2}
          placeholder="Comment (optional)"
          className="mt-4 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          value={comment}
          onChange={(event) => onComment(event.target.value)}
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="min-w-32 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            onClick={onSave}
            disabled={!selectedActivity || (!selectedDuration && !customDuration)}
          >
            Save entry
          </button>
        </div>
      </div>
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
    return name && !values.some((item) => item.toLowerCase() === name.toLowerCase())
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
          <button type="button" className="rounded-lg p-2 hover:bg-slate-100" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <SettingsGroup title="Language boards">
          <div className="flex flex-wrap gap-2">
            {boards.map((board) => (
              <span key={board} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm">{board}</span>
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
            >Add</button>
          </div>
          <p className="mt-2 text-xs text-slate-400">{boards.length} of 6 boards</p>
        </SettingsGroup>

        <SettingsGroup title="Activities">
          <div className="flex flex-wrap gap-2">
            {activities.map((activity) => (
              <span key={activity} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm">{activity}</span>
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
            >Add</button>
          </div>
          <p className="mt-2 text-xs text-slate-400">{activities.length} of 30 activities</p>
        </SettingsGroup>
        <div className="mt-8 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
          Clickable visual preview. Data resets when the page is refreshed.
        </div>
      </aside>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7 border-t border-slate-200 pt-6">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

function StatisticsPreview({ year }: { year: number }) {
  const values = [32, 56, 42, 78, 66, 92, 81, 45, 71, 88, 62, 74];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (
    <section className="mx-auto mt-8 max-w-3xl border-t border-slate-200 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Study distribution</h2>
          <p className="mt-1 text-sm text-slate-500">Monthly minutes for {year}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-1 text-xs">
          <button type="button" className="rounded-lg bg-white px-3 py-2 font-semibold shadow-sm">Month</button>
          <button type="button" className="px-3 py-2 text-slate-500">Year</button>
        </div>
      </div>
      <div className="mt-8 flex h-64 items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:gap-4">
        {values.map((value, index) => (
          <div key={months[index]} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
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

