"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { DivergenceInfo } from "../../lib/hooks/useAnalysisBoard";

interface AnalysisMoveListProps {
  divergences: DivergenceInfo[];
  currentPlyIndex: number;
  onPlyClick: (ply: number) => void;
  moveNumberStart: number;
  startingSide: "w" | "b";
}

export default function AnalysisMoveList({
  divergences,
  currentPlyIndex,
  onPlyClick,
  moveNumberStart,
  startingSide,
}: AnalysisMoveListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active move
  useEffect(() => {
    if (activeRowRef.current && listRef.current) {
      activeRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentPlyIndex]);

  // Group moves into pairs (full moves)
  const moveRows: {
    moveNumber: number;
    whitePly: DivergenceInfo | null;
    blackPly: DivergenceInfo | null;
  }[] = [];

  let plyOffset = 0;

  // If starting side is black, first move is black's
  if (startingSide === "b") {
    // First move is black
    const firstMove = divergences[0];
    if (firstMove) {
      moveRows.push({
        moveNumber: moveNumberStart,
        whitePly: null,
        blackPly: firstMove,
      });
      plyOffset = 1;
    }
  }

  // Group remaining moves into pairs
  for (let i = plyOffset; i < divergences.length; i += 2) {
    const whitePly = divergences[i] || null;
    const blackPly = divergences[i + 1] || null;
    const moveNum =
      moveNumberStart + Math.floor((i - plyOffset) / 2) + (plyOffset > 0 ? 1 : 0);

    moveRows.push({
      moveNumber: moveNum,
      whitePly,
      blackPly,
    });
  }

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 grid grid-cols-[40px_1fr_1fr] gap-1 px-2 py-2 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="text-[10px] text-white/40 uppercase tracking-wider">#</div>
        <div className="text-[10px] text-white/40 uppercase tracking-wider">
          Your Move
        </div>
        <div className="text-[10px] text-white/40 uppercase tracking-wider">
          Legend
        </div>
      </div>

      {/* Move rows */}
      <div className="space-y-0.5 p-2">
        {moveRows.map((row, rowIndex) => {
          const whiteIsActive =
            row.whitePly && currentPlyIndex === row.whitePly.plyIndex;
          const blackIsActive =
            row.blackPly && currentPlyIndex === row.blackPly.plyIndex;
          const isActive = whiteIsActive || blackIsActive;

          return (
            <div
              key={rowIndex}
              ref={isActive ? activeRowRef : null}
              className="grid grid-cols-[40px_1fr_1fr] gap-1"
            >
              {/* Move number */}
              <div className="text-xs text-white/30 font-mono py-1">
                {row.moveNumber}.
              </div>

              {/* White's move */}
              {row.whitePly ? (
                <MoveCell
                  divergence={row.whitePly}
                  isActive={whiteIsActive || false}
                  onClick={() => onPlyClick(row.whitePly!.plyIndex)}
                />
              ) : (
                <div className="text-xs text-white/20 py-1">...</div>
              )}

              {/* Black's move */}
              {row.blackPly ? (
                <MoveCell
                  divergence={row.blackPly}
                  isActive={blackIsActive || false}
                  onClick={() => onPlyClick(row.blackPly!.plyIndex)}
                />
              ) : (
                <div />
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {moveRows.length === 0 && (
          <div className="text-center text-white/40 py-8 text-sm">
            No moves to display
          </div>
        )}
      </div>
    </div>
  );
}

interface MoveCellProps {
  divergence: DivergenceInfo;
  isActive: boolean;
  onClick: () => void;
}

function MoveCell({ divergence, isActive, onClick }: MoveCellProps) {
  const { userMove, legendMove, isDivergent } = divergence;

  return (
    <div
      onClick={onClick}
      className={cn(
        "grid grid-cols-2 gap-1 py-1 px-1.5 rounded cursor-pointer transition-all duration-150",
        isActive && "bg-white/10 ring-1 ring-white/20",
        !isActive && "hover:bg-white/5",
        isDivergent && "bg-amber-500/10"
      )}
    >
      {/* User's move */}
      <div
        className={cn(
          "text-xs font-mono truncate",
          userMove ? "text-white" : "text-white/30"
        )}
      >
        {userMove?.san || "-"}
      </div>

      {/* Legend's move */}
      <div
        className={cn(
          "text-xs font-mono truncate",
          legendMove ? "text-white/50" : "text-white/30",
          isDivergent && legendMove && "text-amber-400/70"
        )}
      >
        {legendMove?.san || "-"}
      </div>
    </div>
  );
}
