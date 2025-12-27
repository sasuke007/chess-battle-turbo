"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GameDetails {
  referenceId: string;
  status: string;
  stakeAmount: string;
  totalPot: string;
  platformFeeAmount: string;
  initialTimeSeconds: number;
  incrementSeconds: number;
  creator: {
    userReferenceId: string;
    name: string;
    profilePictureUrl: string | null;
    code: string;
  };
  opponent?: {
    userReferenceId: string;
    name: string;
    profilePictureUrl: string | null;
    code: string;
  };
}

export default function JoinPage({
  params,
}: {
  params: Promise<{ gameReferenceId: string }>;
}) {
  const router = useRouter();
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // Unwrap the params Promise using React.use()
  const { gameReferenceId } = use(params);

  useEffect(() => {
    async function fetchGameDetails() {
      try {
        const response = await fetch(`/api/chess/game-by-ref/${gameReferenceId}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Failed to fetch game details");
          return;
        }

        setGameDetails(data.data);
      } catch (err) {
        console.error("Error fetching game:", err);
        setError("Failed to load game details");
      } finally {
        setLoading(false);
      }
    }

    fetchGameDetails();
  }, [gameReferenceId]);

  const handleJoinGame = async () => {
    if (!gameDetails) return;

    setJoining(true);

    try {
      const response = await fetch("/api/chess/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameReferenceId: gameDetails.referenceId,
          opponentReferenceId: "cmh0x9hzo0000gp1myxos778k", // TODO: Get from logged in user
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to join game");
      }

      console.log("Successfully joined game:", data);

      // Redirect to game page
      router.push(`/game/${gameDetails.referenceId}`);
    } catch (err) {
      console.error("Error joining game:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to join game. Please try again."
      );
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game details...</div>
      </div>
    );
  }

  if (error || !gameDetails) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="bg-neutral-800 rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-white mb-6">
            {error || "Game not found"}
          </p>
          <Button
            onClick={() => router.push("/play")}
            className="w-full bg-white text-black hover:bg-gray-200"
          >
            Create New Game
          </Button>
        </div>
      </div>
    );
  }

  const alreadyStarted = gameDetails.status !== "WAITING_FOR_OPPONENT";

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-neutral-800 rounded-lg p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Chess Challenge
        </h1>

        <div className="space-y-6">
          {/* Creator Info */}
          <div className="bg-neutral-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-neutral-300 mb-3">
              Challenge from
            </h2>
            <div className="flex items-center gap-4">
              {gameDetails.creator.profilePictureUrl ? (
                <img
                  src={gameDetails.creator.profilePictureUrl}
                  alt={gameDetails.creator.name}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-neutral-600 flex items-center justify-center text-2xl font-bold text-white">
                  {}
                </div>
              )}
              <div>
                <p className="text-xl font-bold text-white">
                  {gameDetails.creator.name}
                </p>
                <p className="text-sm text-neutral-400">
                  @{gameDetails.creator.code}
                </p>
              </div>
            </div>
          </div>

          {/* Game Details */}
          <div className="bg-neutral-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-neutral-300 mb-4">
              Game Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-400">Stake Amount</p>
                <p className="text-2xl font-bold text-white">
                  ${gameDetails.stakeAmount}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Total Pot</p>
                <p className="text-2xl font-bold text-green-400">
                  ${gameDetails.totalPot}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Time Control</p>
                <p className="text-lg font-semibold text-white">
                  {gameDetails.initialTimeSeconds / 60}+{gameDetails.incrementSeconds}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Platform Fee</p>
                <p className="text-lg font-semibold text-white">
                  ${gameDetails.platformFeeAmount}
                </p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {alreadyStarted && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <p className="text-yellow-400 text-center">
                This game has already started or is no longer available.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/")}
              className="flex-1 bg-neutral-700 border border-neutral-600 text-white font-semibold text-lg py-6 hover:bg-neutral-700"
              disabled={joining}
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinGame}
              className={cn(
                "flex-1 font-semibold text-lg py-6",
                alreadyStarted
                  ? "bg-neutral-600 text-neutral-400 cursor-not-allowed"
                  : "bg-white text-black hover:bg-gray-200"
              )}
              disabled={joining || alreadyStarted}
            >
              {joining
                ? "Joining..."
                : alreadyStarted
                ? "Game Unavailable"
                : "Accept Challenge"}
            </Button>
          </div>

          {/* Warning */}
          <div className="text-center text-sm text-neutral-400">
            <p>By accepting this challenge, ${gameDetails.stakeAmount} will be</p>
            <p>deducted from your wallet and locked until the game ends.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
