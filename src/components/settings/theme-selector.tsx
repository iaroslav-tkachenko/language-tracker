"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

export type ThemePreference = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "language-tracker-theme";

const themeOptions = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function applyTheme(preference: ThemePreference) {
  const systemIsDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const dark =
    preference === "dark" || (preference === "system" && systemIsDark);
  const root = document.documentElement;

  root.classList.toggle("dark", dark);
  root.dataset.theme = preference;
  root.style.colorScheme = dark ? "dark" : "light";

  const themeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  themeColor?.setAttribute("content", dark ? "#0b1220" : "#ffffff");
}

function getStoredPreference(): ThemePreference {
  const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(storedPreference) ? storedPreference : "system";
}

function subscribeToPreference(onStoreChange: () => void) {
  const handleChange = () => {
    applyTheme(getStoredPreference());
    onStoreChange();
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener("language-tracker-theme-change", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("language-tracker-theme-change", handleChange);
  };
}

export function ThemeSelector() {
  const preference = useSyncExternalStore(
    subscribeToPreference,
    getStoredPreference,
    () => "system",
  );

  function selectTheme(nextPreference: ThemePreference) {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    applyTheme(nextPreference);
    window.dispatchEvent(new Event("language-tracker-theme-change"));
  }

  return (
    <section
      aria-labelledby="theme-heading"
      className="mt-4 flex max-w-4xl flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4"
    >
      <div>
        <h2 id="theme-heading" className="text-base font-bold text-slate-950">
          Theme
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Choose a theme or match your device settings.
        </p>
      </div>

      <div
        role="group"
        aria-label="Theme preference"
        className="grid w-full grid-cols-3 rounded-lg bg-slate-100 p-1 sm:w-auto"
      >
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const selected = preference === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => selectTheme(option.value)}
              className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
                selected
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <Icon aria-hidden="true" className="size-4" />
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
