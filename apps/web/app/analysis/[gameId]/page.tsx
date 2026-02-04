"use client";

import { useState, useEffect, use } from "react";
import { Move, Color } from "chess.js";
import { useRouter } from "next/navigation";
import ChessBoard from "../../components/ChessBoard";
import AnalysisMoveList from "../../components/AnalysisMoveList";
import { useAnalysisBoard } from "@/lib/hooks/useAnalysisBoard";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface AnalysisData {
  gameReferenceId: string;
  startingFen: string;
  userMoves: Move[];
  userColor: "w" | "b";
  gameResult: string | null;
  legendMoves: Move[];
  moveNumberStart: number;
  whitePlayerName: string | null;
  blackPlayerName: string | null;
  tournamentName: string | null;
  legendPgn: string | null;
}

const AnalysisPage = ({ params }: { params: Promise<{ gameId: string }> }) => {
  const router = useRouter();
  const { gameId } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisData | null>(null);

  // Fetch analysis data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/analysis/${gameId}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || "Failed to load analysis data");
          return;
        }

        setData(result.data);
      } catch (err) {
        setError("Failed to load analysis data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId]);

  // Initialize analysis board hook
  const analysisBoard = useAnalysisBoard({
    startingFen: data?.startingFen || "",
    userMoves: data?.userMoves || [],
    legendMoves: data?.legendMoves || [],
    userColor: (data?.userColor || "w") as Color,
  });

  const {
    plyIndex,
    maxPly,
    userBoard,
    legendBoard,
    goToFirst,
    goBack,
    goForward,
    goToLast,
    goToPly,
    isAtStart,
    isAtEnd,
    divergences,
    userLastMove,
    legendLastMove,
    isFlipped,
    toggleFlip,
  } = analysisBoard;

  // Tab state: "your-moves" | "comparison" | "legend-moves"
  const [activeTab, setActiveTab] = useState<"your-moves" | "comparison" | "legend-moves">("legend-moves");

  // Determine starting side from FEN
  const startingSide =
    data?.startingFen?.split(" ")[1] === "b" ? "b" : "w";

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border border-white/20 border-t-white/60 rounded-full animate-spin mb-6" />
          <p
            style={{ fontFamily: "'Geist', sans-serif" }}
            className="text-white/40 text-xs tracking-[0.2em] uppercase"
          >
            Loading Analysis
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-white text-xl mb-4"
          >
            {error || "Analysis data not found"}
          </p>
          <button
            onClick={() => router.push("/play")}
            className="px-6 py-2 border border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors"
            style={{ fontFamily: "'Geist', sans-serif" }}
          >
            Back to Play
          </button>
        </div>
      </div>
    );
  }

  const hasLegendMoves = data.legendMoves.length > 0;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden lg:overflow-auto">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-2 lg:px-4 pb-0 lg:pb-8 pt-14 lg:pt-20 h-[100dvh] lg:h-auto flex flex-col lg:block">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-0 lg:gap-8"
        >
          {/* Left - Move List (hidden on mobile) */}
          <div className="lg:col-span-3 order-2 lg:order-1 hidden lg:flex lg:flex-col">
            <div className="border border-white/10 flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.3em] uppercase text-white/40"
                >
                  Move Comparison
                </p>
              </div>
              {hasLegendMoves ? (
                <AnalysisMoveList
                  divergences={divergences}
                  currentPlyIndex={plyIndex}
                  onPlyClick={goToPly}
                  moveNumberStart={data.moveNumberStart}
                  startingSide={startingSide as "w" | "b"}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-white/30 text-sm text-center"
                  >
                    No legend moves available for comparison
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Center - Chess Board */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex-1 flex flex-col justify-center lg:block">
            {/* Header with Legend Names */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-4 lg:mb-6 px-2"
            >
              {/* Legend vs Legend */}
              <h1
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="text-white text-lg lg:text-2xl tracking-wide"
              >
                {data.whitePlayerName || "White"}{" "}
                <span className="text-white/40">vs</span>{" "}
                {data.blackPlayerName || "Black"}
              </h1>

              {/* Tournament & Starting Move */}
              <div className="flex items-center justify-center gap-2 mt-1">
                {data.tournamentName && (
                  <>
                    <p
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/40 text-xs"
                    >
                      {data.tournamentName}
                    </p>
                    <span className="text-white/20">•</span>
                  </>
                )}
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-white/40 text-xs"
                >
                  From move {data.moveNumberStart}
                </p>
                {data.gameResult && (
                  <>
                    <span className="text-white/20">•</span>
                    <p
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/40 text-xs"
                    >
                      {data.gameResult.replace(/_/g, " ")}
                    </p>
                  </>
                )}
              </div>
            </motion.div>

            {/* Tabs */}
            {hasLegendMoves && (
              <div className="flex items-center justify-center gap-1 mb-3 px-2">
                <button
                  onClick={() => setActiveTab("legend-moves")}
                  className={cn(
                    "px-4 py-2 text-xs tracking-wide border transition-colors",
                    activeTab === "legend-moves"
                      ? "border-sky-500/40 text-sky-400 bg-sky-500/10"
                      : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                  )}
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  Legend&apos;s Moves
                </button>
                <button
                  onClick={() => setActiveTab("your-moves")}
                  className={cn(
                    "px-4 py-2 text-xs tracking-wide border transition-colors",
                    activeTab === "your-moves"
                      ? "border-white/40 text-white bg-white/10"
                      : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                  )}
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  Your Moves
                </button>
                <button
                  onClick={() => setActiveTab("comparison")}
                  className={cn(
                    "px-4 py-2 text-xs tracking-wide border transition-colors",
                    activeTab === "comparison"
                      ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                      : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                  )}
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  Comparison
                </button>
              </div>
            )}

            {/* Move Counter */}
            <div className="flex items-center justify-center gap-4 mb-3 px-2">
              <p
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-white/50 text-sm"
              >
                Move{" "}
                <span className="text-white font-mono">
                  {plyIndex} / {maxPly}
                </span>
              </p>
            </div>

            {/* Board */}
            <div className="mx-0 my-3 lg:m-8">
              <ChessBoard
                board={activeTab === "legend-moves" ? legendBoard : userBoard}
                shadowBoard={activeTab === "comparison" ? legendBoard : undefined}
                playerColor={isFlipped ? "b" : "w"}
                showCoordinates={true}
                lastMove={activeTab === "legend-moves" ? legendLastMove : userLastMove}
                shadowLastMove={activeTab === "comparison" ? legendLastMove : null}
                isInteractive={false}
                gameEndState={null}
                fadedPieces={activeTab === "legend-moves"}
              />
            </div>

            {/* Navigation Controls */}
            <div className="flex flex-col items-center gap-3 mt-3 lg:mt-0 px-2 lg:px-0">
              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToFirst}
                  disabled={isAtStart}
                  className={cn(
                    "w-11 h-11 flex items-center justify-center border transition-colors",
                    isAtStart
                      ? "opacity-30 cursor-not-allowed border-white/10"
                      : "border-white/20 bg-white/5 hover:bg-white/15 active:bg-white/20"
                  )}
                  title="First (Home)"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/70"
                  >
                    <polyline points="11 17 6 12 11 7" />
                    <polyline points="18 17 13 12 18 7" />
                  </svg>
                </button>
                <button
                  onClick={goBack}
                  disabled={isAtStart}
                  className={cn(
                    "w-11 h-11 flex items-center justify-center border transition-colors",
                    isAtStart
                      ? "opacity-30 cursor-not-allowed border-white/10"
                      : "border-white/20 bg-white/5 hover:bg-white/15 active:bg-white/20"
                  )}
                  title="Back (Left Arrow)"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/70"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={goForward}
                  disabled={isAtEnd}
                  className={cn(
                    "w-11 h-11 flex items-center justify-center border transition-colors",
                    isAtEnd
                      ? "opacity-30 cursor-not-allowed border-white/10"
                      : "border-white/20 bg-white/5 hover:bg-white/15 active:bg-white/20"
                  )}
                  title="Forward (Right Arrow)"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/70"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  onClick={goToLast}
                  disabled={isAtEnd}
                  className={cn(
                    "w-11 h-11 flex items-center justify-center border transition-colors",
                    isAtEnd
                      ? "opacity-30 cursor-not-allowed border-white/10"
                      : "border-white/20 bg-white/5 hover:bg-white/15 active:bg-white/20"
                  )}
                  title="Last (End)"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/70"
                  >
                    <polyline points="13 17 18 12 13 7" />
                    <polyline points="6 17 11 12 6 7" />
                  </svg>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFlip}
                  className="h-10 px-4 text-sm border border-white/20 text-white/60 bg-white/5 hover:bg-white/15 hover:text-white transition-colors"
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  Flip Board
                </button>
                <button
                  onClick={() => router.push("/play")}
                  className="h-10 px-4 text-sm border border-white/20 text-white/60 bg-white/5 hover:bg-white/15 hover:text-white transition-colors"
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  Back
                </button>
              </div>
            </div>

            {/* Legend Key (Mobile) */}
            <div className="lg:hidden mt-4 px-4">
              <div className="flex items-center justify-center gap-6 py-3 border-t border-white/10">
                {activeTab === "your-moves" && (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-white/90 border border-white/40 flex items-center justify-center">
                      <span className="text-xs">♟</span>
                    </div>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/60 text-xs"
                    >
                      Your Move
                    </span>
                  </div>
                )}
                {activeTab === "comparison" && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-white/90 border border-white/40 flex items-center justify-center">
                        <span className="text-xs">♟</span>
                      </div>
                      <span
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-white/60 text-xs"
                      >
                        Your Move
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 bg-white/30 border border-white/20 flex items-center justify-center"
                        style={{ opacity: 0.6 }}
                      >
                        <span className="text-xs">♟</span>
                      </div>
                      <span
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-white/60 text-xs"
                      >
                        Legend
                      </span>
                    </div>
                  </>
                )}
                {activeTab === "legend-moves" && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 bg-white/30 border border-white/20 flex items-center justify-center"
                      style={{ opacity: 0.8 }}
                    >
                      <span className="text-xs">♟</span>
                    </div>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/60 text-xs"
                    >
                      Legend&apos;s Moves
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right - Legend Key & Info (hidden on mobile) */}
          <div className="lg:col-span-3 order-3 hidden lg:block space-y-4">
            {/* Legend Key - Comparison Mode */}
            {hasLegendMoves && activeTab === "comparison" && (
              <div className="border border-white/10 p-5">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-4"
                >
                  Legend Key
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/5 border border-white/20 flex items-center justify-center">
                      <span className="text-white text-lg">♟</span>
                    </div>
                    <div>
                      <p
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-white text-sm"
                      >
                        Your Move
                      </p>
                      <p
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-white/40 text-xs"
                      >
                        Solid pieces
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 bg-white/5 border border-white/20 flex items-center justify-center"
                      style={{ opacity: 0.6 }}
                    >
                      <span className="text-white text-lg">♟</span>
                    </div>
                    <div>
                      <p
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-white/60 text-sm"
                      >
                        Legend&apos;s Move
                      </p>
                      <p
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-white/40 text-xs"
                      >
                        Faded overlay
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legend Key - Legend Moves Mode */}
            {hasLegendMoves && activeTab === "legend-moves" && (
              <div className="border border-sky-500/20 p-5">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.3em] uppercase text-sky-400/60 mb-4"
                >
                  Legend&apos;s Board
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 bg-white/5 border border-white/20 flex items-center justify-center"
                    style={{ opacity: 0.8 }}
                  >
                    <span className="text-white text-lg">♟</span>
                  </div>
                  <div>
                    <p
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/60 text-sm"
                    >
                      Legend&apos;s Pieces
                    </p>
                    <p
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/40 text-xs"
                    >
                      Subtle fade
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Divergence Info */}
            {hasLegendMoves && (
              <div className="border border-white/10 p-5">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3"
                >
                  Statistics
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/60 text-sm"
                    >
                      Total Moves
                    </span>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white text-sm font-mono"
                    >
                      {maxPly}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/60 text-sm"
                    >
                      Divergent Moves
                    </span>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-amber-400 text-sm font-mono"
                    >
                      {divergences.filter((d) => d.isDivergent).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/60 text-sm"
                    >
                      Match Rate
                    </span>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-green-400 text-sm font-mono"
                    >
                      {maxPly > 0
                        ? Math.round(
                            ((maxPly -
                              divergences.filter((d) => d.isDivergent).length) /
                              maxPly) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts */}
            <div className="border border-white/5 p-5">
              <p
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-3"
              >
                Keyboard Shortcuts
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-white/40">
                  <span>← →</span>
                  <span>Navigate moves</span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span>↑ / Home</span>
                  <span>First move</span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span>↓ / End</span>
                  <span>Last move</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalysisPage;
