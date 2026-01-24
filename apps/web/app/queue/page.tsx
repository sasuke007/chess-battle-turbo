"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/app/components/Navbar";
import {
  QueueSearching,
  QueueTimeout,
  MatchFound,
} from "@/app/components/matchmaking";
import {
  useMatchmaking,
  OpponentInfo,
} from "@/lib/hooks/useMatchmaking";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";

type QueueState = "initializing" | "searching" | "timeout" | "matched" | "error";

function QueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, userObject } = useRequireAuth();

  const [queueState, setQueueState] = useState<QueueState>("initializing");
  const [queueReferenceId, setQueueReferenceId] = useState<string | null>(null);
  const [opponentInfo, setOpponentInfo] = useState<OpponentInfo | null>(null);
  const [gameReferenceId, setGameReferenceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Track if we've already initiated the request
  const hasInitiatedRef = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get params from URL
  const initialTimeSeconds = parseInt(searchParams.get("time") || "300", 10);
  const incrementSeconds = parseInt(searchParams.get("increment") || "5", 10);
  const legendReferenceId = searchParams.get("legend") || null;

  // Get time control label
  const getTimeControlLabel = () => {
    const mins = Math.floor(initialTimeSeconds / 60);
    if (incrementSeconds > 0) {
      return `${mins} | ${incrementSeconds}`;
    }
    return `${mins} min`;
  };

  // Redirect to game
  const redirectToGame = useCallback((gameRef: string) => {
    // Clear any existing timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    // Use replace to prevent going back to queue
    redirectTimeoutRef.current = setTimeout(() => {
      router.replace(`/game/${gameRef}`);
    }, 1500);
  }, [router]);

  // Initialize queue entry on mount
  useEffect(() => {
    if (!isLoaded || !userObject?.user?.referenceId) return;
    if (hasInitiatedRef.current) return;

    hasInitiatedRef.current = true;
    setIsCreating(true);

    const createMatchRequest = async () => {
      try {
        const response = await fetch("/api/matchmaking/create-match-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userReferenceId: userObject.user.referenceId,
            legendReferenceId,
            initialTimeSeconds,
            incrementSeconds,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to create match request");
        }

        if (data.data.immediateMatch) {
          // Immediate match found!
          console.log("Immediate match found:", data.data.immediateMatch);
          setQueueState("matched");
          setOpponentInfo({
            name: data.data.immediateMatch.opponentName,
            profilePictureUrl: data.data.immediateMatch.opponentProfilePictureUrl,
          });
          setGameReferenceId(data.data.immediateMatch.gameReferenceId);
          redirectToGame(data.data.immediateMatch.gameReferenceId);
        } else {
          // Start polling
          console.log("No immediate match, starting polling for:", data.data.queueEntry.referenceId);
          setQueueReferenceId(data.data.queueEntry.referenceId);
          setQueueState("searching");
        }
      } catch (error) {
        console.error("Error creating match request:", error);
        setErrorMessage(error instanceof Error ? error.message : "Failed to create match request");
        setQueueState("error");
      } finally {
        setIsCreating(false);
      }
    };

    createMatchRequest();

    // Cleanup timeout on unmount
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [isLoaded, userObject?.user?.referenceId, legendReferenceId, initialTimeSeconds, incrementSeconds, redirectToGame]);

  // Handle match found callback from polling
  const handleMatchFound = useCallback(
    (gameRef: string, opponent: OpponentInfo) => {
      console.log("Match found via polling:", gameRef, opponent);
      setQueueState("matched");
      setOpponentInfo(opponent);
      setGameReferenceId(gameRef);
      redirectToGame(gameRef);
    },
    [redirectToGame]
  );

  // Handle timeout callback
  const handleTimeout = useCallback(() => {
    console.log("Queue timeout");
    setQueueState("timeout");
  }, []);

  // Handle error callback
  const handleError = useCallback((error: string) => {
    console.error("Matchmaking error:", error);
    // Don't change state on polling errors - keep searching
  }, []);

  // Use matchmaking hook for polling (only when we have a queueReferenceId)
  const matchmaking = useMatchmaking({
    queueReferenceId,
    onMatchFound: handleMatchFound,
    onTimeout: handleTimeout,
    onError: handleError,
    enabled: queueState === "searching" && !!queueReferenceId,
  });

  // Handle cancel
  const handleCancel = async () => {
    if (userObject?.user?.referenceId && queueReferenceId) {
      try {
        await fetch("/api/matchmaking/cancel-match-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            queueReferenceId,
            userReferenceId: userObject.user.referenceId,
          }),
        });
      } catch (error) {
        console.error("Error cancelling:", error);
      }
    }

    router.replace("/play");
  };

  // Handle retry
  const handleRetry = () => {
    hasInitiatedRef.current = false;
    setQueueState("initializing");
    setQueueReferenceId(null);
    setErrorMessage(null);
    setOpponentInfo(null);
    setGameReferenceId(null);
  };

  // Handle back
  const handleBack = () => {
    router.replace("/play");
  };

  // Show loading while auth loads
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-neutral-900 items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a1a1a] flex items-center justify-center pt-16 sm:pt-18">
        <div className="w-full max-w-lg p-4">
          {/* Error state */}
          {queueState === "error" && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-white">Error</h2>
              <p className="text-neutral-400">
                {errorMessage || "Something went wrong"}
              </p>
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                Back to Play
              </button>
            </div>
          )}

          {/* Initializing or Searching state */}
          {(queueState === "initializing" || queueState === "searching") && (
            <QueueSearching
              timeRemaining={queueReferenceId ? matchmaking.timeRemaining : 60}
              onCancel={handleCancel}
              isLoading={isCreating || matchmaking.isLoading}
              timeControlLabel={getTimeControlLabel()}
            />
          )}

          {/* Timeout state */}
          {queueState === "timeout" && (
            <QueueTimeout
              onRetry={handleRetry}
              onBack={handleBack}
              isRetrying={isCreating}
            />
          )}

          {/* Matched state */}
          {queueState === "matched" && opponentInfo && (
            <MatchFound
              opponentName={opponentInfo.name}
              opponentProfilePictureUrl={opponentInfo.profilePictureUrl}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-neutral-900 items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <QueueContent />
    </Suspense>
  );
}
