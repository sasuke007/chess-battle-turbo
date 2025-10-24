"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { io, Socket } from "socket.io-client";
import ChessBoard from "../components/ChessBoard";

const chess: Chess = new Chess();

export default function Play() {
  const [board, setBoard] = useState<
    ({
      square: Square;
      type: PieceSymbol;
      color: Color;
    } | null)[][]
  >(chess.board());
  const socketRef = useRef<Socket | null>(null);

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

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  console.log(board);

  return (
    <div className={cn("flex")}>
      <ChessBoard />
          <div className={cn("flex flex-col justify-center items-center")}>
      </div>
    </div>
  );
}
