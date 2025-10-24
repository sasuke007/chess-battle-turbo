import React from "react";
import { cn } from "../../lib/utils";

type ChessProps = {
  squareSize?: string;
  whiteSquareColor?: string;
  blackSquareColor?: string;
  squareBorderColor?: string;
  boardBorderColor?: string;
};

const ChessBoard = ({
  squareSize = "md:size-20 sm:size-10",
  whiteSquareColor = "bg-white",
  blackSquareColor = "bg-black",
  squareBorderColor = "border-neutral-800",
  boardBorderColor = "border-neutral-800",
}: ChessProps) => {
  return (
    <div
      className={cn(
        `flex flex-col border-2 ${boardBorderColor}`,
        "w-fit h-fit" // This makes the div only take up the necessary width and height
      )}
    >
      {Array.from({ length: 8 }).map((_, rowIndex: number) => (
        <div key={rowIndex} className={cn("flex")}>
          {["a", "b", "c", "d", "e", "f", "g", "h"].map(
            (rank, columnIndex: number) => (
              <div
                key={rank}
                className={cn(
                  // Yes, Tailwind CSS will work with this syntax because the dynamic values are constructed from valid Tailwind class names passed as props.
                  `${squareSize} flex justify-center items-center border-2 ${squareBorderColor}`,
                  // Yes, Tailwind CSS will work with this syntax because the values for `whiteSquareColor` and `blackSquareColor` are defaulting to valid Tailwind class names
                  (rowIndex + columnIndex) % 2 === 0
                    ? whiteSquareColor
                    : blackSquareColor
                )}
              >
                {rank}
                {8 - rowIndex}
                
              </div>
            )
          )}
        </div>
      ))}
    </div>
    //TODO: Put a to h and 1 to 8 on boxes
  );
};

export default ChessBoard;
