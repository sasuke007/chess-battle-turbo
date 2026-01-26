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

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
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

    // Listen for the beforeinstallprompt event (Chrome/Android/Desktop)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
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
