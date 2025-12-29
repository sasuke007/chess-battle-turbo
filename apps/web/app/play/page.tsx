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

      // Redirect to game page - WebSocket connection will be established there
      router.push(`/game/${gameRef}`);
    } catch (error) {
      console.error("Error creating game:", error);
      alert(error instanceof Error ? error.message : "Failed to create game");
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
            className="w-full bg-white text-black hover:bg-gray-200 font-semibold text-lg py-6"
          >
            Play
          </Button>
        </form>
      </div>
    </div>
  );
}
