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
  squareSize?: string;
  whiteSquareColor?: string;
  blackSquareColor?: string;
  squareBorderColor?: string;
  boardBorderColor?: string;
  selectedSquare?: Square | null;
  legalMoves?: Square[];
  onSquareClick?: (square: Square) => void;
  isInteractive?: boolean;
  playerColor?: Color | null;
};

//TODO: Give white some shade of white , give black some shade of black.

const ChessBoard = ({
  board = new Chess().board(),
  squareSize = "size-8 sm:size-10 md:size-14 lg:size-16",
  whiteSquareColor = "bg-white",
  blackSquareColor = "bg-black",
  squareBorderColor = "border-neutral-800",
  boardBorderColor = "border-neutral-800",
  selectedSquare = null,
  legalMoves = [],
  onSquareClick,
  isInteractive = true,
  playerColor = "w",
}: ChessProps) => {
  // Flip the board if player is black
  const displayBoard = playerColor === "b" 
    ? [...board].reverse().map(row => [...row].reverse())
    : board;

  // Convert row and column index to chess square notation (e.g., e2, e4)
  const getSquareNotation = (rowIndex: number, columnIndex: number): Square => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
    
    // Adjust indices if board is flipped for black player
    if (playerColor === "b") {
      rowIndex = 7 - rowIndex;
      columnIndex = 7 - columnIndex;
    }
    
    return `${files[columnIndex]}${ranks[rowIndex]}` as Square;
  };

  const isSquareSelected = (rowIndex: number, columnIndex: number): boolean => {
    return selectedSquare === getSquareNotation(rowIndex, columnIndex);
  };

  const isSquareLegalMove = (rowIndex: number, columnIndex: number): boolean => {
    return legalMoves.includes(getSquareNotation(rowIndex, columnIndex));
  };

  return (
    <div
      className={cn(
        `flex flex-col border-2 ${boardBorderColor}`,
        "w-fit h-fit" // This makes the div only take up the necessary width and height
      )}
    >
      {displayBoard.map((row, rowIndex) => (
        <div key={rowIndex} className={cn("flex")}>
          {row.map((square, columnIndex) => {
            const squareNotation = getSquareNotation(rowIndex, columnIndex);
            const isSelected = isSquareSelected(rowIndex, columnIndex);
            const isLegalMove = isSquareLegalMove(rowIndex, columnIndex);

            return (
              <div
                key={columnIndex}
                onClick={() => onSquareClick?.(squareNotation)}
                className={cn(
                  `${squareSize} flex justify-center items-center border-2 ${squareBorderColor} relative`,
                  (rowIndex + columnIndex) % 2 === 0
                    ? whiteSquareColor
                    : blackSquareColor,
                  isSelected && "ring-4 ring-yellow-400 ring-inset",
                  isLegalMove && "after:absolute after:w-4 after:h-4 after:bg-green-500 after:rounded-full after:opacity-60"
                )}
              >
                {square !== null ? (
                  <Image
                    src={`/chess-icons/${square.color}${square.type}.png`}
                    alt={square.type}
                    width={100}
                    height={100}
                    className="w-full h-full"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ChessBoard;
