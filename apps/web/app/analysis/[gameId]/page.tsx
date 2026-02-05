"use client";

import { useState, useEffect, use } from "react";
import { Move, Color } from "chess.js";
import { useRouter } from "next/navigation";
import ChessBoard from "../../components/ChessBoard";
import AnalysisMoveList from "../../components/AnalysisMoveList";
import { Navbar } from "../../components/Navbar";
import { useAnalysisBoard } from "@/lib/hooks/useAnalysisBoard";
import { useRequireAuth, UseRequireAuthReturn } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface AnalysisData {
  gameReferenceId: string;
  startingFen: string;
  userMoves: Move[];
  userColor: "w" | "b";
  gameResult: string | null;
  userGameOutcome: "win" | "loss" | "draw" | null;
  legendMoves: Move[];
  moveNumberStart: number;
  whitePlayerName: string | null;
  blackPlayerName: string | null;
  tournamentName: string | null;
  legendPgn: string | null;
  legendGameResult: "white_won" | "black_won" | "draw" | null;
}

const AnalysisPage = ({ params }: { params: Promise<{ gameId: string }> }) => {
  const router = useRouter();
  const { gameId } = use(params);
  const { isReady, userObject }: UseRequireAuthReturn = useRequireAuth();
  const userReferenceId = userObject?.user?.referenceId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisData | null>(null);

  // Fetch analysis data
  useEffect(() => {
    if (!isReady) return;

    const fetchData = async () => {
      try {
        const url = userReferenceId
          ? `/api/analysis/${gameId}?userReferenceId=${userReferenceId}`
          : `/api/analysis/${gameId}`;
        const response = await fetch(url);
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
  }, [gameId, isReady, userReferenceId]);

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

  if (!isReady || loading) {
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
    <div className="min-h-screen bg-black text-white overflow-auto">
      {/* Navbar */}
      <Navbar />

      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-8 md:px-12 lg:px-4 pb-12 md:pb-20 lg:pb-12 pt-20 md:pt-24 lg:pt-20 flex flex-col">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-0 lg:gap-8 min-h-0"
        >
          {/* Left - Move List (hidden on mobile) */}
          <div className="lg:col-span-3 order-2 lg:order-1 hidden lg:flex lg:flex-col">
            <div className="border border-white/10 flex flex-col max-h-[70vh] overflow-hidden">
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
          <div className="lg:col-span-6 order-1 lg:order-2 flex-1 flex flex-col justify-between lg:justify-start lg:block">
            {/* Compact Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-1 lg:mb-1 px-2"
            >
              {/* Single-line compact header */}
              <div className="flex items-center justify-center gap-x-1.5 gap-y-0.5 lg:gap-x-2 lg:gap-y-0.5 flex-wrap">
                {/* Tournament name */}
                {data.tournamentName && (
                  <>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/25 text-[10px] lg:text-xs"
                    >
                      {data.tournamentName}
                    </span>
                    {(data.whitePlayerName || data.blackPlayerName) && (
                      <span className="text-white/20">·</span>
                    )}
                  </>
                )}

                {/* Legend players + result */}
                {(data.whitePlayerName || data.blackPlayerName) && (
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <span
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                      className="text-sky-300/60 text-sm lg:text-base"
                    >
                      {data.whitePlayerName || "White"}
                    </span>
                    {data.legendGameResult && (
                      <span
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-sky-400/70 text-xs lg:text-sm font-medium"
                      >
                        {data.legendGameResult === "white_won" && "1–0"}
                        {data.legendGameResult === "black_won" && "0–1"}
                        {data.legendGameResult === "draw" && "½–½"}
                      </span>
                    )}
                    {!data.legendGameResult && (
                      <span className="text-white/20 text-xs">vs</span>
                    )}
                    <span
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                      className="text-sky-300/60 text-sm lg:text-base"
                    >
                      {data.blackPlayerName || "Black"}
                    </span>
                  </div>
                )}

                {/* Separator */}
                {(data.whitePlayerName || data.blackPlayerName || data.tournamentName) && data.userGameOutcome && (
                  <span className="text-white/15 hidden sm:inline">|</span>
                )}

                {/* Your result (compact) */}
                {data.userGameOutcome && (
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/40 text-[10px] lg:text-xs uppercase tracking-wider"
                    >
                      You
                    </span>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className={cn(
                        "text-xs lg:text-sm font-medium px-1.5 py-0.5",
                        data.userGameOutcome === "win" && "text-amber-400 bg-amber-400/10",
                        data.userGameOutcome === "loss" && "text-white/50 bg-white/5",
                        data.userGameOutcome === "draw" && "text-white/50 bg-white/5"
                      )}
                    >
                      {data.userGameOutcome === "win" && "Won"}
                      {data.userGameOutcome === "loss" && "Lost"}
                      {data.userGameOutcome === "draw" && "Drew"}
                    </span>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/30 text-[10px] lg:text-xs"
                    >
                      as {data.userColor === "w" ? "White" : "Black"}
                    </span>
                  </div>
                )}

                {/* Separator */}
                {(data.whitePlayerName || data.blackPlayerName || data.tournamentName || data.userGameOutcome) && (
                  <span className="text-white/15 hidden sm:inline">|</span>
                )}

                {/* Move info (integrated) */}
                <span
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-white/30 text-[10px] lg:text-xs"
                >
                  from move {data.moveNumberStart}
                </span>
              </div>
            </motion.div>

            {/* Tabs - Mobile Only */}
            {hasLegendMoves && (
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-10 md:mb-14 px-2 lg:hidden">
                <button
                  onClick={() => setActiveTab("legend-moves")}
                  className={cn(
                    "px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm tracking-wide border transition-colors",
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
                    "px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm tracking-wide border transition-colors",
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
                    "px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm tracking-wide border transition-colors",
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

            {/* Board */}
            <div className="mx-0 md:mx-8 mt-0 mb-3 md:mb-6 lg:mt-6 lg:mb-4 lg:mx-0">
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
                squareSize="md"
              />
            </div>

            {/* Navigation Controls */}
            <div className="flex flex-row items-center gap-2 md:gap-3 mt-10 md:mt-14 lg:mt-6 px-2 lg:px-0 justify-center">
              {/* Navigation Buttons */}
              <div className="flex items-center gap-1 md:gap-2 lg:gap-1">
                <button
                  onClick={goToFirst}
                  disabled={isAtStart}
                  className={cn(
                    "w-11 h-11 md:w-12 md:h-12 lg:w-9 lg:h-9 flex items-center justify-center border transition-colors",
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
                    className="text-white/70 md:scale-110 lg:scale-100"
                  >
                    <polyline points="11 17 6 12 11 7" />
                    <polyline points="18 17 13 12 18 7" />
                  </svg>
                </button>
                <button
                  onClick={goBack}
                  disabled={isAtStart}
                  className={cn(
                    "w-11 h-11 md:w-12 md:h-12 lg:w-9 lg:h-9 flex items-center justify-center border transition-colors",
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
                    className="text-white/70 md:scale-110 lg:scale-100"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={goForward}
                  disabled={isAtEnd}
                  className={cn(
                    "w-11 h-11 md:w-12 md:h-12 lg:w-9 lg:h-9 flex items-center justify-center border transition-colors",
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
                    className="text-white/70 md:scale-110 lg:scale-100"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  onClick={goToLast}
                  disabled={isAtEnd}
                  className={cn(
                    "w-11 h-11 md:w-12 md:h-12 lg:w-9 lg:h-9 flex items-center justify-center border transition-colors",
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
                    className="text-white/70 md:scale-110 lg:scale-100"
                  >
                    <polyline points="13 17 18 12 13 7" />
                    <polyline points="6 17 11 12 6 7" />
                  </svg>
                </button>
              </div>

              {/* Separator */}
              <div className="w-px h-8 md:h-10 lg:h-6 bg-white/10 mx-1 md:mx-2" />

              {/* Action Buttons */}
              <div className="flex items-center gap-1 md:gap-2 lg:gap-1">
                <button
                  onClick={toggleFlip}
                  className="h-10 md:h-12 lg:h-9 px-4 md:px-6 lg:px-3 text-sm md:text-base lg:text-xs border border-white/20 text-white/60 bg-white/5 hover:bg-white/15 hover:text-white transition-colors"
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  Flip
                </button>
                <button
                  onClick={() => router.push("/play")}
                  className="h-10 md:h-12 lg:h-9 px-4 md:px-6 lg:px-3 text-sm md:text-base lg:text-xs border border-white/20 text-white/60 bg-white/5 hover:bg-white/15 hover:text-white transition-colors"
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  Back
                </button>
              </div>
            </div>

            {/* Legend Key (Mobile) */}
            <div className="lg:hidden mt-4 md:mt-8 px-4 md:px-8">
              <div className="flex items-center justify-center gap-6 md:gap-10 py-3 md:py-5 border-t border-white/10">
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
          <div className="lg:col-span-3 order-3 hidden lg:flex lg:flex-col max-h-[70vh] overflow-y-auto space-y-4">
            {/* View Mode Tabs - Desktop */}
            {hasLegendMoves && (
              <div className="border border-white/10 p-4">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3"
                >
                  View Mode
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setActiveTab("legend-moves")}
                    className={cn(
                      "w-full px-4 py-2.5 text-xs tracking-wide border transition-colors text-left",
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
                      "w-full px-4 py-2.5 text-xs tracking-wide border transition-colors text-left",
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
                      "w-full px-4 py-2.5 text-xs tracking-wide border transition-colors text-left",
                      activeTab === "comparison"
                        ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                        : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                    )}
                    style={{ fontFamily: "'Geist', sans-serif" }}
                  >
                    Comparison
                  </button>
                </div>
              </div>
            )}

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

          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalysisPage;
