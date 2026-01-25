import React from "react";
import { cn } from "../../lib/utils";
import { Chess, Color, PieceSymbol, Square } from "chess.js";
import Image from "next/image";

type ChessProps = {
  board?: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];
  squareSize?: "sm" | "md" | "lg";
  selectedSquare?: Square | null;
  legalMoves?: Square[];
  onSquareClick?: (square: Square) => void;
  isInteractive?: boolean;
  playerColor?: Color | null;
  showCoordinates?: boolean;
  lastMove?: { from: Square; to: Square } | null;
};

const ChessBoard = ({
  board = new Chess().board(),
  squareSize = "lg",
  selectedSquare = null,
  legalMoves = [],
  onSquareClick,
  isInteractive = true,
  playerColor = "w",
  showCoordinates = true,
  lastMove = null,
}: ChessProps) => {
  // Size configurations
  const sizeConfig = {
    sm: "w-8 h-8 sm:w-9 sm:h-9",
    md: "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14",
    lg: "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16",
  };

  // Flip the board if player is black
  const displayBoard =
    playerColor === "b"
      ? [...board].reverse().map((row) => [...row].reverse())
      : board;

  const files = playerColor === "b"
    ? ["h", "g", "f", "e", "d", "c", "b", "a"]
    : ["a", "b", "c", "d", "e", "f", "g", "h"];

  const ranks = playerColor === "b"
    ? ["1", "2", "3", "4", "5", "6", "7", "8"]
    : ["8", "7", "6", "5", "4", "3", "2", "1"];

  // Convert row and column index to chess square notation
  const getSquareNotation = (
    rowIndex: number,
    columnIndex: number
  ): Square => {
    const fileArr = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const rankArr = ["8", "7", "6", "5", "4", "3", "2", "1"];

    let adjustedRow = rowIndex;
    let adjustedCol = columnIndex;

    if (playerColor === "b") {
      adjustedRow = 7 - rowIndex;
      adjustedCol = 7 - columnIndex;
    }

    return `${fileArr[adjustedCol]}${rankArr[adjustedRow]}` as Square;
  };

  const isSquareSelected = (rowIndex: number, columnIndex: number): boolean => {
    return selectedSquare === getSquareNotation(rowIndex, columnIndex);
  };

  const isSquareLegalMove = (rowIndex: number, columnIndex: number): boolean => {
    return legalMoves.includes(getSquareNotation(rowIndex, columnIndex));
  };

  const isLastMoveSquare = (rowIndex: number, columnIndex: number): boolean => {
    if (!lastMove) return false;
    const notation = getSquareNotation(rowIndex, columnIndex);
    return notation === lastMove.from || notation === lastMove.to;
  };

  const isLightSquare = (rowIndex: number, columnIndex: number): boolean => {
    return (rowIndex + columnIndex) % 2 === 0;
  };

  return (
    <div className="flex items-center justify-center w-full">
      {/* Board with outer frames */}
      <div className="relative">
        {/* Outer decorative frames */}
        <div className="absolute -inset-4 border border-white/10" />
        <div className="absolute -inset-8 border border-white/5" />

        {/* Main board container */}
        <div className="relative border border-white/20 shadow-2xl shadow-black/80">
          {/* The board itself */}
          {displayBoard.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((square, columnIndex) => {
                const squareNotation = getSquareNotation(rowIndex, columnIndex);
                const isSelected = isSquareSelected(rowIndex, columnIndex);
                const isLegalMove = isSquareLegalMove(rowIndex, columnIndex);
                const isLastMove = isLastMoveSquare(rowIndex, columnIndex);
                const isLight = isLightSquare(rowIndex, columnIndex);
                const hasPiece = square !== null;

                // Show file letter on bottom row (row 7)
                const showFile = showCoordinates && rowIndex === 7;
                // Show rank number on first column (column 0)
                const showRank = showCoordinates && columnIndex === 0;

                return (
                  <div
                    key={columnIndex}
                    onClick={() => isInteractive && onSquareClick?.(squareNotation)}
                    className={cn(
                      sizeConfig[squareSize],
                      "relative flex items-center justify-center",
                      "transition-all duration-150",
                      isInteractive && "cursor-pointer",
                      // Base square colors with subtle gradients
                      isLight
                        ? "bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200"
                        : "bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800"
                    )}
                    style={{
                      boxShadow: isLight
                        ? "inset 1px 1px 2px rgba(0,0,0,0.08), inset -1px -1px 1px rgba(255,255,255,0.9)"
                        : "inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 2px rgba(255,255,255,0.05)",
                    }}
                  >
                    {/* Coordinate: Rank number (top-left corner) */}
                    {showRank && (
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 text-[7px] sm:text-[8px] font-medium leading-none select-none",
                          isLight ? "text-neutral-500/70" : "text-neutral-400/70"
                        )}
                        style={{ fontFamily: "'Geist', sans-serif" }}
                      >
                        {ranks[rowIndex]}
                      </span>
                    )}

                    {/* Coordinate: File letter (bottom-right corner) */}
                    {showFile && (
                      <span
                        className={cn(
                          "absolute bottom-0.5 right-0.5 text-[7px] sm:text-[8px] font-medium leading-none select-none",
                          isLight ? "text-neutral-500/70" : "text-neutral-400/70"
                        )}
                        style={{ fontFamily: "'Geist', sans-serif" }}
                      >
                        {files[columnIndex]}
                      </span>
                    )}

                    {/* Last move highlight */}
                    {isLastMove && (
                      <div
                        className={cn(
                          "absolute inset-0 z-0",
                          isLight
                            ? "bg-amber-300/30"
                            : "bg-amber-500/25"
                        )}
                      />
                    )}

                    {/* Selected square highlight */}
                    {isSelected && (
                      <div
                        className={cn(
                          "absolute inset-0 z-10",
                          isLight
                            ? "bg-sky-400/40 ring-2 ring-inset ring-sky-500/60"
                            : "bg-sky-500/30 ring-2 ring-inset ring-sky-400/50"
                        )}
                      />
                    )}

                    {/* Legal move indicator */}
                    {isLegalMove && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center">
                        {hasPiece ? (
                          // Capture indicator - corner triangles
                          <>
                            <div className={cn(
                              "absolute top-0 left-0 w-0 h-0",
                              "border-t-[10px] border-l-[10px] border-r-[10px] border-b-[10px]",
                              "border-t-red-500/60 border-l-red-500/60",
                              "border-r-transparent border-b-transparent",
                              "sm:border-t-[12px] sm:border-l-[12px] sm:border-r-[12px] sm:border-b-[12px]"
                            )} />
                            <div className={cn(
                              "absolute bottom-0 right-0 w-0 h-0",
                              "border-t-[10px] border-l-[10px] border-r-[10px] border-b-[10px]",
                              "border-b-red-500/60 border-r-red-500/60",
                              "border-l-transparent border-t-transparent",
                              "sm:border-t-[12px] sm:border-l-[12px] sm:border-r-[12px] sm:border-b-[12px]"
                            )} />
                          </>
                        ) : (
                          // Move indicator - elegant dot
                          <div
                            className={cn(
                              "w-3 h-3 sm:w-4 sm:h-4 rounded-full",
                              isLight
                                ? "bg-neutral-900/30"
                                : "bg-white/30"
                            )}
                          />
                        )}
                      </div>
                    )}

                    {/* Chess piece */}
                    {square !== null && (
                      <div
                        className={cn(
                          "relative z-20 w-[85%] h-[85%]",
                          "transition-transform duration-100",
                          isInteractive && "hover:scale-105",
                          isSelected && "scale-105"
                        )}
                      >
                        <Image
                          src={`/chess-icons/${square.color}${square.type}.png`}
                          alt={`${square.color === "w" ? "White" : "Black"} ${square.type}`}
                          width={100}
                          height={100}
                          className={cn(
                            "w-full h-full object-contain",
                            square.color === "w"
                              ? "drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]"
                              : "drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
                          )}
                          draggable={false}
                        />
                      </div>
                    )}

                    {/* Hover state for interactive squares */}
                    {isInteractive && !isSelected && (
                      <div
                        className={cn(
                          "absolute inset-0 z-5 opacity-0 hover:opacity-100",
                          "transition-opacity duration-150",
                          isLight
                            ? "bg-black/5"
                            : "bg-white/5"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
