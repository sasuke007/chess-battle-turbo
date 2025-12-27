"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CompleteUserObject } from "../types/user";

export interface UseRequireAuthReturn {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  clerkUser: ReturnType<typeof useUser>["user"];
  userId: string | null | undefined;
  userObject: CompleteUserObject | null;
  isLoadingUserData: boolean;
}

export function useRequireAuth(): UseRequireAuthReturn {
  const { isLoaded: authLoaded, userId } = useAuth();
  //TODO: do a zod validation in user object so that required data is always present. all the non null db fields should be present in the user object.
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  const [userObject, setUserObject] = useState<CompleteUserObject | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);
  
  const isLoaded = authLoaded && userLoaded;
  const router = useRouter();

  // Fetch user data from our database
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    // If user is not signed in, redirect to sign-in
    if (!isSignedIn || !userId || !email) {
      router.push("/sign-in");
      return;
    }

    // Fetch user data from our API
    const fetchUserData = async () => {
      setIsLoadingUserData(true);
      try {
        const response = await fetch(`/api/user/email/${encodeURIComponent(email)}`);
        
        if (!response.ok) {
          console.error("Failed to fetch user data:", response.statusText);
          // Redirect to sign-in if user data fetch fails
          router.push("/sign-in");
          return;
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setUserObject(data.data);
        } else {
          console.error("Invalid user data response");
          router.push("/sign-in");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Redirect to sign-in on network error
        router.push("/sign-in");
      } finally {
        setIsLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [isLoaded, isSignedIn, userId, email, router]);

  return {
    isLoaded,
    isSignedIn,
    clerkUser: user,
    userId,
    userObject,
    isLoadingUserData,
  };
}