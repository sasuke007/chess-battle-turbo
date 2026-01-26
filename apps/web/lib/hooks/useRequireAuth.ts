"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CompleteUserObject } from "../types/user";
import { useUserStore } from "../stores/userStore";

export interface UseRequireAuthReturn {
  /** Clerk auth has finished loading */
  isLoaded: boolean;
  /** Auth loaded AND user data available (cached or fetched) - safe to interact with protected features */
  isReady: boolean;
  isSignedIn: boolean | undefined;
  clerkUser: ReturnType<typeof useUser>["user"];
  userId: string | null | undefined;
  userObject: CompleteUserObject | null;
  isLoadingUserData: boolean;
  /** Force a fresh fetch of user data */
  refetchUserData: () => Promise<void>;
}

export function useRequireAuth(): UseRequireAuthReturn {
  const { isLoaded: authLoaded, userId } = useAuth();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  const router = useRouter();

  // Zustand store - provides cached user data
  const { user: cachedUser, wallet, stats, setUserData, clearUser } = useUserStore();

  // Track if we're currently fetching (for background refresh indicator)
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);
  // Track if initial load/check is complete
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);
  // Prevent duplicate fetches
  const fetchingRef = useRef<boolean>(false);

  const isLoaded = authLoaded && userLoaded;

  // Build the complete user object from store
  const userObject: CompleteUserObject | null = cachedUser
    ? { user: cachedUser, wallet, stats }
    : null;

  // isReady when we have auth loaded AND either:
  // 1. We have cached user data (instant), OR
  // 2. Initial fetch is complete
  const isReady = isLoaded && initialCheckDone && userObject !== null;

  // Fetch user data from API and update store
  const fetchUserData = useCallback(async (showLoading = true): Promise<void> => {
    if (!email || fetchingRef.current) return;

    fetchingRef.current = true;
    if (showLoading) setIsLoadingUserData(true);

    try {
      const response = await fetch(`/api/user/email/${encodeURIComponent(email)}`);

      if (!response.ok) {
        console.error("Failed to fetch user data:", response.statusText);
        // Clear store and redirect if fetch fails
        clearUser();
        router.push("/sign-in");
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        setUserData(data.data);
      } else {
        console.error("Invalid user data response");
        clearUser();
        router.push("/sign-in");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      clearUser();
      router.push("/sign-in");
    } finally {
      fetchingRef.current = false;
      setIsLoadingUserData(false);
      setInitialCheckDone(true);
    }
  }, [email, setUserData, clearUser, router]);

  // Check if cached user matches current email (handles account switching)
  const cachedEmailMatches = cachedUser?.email === email;

  // Main effect: handle auth state changes and data fetching
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    // If user is not signed in, clear store and redirect
    if (!isSignedIn || !userId || !email) {
      clearUser();
      router.push("/sign-in");
      return;
    }

    if (cachedUser && cachedEmailMatches) {
      // We have valid cached data - mark as ready immediately
      setInitialCheckDone(true);
      // Still fetch fresh data in background (for wallet/stats updates)
      fetchUserData(false);
    } else {
      // No cache or different user - need to fetch
      if (cachedUser && !cachedEmailMatches) {
        clearUser(); // Clear stale data from different user
      }
      fetchUserData(true);
    }
  }, [isLoaded, isSignedIn, userId, email, cachedUser, cachedEmailMatches, clearUser, fetchUserData, router]);

  return {
    isLoaded,
    isReady,
    isSignedIn,
    clerkUser: user,
    userId,
    userObject,
    isLoadingUserData,
    refetchUserData: () => fetchUserData(true),
  };
}