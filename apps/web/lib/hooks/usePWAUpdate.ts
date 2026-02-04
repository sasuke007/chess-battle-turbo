"use client";

import { useState, useEffect, useCallback } from "react";

export function usePWAUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;

    const handleUpdate = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Check if there's already a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdateNotification(true);
        }

        // Listen for new service workers
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New content is available
                setWaitingWorker(newWorker);
                setShowUpdateNotification(true);
              }
            });
          }
        });
      } catch {
        // Service worker not available
      }
    };

    handleUpdate();

    // Reload when the new service worker takes control
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setShowUpdateNotification(false);
    }
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setShowUpdateNotification(false);
  }, []);

  return {
    showUpdateNotification,
    applyUpdate,
    dismissUpdate,
  };
}
