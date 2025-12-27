"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { io, Socket } from "socket.io-client";
import ChessBoard from "../components/ChessBoard";
import TimeControlSelector, {
  TimeControlValue,
} from "../components/TimeControlSelector";
import BettingAmountSelector from "../components/BettingAmountSelector";
import { Button } from "@/components/ui/button";
import { IoCopyOutline } from "react-icons/io5";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { CompleteUserObject } from "@/lib/types";

const chess: Chess = new Chess();

export default function Play() {
  const { isLoaded, userObject }: { isLoaded: boolean; userObject: CompleteUserObject | null } = useRequireAuth();
  const userReferenceId = userObject?.user?.referenceId;
  const linkGeneratedRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState<
    ({
      square: Square;
      type: PieceSymbol;
      color: Color;
    } | null)[][]
  >(chess.board());
  const socketRef = useRef<Socket | null>(null);
  const [gameReferenceId, setGameReferenceId] = useState<string | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

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
    socketRef.current?.emit("move", {
      from: square?.square,
      to: square?.square,
      promotion: square?.type,
    });
  };

  useEffect(() => {
    if (!isLoaded || !userReferenceId) {
      return;
    }

    // Initialize WebSocket connection
    socketRef.current = io("ws://localhost:3002");

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server:", socketRef.current?.id);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    socketRef.current.on("waiting_for_opponent", (payload: any) => {
      console.log("Waiting for opponent:", payload);
      setWaitingForOpponent(true);
    });

    socketRef.current.on("game_started", (payload: any) => {
      console.log("Game started:", payload);
      setWaitingForOpponent(false);
      // Redirect to game page
      if (payload.gameReferenceId) {
        window.location.href = `/game/${payload.gameReferenceId}`;
      }
    });

    socketRef.current.on("error", (payload: any) => {
      console.error("WebSocket error:", payload);
      alert(payload.message || "An error occurred");
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isLoaded, userReferenceId]);

  // console.log(board);

  const handleCopyLink = async () => {
    if (linkGeneratedRef.current?.textContent) {
      await navigator.clipboard.writeText(linkGeneratedRef.current.textContent);
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();

    //TODO: Do we need  this check , i think this page wont load if user is not authenticated.
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

    console.log("Creating game with:", gameData);

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
      setGameReferenceId(gameRef);

      // Generate and display join link
      if (linkGeneratedRef.current) {
        linkGeneratedRef.current.innerHTML = `http://localhost:3000/join/${gameRef}`;
      }

      // Join the game via WebSocket
      if (socketRef.current?.connected) {
        socketRef.current.emit("join_game", {
          gameReferenceId: gameRef,
          userReferenceId: gameData.userReferenceId,
        });
      } else {
        console.error("WebSocket not connected");
        //alert("WebSocket connection failed. Please refresh and try again.");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      //alert(error instanceof Error ? error.message : "Failed to create game");
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
        {gameReferenceId && (
          <div className="mt-6 w-full max-w-md">
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="text-white text-lg font-semibold mb-3">
                {waitingForOpponent
                  ? "Waiting for opponent..."
                  : "Share this link:"}
              </h3>
              <div className="flex items-center gap-2 bg-neutral-700 rounded p-3">
                <div
                  ref={linkGeneratedRef}
                  className="text-white text-sm flex-1 overflow-x-auto"
                />
                <button
                  onClick={handleCopyLink}
                  className="text-white hover:text-gray-300 cursor-pointer p-2"
                  title="Copy link"
                >
                  <IoCopyOutline size={20} />
                </button>
              </div>
              {waitingForOpponent && (
                <div className="mt-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
