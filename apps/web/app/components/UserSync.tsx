"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { logger } from "@/lib/logger";
import { trackApiResponseTime } from "@/lib/metrics";

/**
 * UserSync Component
 *
 * Automatically syncs the authenticated user's data from Clerk to our database.
 * Redirects new users (onboarded === false) to the onboarding page.
 * Runs once per session.
 */
export const UserSync = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !isSignedIn || !user || hasSynced.current) {
        return;
      }

      try {
        hasSynced.current = true;

        const start = Date.now();
        const response = await fetch("/api/user/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        trackApiResponseTime("user.sync", Date.now() - start);

        if (!response.ok) {
          const errorData = await response.json();
          logger.error("Failed to sync user:", errorData);
          hasSynced.current = false;
          return;
        }

        const data = await response.json();

        logger.debug("User synced successfully: " + data.message);

        // Redirect new users to onboarding if they haven't completed it
        if (
          data.user &&
          !data.user.onboarded &&
          pathname !== "/onboarding"
        ) {
          router.push("/onboarding");
        }
      } catch (error) {
        logger.error("Error syncing user:", error);
        hasSynced.current = false;
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, router, pathname]);

  return null;
};
