"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CompleteUserObject } from "../types/user";
import { trackApiResponseTime } from "@/lib/metrics";

export interface UseRequireAuthReturn {
  isLoaded: boolean;
  isReady: boolean;
  isSignedIn: boolean | undefined;
  clerkUser: ReturnType<typeof useUser>["user"];
  userId: string | null | undefined;
  userObject: CompleteUserObject | null;
  isLoadingUserData: boolean;
  refetchUserData: () => Promise<void>;
}

export function useRequireAuth(): UseRequireAuthReturn {
  const { isLoaded: authLoaded, userId } = useAuth();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  const router = useRouter();

  // Local state for user data
  const [userObject, setUserObject] = useState<CompleteUserObject | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Track which email we've already fetched for (prevents duplicate fetches)
  const fetchedEmailRef = useRef<string | null>(null);
  // Track if a fetch is currently in progress
  const isFetchingRef = useRef(false);

  const isLoaded = authLoaded && userLoaded;
  const isReady = isLoaded && initialCheckDone && userObject !== null;

  // Manual refetch function (for explicit refresh requests)
  const refetchUserData = async (): Promise<void> => {
    if (!email || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoadingUserData(true);

    try {
      const start = Date.now();
      const response = await fetch(`/api/user/email/${encodeURIComponent(email)}`);
      trackApiResponseTime("user.fetchByEmail", Date.now() - start);

      if (!response.ok) {
        router.push("/sign-in");
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        setUserObject(data.data);
        fetchedEmailRef.current = email;
      } else {
        router.push("/sign-in");
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching user data:", error);
      }
      router.push("/sign-in");
    } finally {
      isFetchingRef.current = false;
      setIsLoadingUserData(false);
      setInitialCheckDone(true);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId || !email) {
      router.push("/sign-in");
      return;
    }

    // Already fetched for this email - skip
    if (fetchedEmailRef.current === email) {
      return;
    }

    // Already fetching - skip
    if (isFetchingRef.current) {
      return;
    }

    // Clear state if switching users
    if (fetchedEmailRef.current && fetchedEmailRef.current !== email) {
      setUserObject(null);
      setInitialCheckDone(false);
    }

    isFetchingRef.current = true;
    setIsLoadingUserData(true);

    const fetchStart = Date.now();
    fetch(`/api/user/email/${encodeURIComponent(email)}`)
      .then((response) => {
        trackApiResponseTime("user.fetchByEmail", Date.now() - fetchStart);
        if (!response.ok) {
          router.push("/sign-in");
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (data?.success && data?.data) {
          setUserObject(data.data);
          fetchedEmailRef.current = email;
        } else if (data !== null) {
          router.push("/sign-in");
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching user data:", error);
        }
        router.push("/sign-in");
      })
      .finally(() => {
        isFetchingRef.current = false;
        setIsLoadingUserData(false);
        setInitialCheckDone(true);
      });
  }, [isLoaded, isSignedIn, userId, email, router]);

  return {
    isLoaded,
    isReady,
    isSignedIn,
    clerkUser: user,
    userId,
    userObject,
    isLoadingUserData,
    refetchUserData,
  };
}
