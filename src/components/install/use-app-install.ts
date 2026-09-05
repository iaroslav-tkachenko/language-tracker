"use client";

import { useEffect, useState } from "react";

export type InstallState =
  | "checking"
  | "installable"
  | "standalone"
  | "installed"
  | "manual"
  | "unavailable";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function hasManualInstallPath() {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isChromium = /Chrome|Chromium|CriOS|Edg|OPR/.test(userAgent);
  return isIOS || isChromium;
}

export function useAppInstall() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<InstallState>("checking");
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
      setState(
        isStandalone()
          ? "standalone"
          : hasManualInstallPath()
            ? "manual"
            : "unavailable",
      );
    });

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setState("installable");
    };
    const handleInstalled = () => {
      setPromptEvent(null);
      setState("installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") setState("installed");
    else setState(hasManualInstallPath() ? "manual" : "unavailable");
  }

  return { state, isIOS, install };
}
