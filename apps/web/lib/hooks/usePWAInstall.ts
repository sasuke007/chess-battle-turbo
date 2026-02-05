"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// Global state to capture the event before React mounts
let deferredPromptGlobal: BeforeInstallPromptEvent | null = null;
let promptCapturedEarly = false;

// Capture the event immediately (runs when this module loads)
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPromptGlobal = e as BeforeInstallPromptEvent;
    promptCapturedEarly = true;
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(deferredPromptGlobal);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const checkInstalled = () => {
      if (typeof window === "undefined") return false;
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true
      );
    };

    // Check if iOS Safari
    const checkIOS = () => {
      if (typeof window === "undefined") return false;
      const ua = window.navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
      const isWebkit = /WebKit/.test(ua);
      const isNotChrome = !/CriOS/.test(ua);
      const isNotFirefox = !/FxiOS/.test(ua);
      return isIOSDevice && isWebkit && isNotChrome && isNotFirefox;
    };

    setIsInstalled(checkInstalled());
    setIsIOS(checkIOS());

    // If event was captured early (before React mounted), use it now
    if (promptCapturedEarly && deferredPromptGlobal) {
      setDeferredPrompt(deferredPromptGlobal);
    }

    // Also listen for future events (e.g., if user dismisses and comes back)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPromptGlobal = e;
      setDeferredPrompt(e);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      deferredPromptGlobal = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setDeferredPrompt(null);
        deferredPromptGlobal = null;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  // Can install if we have a deferred prompt OR it's iOS (manual install)
  const canInstall = !!deferredPrompt || isIOS;

  return {
    canInstall,
    isInstalled,
    isIOS,
    install,
  };
}
