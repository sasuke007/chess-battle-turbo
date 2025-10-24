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
};

//TODO: Give white some shade of white , give black some shade of black.

const ChessBoard = ({
  board = new Chess().board(),
  squareSize = "size-12 md:size-16 lg:size-20",
  whiteSquareColor = "bg-white",
  blackSquareColor = "bg-black",
  squareBorderColor = "border-neutral-800",
  boardBorderColor = "border-neutral-800",
}: ChessProps) => {
  console.log(board);
  return (
    <div
      className={cn(
        `flex flex-col border-2 ${boardBorderColor}`,
        "w-fit h-fit" // This makes the div only take up the necessary width and height
      )}
    >
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className={cn("flex")}>
          {row.map((square, columnIndex) => (
            <div
              key={columnIndex}
              className={cn(
                `${squareSize} flex justify-center items-center border-2 ${squareBorderColor}`,
                (rowIndex + columnIndex) % 2 === 0
                  ? whiteSquareColor
                  : blackSquareColor
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
          ))}
        </div>
      ))}
    </div>
  );
};

export default ChessBoard;
