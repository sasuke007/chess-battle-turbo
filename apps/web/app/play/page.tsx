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

const chess: Chess = new Chess();

export default function Play() {
  const linkGeneratedRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState<
    ({
      square: Square;
      type: PieceSymbol;
      color: Color;
    } | null)[][]
  >(chess.board());
  const socketRef = useRef<Socket | null>(null);

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
    socketRef.current = io("ws://localhost:3002");

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server:", socketRef.current?.id);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    socketRef.current.on("gameCreated", () => {
      console.log("Game created:");
      
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  console.log(board);

  const handleCopyLink = async () => {
    if (linkGeneratedRef.current?.textContent) {
      await navigator.clipboard.writeText(linkGeneratedRef.current.textContent);
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating game with:", bettingAmount);
    console.log("Time control:", timeControl);
    // Here you have access to all the form values
    const gameData = {
      //TODO: Get logged in user and also make sure that the user that
      userReferenceId: "cmh0x9hzo0000gp1myxos778k",
      stakeAmount: bettingAmount,
      initialTimeSeconds: timeControl.time,
      incrementSeconds: timeControl.increment,
    };

    console.log("Creating game with:", gameData);

    try {
      // TODO: Call your API here
      const response = await fetch("/api/chess/create-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameData),
      });

      const data = await response.json();
      console.log("Game created:", data);
      if (linkGeneratedRef.current) {
        linkGeneratedRef.current.innerHTML = `http://localhost:3000/join/${data.game.inviteCode}`;
      }
    } catch (error) {
      console.error("Error creating game:", error);
      // Handle error (e.g., show error message)
    }
  };

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
        <div className="flex ">
          <div ref={linkGeneratedRef}>
          </div>
          <div onClick={handleCopyLink} className="cursor-pointer">
            <IoCopyOutline />
          </div>
        </div>
      </div>
    </div>
  );
}
