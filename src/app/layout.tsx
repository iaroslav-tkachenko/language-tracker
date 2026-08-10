import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/site-footer";

import "./globals.css";

export const metadata: Metadata = {
  title: "Language Tracker",
  description: "Track language learning time with a yearly heatmap.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: "#ffffff",
};

const themeScript = `
  (() => {
    try {
      const key = "language-tracker-theme";
      const stored = localStorage.getItem(key);
      const preference = stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";
      const media = matchMedia("(prefers-color-scheme: dark)");
      const apply = (nextPreference) => {
        const dark = nextPreference === "dark" || (
          nextPreference === "system" && media.matches
        );
        const root = document.documentElement;
        root.classList.toggle("dark", dark);
        root.dataset.theme = nextPreference;
        root.style.colorScheme = dark ? "dark" : "light";
        document
          .querySelector('meta[name="theme-color"]')
          ?.setAttribute("content", dark ? "#0b1220" : "#ffffff");
      };
      apply(preference);
      media.addEventListener("change", () => {
        const current = localStorage.getItem(key);
        if (current === null || current === "system") apply("system");
      });
    } catch {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
