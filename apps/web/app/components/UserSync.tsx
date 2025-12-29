"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

/**
 * UserSync Component
 * 
 * This component automatically syncs the authenticated user's data
 * from Clerk to our database when they sign in or sign up.
 * 
 * It also checks if the user has completed onboarding (chess.com profile)
 * and redirects them if needed.
 * 
 * It runs once per session to ensure user data is up-to-date.
 */
export const UserSync = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncUser = async () => {
      // Only sync if:
      // 1. Clerk has loaded
      // 2. User is signed in
      // 3. User object exists
      // 4. We haven't synced yet in this session
      if (!isLoaded || !isSignedIn || !user || hasSynced.current) {
        return;
      }

      try {
        hasSynced.current = true; // Mark as synced to prevent duplicate calls

        const response = await fetch("/api/user/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to sync user:", errorData);
          // Reset flag on error so it can retry
          hasSynced.current = false;
          return;
        }

        const data = await response.json();
        console.log("User synced successfully:", data.message);
        // No forced redirection - users can add chess.com handle later from profile
      } catch (error) {
        console.error("Error syncing user:", error);
        // Reset flag on error so it can retry
        hasSynced.current = false;
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, router, pathname]);

  // This component doesn't render anything
  return null;
};

