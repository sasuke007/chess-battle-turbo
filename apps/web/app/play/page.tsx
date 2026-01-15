"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Chess, Color, PieceSymbol, Square } from "chess.js";
import ChessBoard from "../components/ChessBoard";
import TimeControlSelector, {
  TimeControlValue,
} from "../components/TimeControlSelector";
import BettingAmountSelector from "../components/BettingAmountSelector";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { CompleteUserObject } from "@/lib/types";
import { useRouter } from "next/navigation";

const chess: Chess = new Chess();

export default function Play() {
  const { isLoaded, userObject }: { isLoaded: boolean; userObject: CompleteUserObject | null } = useRequireAuth();
  const userReferenceId = userObject?.user?.referenceId;
  const router = useRouter();
  const [board, setBoard] = useState<
    ({
      square: Square;
      type: PieceSymbol;
      color: Color;
    } | null)[][]
  >(chess.board());

  // Lifted state for form components
  const [timeControl, setTimeControl] = useState<TimeControlValue>({
    mode: "Blitz",
    control: "5 | 5",
    time: 300,
    increment: 5,
  });
  const [bettingAmount, setBettingAmount] = useState(100);
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const handleMove = (
    square: { square: Square; type: PieceSymbol; color: Color } | null
  ) => {
    console.log("move received:", square);
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userReferenceId) {
      alert("User not authenticated. Please sign in.");
      return;
    }

    setIsCreatingGame(true);

    console.log("Creating game with:", bettingAmount);
    console.log("Time control:", timeControl);

    const gameData = {
      userReferenceId: userReferenceId,
      stakeAmount: bettingAmount,
      initialTimeSeconds: timeControl.time,
      incrementSeconds: timeControl.increment,
    };

    try {
      // Call API to create game in database
      const response = await fetch("/api/chess/create-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameData),
      });

      const data = await response.json();
      console.log("Game created:", data);

      if (!data.success) {
        throw new Error(data.error || "Failed to create game");
      }

      const gameRef = data.data.game.referenceId;
      console.log("Redirecting to game:", gameRef);

      // Copy join URL to clipboard
      const joinUrl = `${window.location.origin}/join/${gameRef}`;
      try {
        await navigator.clipboard.writeText(joinUrl);
        console.log("Join URL copied to clipboard:", joinUrl);
        // Optional: Show a success message to user
        //TODO: Rather than showing this as an alert a good popup should open before being redirected.
        alert("Game link copied to clipboard! Share it with your friend.");
      } catch (clipboardError) {
        console.error("Failed to copy to clipboard:", clipboardError);
        // Fallback: Show the URL to user if clipboard fails
        alert(`Share this link with your friend: ${joinUrl}`);
      }

      // Redirect to game page - WebSocket connection will be established there
      router.push(`/game/${gameRef}`);
    } catch (error) {
      console.error("Error creating game:", error);
      alert(error instanceof Error ? error.message : "Failed to create game");
      setIsCreatingGame(false);
    }
  };

  //TODO: Make a cool loading page or shad cn spinner here.
  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex min-h-screen bg-neutral-900 items-center justify-center"
        )}
      >
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-screen bg-neutral-900")}>
      <div className={cn("flex justify-center items-center basis-1/2")}>
        <ChessBoard squareSize="size-10 sm:size-12 md:size-16 lg:size-20" />
      </div>
      <div
        className={cn(
          "flex flex-col justify-center items-center basis-1/2 p-8"
        )}
      >
        <form
          onSubmit={handleCreateGame}
          className="flex flex-col gap-4 w-full max-w-md"
        >
          <TimeControlSelector value={timeControl} onChange={setTimeControl} />
          <BettingAmountSelector
            amount={bettingAmount}
            onChange={setBettingAmount}
          />
          <Button
            type="submit"
            size="lg"
            disabled={isCreatingGame}
            className="w-full bg-white text-black hover:bg-gray-200 font-semibold text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingGame ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Creating Game...</span>
              </div>
            ) : (
              "Play"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
