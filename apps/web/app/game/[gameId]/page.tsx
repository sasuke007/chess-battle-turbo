"use client";

import { useState, useCallback, useEffect, useRef, use, useMemo } from "react";
import { Chess, Square, Move, Color } from "chess.js";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import ChessBoard from "../../components/ChessBoard";
import { VictoryConfetti, GameEndOverlay } from "../../components/GameEndEffects";
import PromotionPopup from "../../components/PromotionPopup";
import MoveNavigation from "../../components/MoveNavigation";
import { useRequireAuth, UseRequireAuthReturn } from "@/lib/hooks";
import { useBotMove, Difficulty } from "@/lib/hooks/useBotMove";
import { useChessSound } from "@/lib/hooks/useChessSound";
import { cn } from "@/lib/utils";
import { computePositionAtMove, getLastMoveForDisplay } from "@/lib/utils/chess-navigation";
import { motion } from "motion/react";
import { PlayerInfoCard } from "./PlayerInfoCard";
import { GameActionButtons } from "./GameActionButtons";
import { AnalysisPhaseBannerMobile, AnalysisPhaseBannerDesktop } from "./AnalysisPhaseBanner";
import type {
  Player,
  GameStartedPayload,
  MoveMadePayload,
  MoveErrorPayload,
  ClockUpdatePayload,
  GameOverPayload,
  ErrorPayload,
  AnalysisPhaseStartedPayload,
} from "@/lib/types/socket-events";

const DEFAULT_STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Static background grid style — never changes
const backgroundGridStyle = {
  backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
  backgroundSize: '60px 60px',
} as const;

const GamePage = ({ params }: { params: Promise<{ gameId: string }> }) => {
  const router = useRouter();
  const { isReady, userObject }: UseRequireAuthReturn = useRequireAuth();
  const userReferenceId = userObject?.user?.referenceId;
  const { gameId } = use(params);

  const [game, setGame] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [currentTurn, setCurrentTurn] = useState<"w" | "b">("w");

  const socketRef = useRef<Socket | null>(null);
  const pendingOptimisticMoveRef = useRef(false);
  const [myColor, setMyColor] = useState<Color | null>(null);
  const myColorRef = useRef<Color | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [whiteTime, setWhiteTime] = useState(300);
  const [blackTime, setBlackTime] = useState(300);
  const [whitePlayer, setWhitePlayer] = useState<Player | null>(null);
  const [blackPlayer, setBlackPlayer] = useState<Player | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  const [isAIGame, setIsAIGame] = useState(false);
  const isAIGameRef = useRef(false);
  const [aiDifficulty, setAIDifficulty] = useState<Difficulty>("medium");
  const [botColor, setBotColor] = useState<Color | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const botMoveInProgressRef = useRef(false);
  const [positionInfo, setPositionInfo] = useState<{
    whitePlayerName: string | null;
    blackPlayerName: string | null;
    tournamentName?: string | null;
    whitePlayerImageUrl?: string | null;
    blackPlayerImageUrl?: string | null;
    openingName?: string | null;
    openingEco?: string | null;
  } | null>(null);

  // Move navigation state
  const [viewingMoveIndex, setViewingMoveIndex] = useState<number | null>(null);
  const [startingFen, setStartingFen] = useState<string>(DEFAULT_STARTING_FEN);

  // Game actions state
  const [pendingDrawOffer, setPendingDrawOffer] = useState(false);
  const [drawOffered, setDrawOffered] = useState(false);
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  // Analysis phase state
  const [isAnalysisPhase, setIsAnalysisPhase] = useState(false);
  const [analysisTimeRemaining, setAnalysisTimeRemaining] = useState(0);
  const [totalAnalysisTime, setTotalAnalysisTime] = useState(0);

  // Game end overlay state
  const [showGameEndOverlay, setShowGameEndOverlay] = useState(false);

  const onThinkingStart = useCallback(() => setIsBotThinking(true), []);
  const onThinkingEnd = useCallback(() => setIsBotThinking(false), []);

  const { computeBotMove } = useBotMove({
    difficulty: aiDifficulty,
    onThinkingStart,
    onThinkingEnd,
  });

  const { playSound, playSoundForMove, checkTenSecondWarning, toggleMute, isMuted } = useChessSound();

  // Computed display position for move navigation
  const displayPosition = useMemo(() => {
    const historyPosition = computePositionAtMove(startingFen, moveHistory, viewingMoveIndex);
    return historyPosition || game;
  }, [viewingMoveIndex, startingFen, moveHistory, game]);

  // Computed last move for highlighting based on viewing index
  const lastMoveForDisplay = useMemo(() => {
    return getLastMoveForDisplay(moveHistory, viewingMoveIndex);
  }, [moveHistory, viewingMoveIndex]);

  // Whether we're viewing history (not live)
  const isViewingHistory = viewingMoveIndex !== null;

  const getLegalMovesForSquare = useCallback(
    (square: Square): Square[] => {
      const moves = game.moves({ square, verbose: true });
      return moves.map((move) => move.to);
    },
    [game]
  );

  const isPromotionMove = useCallback(
    (from: Square, to: Square): boolean => {
      const moves = game.moves({ square: from, verbose: true });
      const targetMove = moves.find((m) => m.to === to);
      return targetMove?.isPromotion() ?? false;
    },
    [game]
  );

  const handlePromotionSelect = useCallback(
    (piece: "q" | "r" | "b" | "n") => {
      if (!pendingPromotion || !socketRef.current) return;
      const { from, to } = pendingPromotion;

      // Apply move locally first for instant feedback
      const tempGame = new Chess(game.fen());
      try {
        const move = tempGame.move({ from, to, promotion: piece });
        setGame(tempGame);
        setCurrentTurn(tempGame.turn());
        setMoveHistory(prev => [...prev, move]);
        setViewingMoveIndex(null);
        if (!tempGame.isGameOver()) {
          playSoundForMove(move.san);
        }
      } catch { /* Shouldn't happen — we already validated legal moves */ }

      // Send to server (authoritative)
      pendingOptimisticMoveRef.current = true;
      socketRef.current.emit("make_move", {
        gameReferenceId: gameId,
        from,
        to,
        promotion: piece,
      });

      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    },
    [pendingPromotion, gameId, game, playSoundForMove]
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      // Block moves during analysis phase
      if (isAnalysisPhase) return;

      if (gameOver || !gameStarted) return;
      if (myColor !== currentTurn) return;

      // If viewing history and trying to interact, sync to live first
      if (viewingMoveIndex !== null) {
        setViewingMoveIndex(null);
        // Don't process the click - just return to live
        return;
      }

      if (!selectedSquare) {
        const piece = game.get(square);
        if (piece && piece.color === myColor) {
          setSelectedSquare(square);
          setLegalMoves(getLegalMovesForSquare(square));
        }
        return;
      }

      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const from = selectedSquare;
      const to = square;

      // Check if this is a promotion move
      if (isPromotionMove(from, to)) {
        setPendingPromotion({ from, to });
        return;
      }

      // Apply move locally first for instant feedback
      const tempGame = new Chess(game.fen());
      try {
        const move = tempGame.move({ from, to, promotion: "q" });
        setGame(tempGame);
        setCurrentTurn(tempGame.turn());
        setMoveHistory(prev => [...prev, move]);
        setViewingMoveIndex(null);
        if (!tempGame.isGameOver()) {
          playSoundForMove(move.san);
        }
      } catch { /* Shouldn't happen — we already validated legal moves */ }

      // Send to server (authoritative)
      pendingOptimisticMoveRef.current = true;
      socketRef.current?.emit("make_move", {
        gameReferenceId: gameId,
        from,
        to,
        promotion: "q",
      });

      setSelectedSquare(null);
      setLegalMoves([]);
    },
    [selectedSquare, game, currentTurn, myColor, gameId, gameStarted, gameOver, getLegalMovesForSquare, isPromotionMove, viewingMoveIndex, isAnalysisPhase, playSoundForMove]
  );

  // Game action handlers
  const handleOfferDraw = useCallback(() => {
    if (!socketRef.current || gameOver) return;
    socketRef.current.emit("offer_draw", { gameReferenceId: gameId });
    setDrawOffered(true);
  }, [gameId, gameOver]);

  // Auto-decline draw for bot games (bots don't accept draws)
  useEffect(() => {
    if (isAIGame && drawOffered) {
      const timer = setTimeout(() => {
        setDrawOffered(false);
        playSound('notify');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAIGame, drawOffered, playSound]);

  const handleAcceptDraw = useCallback(() => {
    if (!socketRef.current || gameOver) return;
    socketRef.current.emit("accept_draw", { gameReferenceId: gameId });
    setPendingDrawOffer(false);
  }, [gameId, gameOver]);

  const handleDeclineDraw = useCallback(() => {
    if (!socketRef.current || gameOver) return;
    socketRef.current.emit("decline_draw", { gameReferenceId: gameId });
    setPendingDrawOffer(false);
  }, [gameId, gameOver]);

  const handleResign = useCallback(() => {
    setShowResignConfirm(true);
  }, []);

  const confirmResign = useCallback(() => {
    if (!socketRef.current || gameOver) return;
    socketRef.current.emit("resign", { gameReferenceId: gameId });
    setShowResignConfirm(false);
  }, [gameId, gameOver]);

  // Move navigation handler
  const handleNavigate = useCallback((index: number | null) => {
    setViewingMoveIndex(index);
    // Clear selection when navigating
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  useEffect(() => {
    if (!isReady || !gameId || !userReferenceId) return;
    if (socketRef.current?.connected) return;

    const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3002";

    socketRef.current = io(WEBSOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current.on("connect", () => {
      socketRef.current!.emit("join_game", {
        gameReferenceId: gameId,
        userReferenceId,
      });
    });

    // Analysis phase handlers
    socketRef.current.on("analysis_phase_started", (payload: AnalysisPhaseStartedPayload) => {
      setIsAnalysisPhase(true);
      setAnalysisTimeRemaining(payload.analysisTimeSeconds);
      setTotalAnalysisTime(payload.analysisTimeSeconds);

      setMyColor(payload.yourColor);
      myColorRef.current = payload.yourColor;
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);
      setWhitePlayer(payload.whitePlayer);
      setBlackPlayer(payload.blackPlayer);

      if (payload.fen) {
        const newGame = new Chess(payload.fen);
        setGame(newGame);
        setCurrentTurn(newGame.turn());
        setStartingFen(payload.fen);
      }

      if (payload.positionInfo) {
        setPositionInfo(payload.positionInfo);
      }

      if (payload.isAIGame) {
        setIsAIGame(true);
        isAIGameRef.current = true;
        setAIDifficulty(payload.difficulty || "medium");
        setBotColor(payload.yourColor === "w" ? "b" : "w");
      }

      playSound('notify');
    });

    socketRef.current.on("game_started", (payload: GameStartedPayload) => {
      // End analysis phase when game actually starts
      setIsAnalysisPhase(false);
      setAnalysisTimeRemaining(0);
      setGameStarted(true);
      setMyColor(payload.yourColor);
      myColorRef.current = payload.yourColor;
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);
      setWhitePlayer(payload.whitePlayer);
      setBlackPlayer(payload.blackPlayer);

      if (payload.isAIGame) {
        setIsAIGame(true);
        isAIGameRef.current = true;
        setAIDifficulty(payload.difficulty || "medium");
        setBotColor(payload.yourColor === "w" ? "b" : "w");
      }

      if (payload.positionInfo) {
        setPositionInfo(payload.positionInfo);
      }

      if (payload.fen) {
        const newGame = new Chess(payload.fen);
        setGame(newGame);
        setCurrentTurn(newGame.turn());
        // Save starting FEN for move navigation
        setStartingFen(payload.fen);
      }

      // Play game start sound
      playSound('game-start');
    });

    socketRef.current.on("move_made", (payload: MoveMadePayload) => {
      const wasOurMove = pendingOptimisticMoveRef.current;
      pendingOptimisticMoveRef.current = false;

      // Always sync to server truth
      const newGame = new Chess(payload.fen);
      setGame(newGame);
      setCurrentTurn(payload.turn);
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);
      setViewingMoveIndex(null);

      if (wasOurMove) {
        // Board already updated optimistically — replace last history entry with server-confirmed version
        setMoveHistory(prev => [
          ...prev.slice(0, -1),
          { from: payload.from, to: payload.to, san: payload.san, promotion: payload.promotion } as Move,
        ]);
      } else {
        // Opponent's move — add to history and play sound
        setMoveHistory(prev => [...prev, {
          from: payload.from, to: payload.to, san: payload.san, promotion: payload.promotion,
        } as Move]);
        if (!newGame.isGameOver()) {
          playSoundForMove(payload.san);
        }
      }
    });

    socketRef.current.on("move_error", (payload: MoveErrorPayload) => {
      const hadPendingMove = pendingOptimisticMoveRef.current;

      // If server sent back the correct board, rollback the optimistic move
      if (payload.fen && hadPendingMove) {
        const correctedGame = new Chess(payload.fen);
        setGame(correctedGame);
        setCurrentTurn(correctedGame.turn());
        // Remove the optimistic move from history
        setMoveHistory(prev => prev.slice(0, -1));
      }
      pendingOptimisticMoveRef.current = false;

      // Only play error sound / show alert when the player actually had a pending move
      if (hadPendingMove) {
        playSound('illegal');
        if (!isAIGameRef.current) {
          alert(payload.message || "Invalid move");
        }
      }
    });

    socketRef.current.on("clock_update", (payload: ClockUpdatePayload) => {
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);

      // Check for ten second warning on my clock
      const myTime = myColorRef.current === 'w' ? payload.whiteTime : payload.blackTime;
      if (myColorRef.current) {
        checkTenSecondWarning(myTime);
      }
    });

    socketRef.current.on("game_over", (payload: GameOverPayload) => {
      setGameOver(true);
      const resultText = payload.result === "DRAW"
        ? "Draw"
        : payload.winner === myColorRef.current
        ? "Victory"
        : "Defeat";
      setGameResult(`${resultText} — ${payload.method}`);
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);

      // Play game end sound
      playSound('game-end');
    });

    socketRef.current.on("opponent_disconnected", () => {
      playSound('notify');
      alert("Opponent disconnected. They have 30 seconds to reconnect.");
    });

    socketRef.current.on("opponent_reconnected", () => {
      playSound('notify');
      alert("Opponent reconnected!");
    });

    socketRef.current.on("draw_offered", () => {
      setPendingDrawOffer(true);
      playSound('notify');
    });

    socketRef.current.on("draw_declined", () => {
      setDrawOffered(false);
      playSound('notify');
    });

    socketRef.current.on("error", (payload: ErrorPayload) => {
      if (payload.message && payload.message.includes("not part of")) {
        alert("You are not part of this game. Redirecting...");
        router.push(`/join/${gameId}`);
        return;
      }
      alert(payload.message || "An error occurred");
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isReady, gameId, userReferenceId]);

  // Clear pending promotion if game ends
  useEffect(() => {
    if (gameOver && pendingPromotion) {
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [gameOver, pendingPromotion]);

  // Show game end overlay when game is over (only if position info exists for analysis)
  // Delayed by 5 seconds to let players see the final position
  useEffect(() => {
    if (gameOver && positionInfo) {
      const timer = setTimeout(() => {
        setShowGameEndOverlay(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameOver, positionInfo]);

  useEffect(() => {
    if (!isAIGame || !gameStarted || gameOver || !botColor || currentTurn !== botColor) return;
    if (botMoveInProgressRef.current) return;

    botMoveInProgressRef.current = true;

    const currentFen = game.fen();
    const legalMoves = game.moves({ verbose: true });

    if (legalMoves.length === 0) {
      botMoveInProgressRef.current = false;
      return;
    }

    const legalMovesUCI = legalMoves.map((m) => `${m.from}${m.to}${m.promotion || ""}`);

    const makeBotMove = async () => {
      try {
        const botMoveUCI = await computeBotMove(currentFen, legalMovesUCI);
        const from = botMoveUCI.slice(0, 2) as Square;
        const to = botMoveUCI.slice(2, 4) as Square;
        const promotion = botMoveUCI.length > 4 ? botMoveUCI[4] as "q" | "r" | "b" | "n" : undefined;

        if (socketRef.current) {
          socketRef.current.emit("make_move", {
            gameReferenceId: gameId,
            from,
            to,
            promotion: promotion || "q",
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error computing bot move:", error);
        }
        if (legalMoves.length > 0 && socketRef.current) {
          const fallbackMove = legalMoves[0]!;
          socketRef.current.emit("make_move", {
            gameReferenceId: gameId,
            from: fallbackMove.from,
            to: fallbackMove.to,
            promotion: fallbackMove.promotion || "q",
          });
        }
      } finally {
        botMoveInProgressRef.current = false;
      }
    };

    makeBotMove();
  }, [isAIGame, gameStarted, gameOver, botColor, currentTurn, computeBotMove, gameId, game]);

  // Client-side analysis countdown timer
  // Runs locally and emits analysis_complete when countdown finishes
  // Using a ref to track if we've already sent the ACK to avoid duplicates
  const analysisAckSentRef = useRef(false);

  useEffect(() => {
    // Reset ACK sent flag when entering analysis phase
    if (isAnalysisPhase && analysisTimeRemaining > 0) {
      analysisAckSentRef.current = false;
    }
  }, [isAnalysisPhase, totalAnalysisTime]);

  useEffect(() => {
    if (!isAnalysisPhase || analysisTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setAnalysisTimeRemaining(prev => {
        if (prev <= 1) {
          // Send ACK to server when countdown finishes (only once)
          if (!analysisAckSentRef.current && socketRef.current && userReferenceId) {
            analysisAckSentRef.current = true;
            socketRef.current.emit("analysis_complete", {
              gameReferenceId: gameId,
              userReferenceId,
            });
          }
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnalysisPhase, gameId, userReferenceId]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border border-white/20 border-t-white/60 rounded-full animate-spin mb-6" />
          <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40 text-xs tracking-[0.2em] uppercase">
            Loading
          </p>
        </div>
      </div>
    );
  }

  // Determine if this is a victory for confetti
  const isVictory = gameOver && gameResult?.includes("Victory");

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden lg:overflow-auto">
      {/* Victory confetti effect */}
      <VictoryConfetti isActive={isVictory || false} />

      {/* Game End Overlay with Analysis Button */}
      <GameEndOverlay
        isActive={showGameEndOverlay}
        result={
          gameResult?.includes("Victory")
            ? "victory"
            : gameResult?.includes("Draw")
            ? "draw"
            : "defeat"
        }
        onAnalysisClick={() => {
          setShowGameEndOverlay(false);
          router.replace(`/analysis/${gameId}`);
        }}
        onBackClick={() => {
          setShowGameEndOverlay(false);
          router.push("/play");
        }}
        onDismiss={() => setShowGameEndOverlay(false)}
        analysisLabel={positionInfo?.openingName ? "Review" : "Compare"}
      />

      {/* Promotion popup */}
      <PromotionPopup
        isOpen={pendingPromotion !== null}
        color={myColor || "w"}
        onSelect={handlePromotionSelect}
      />

      {/* Resign Confirmation Modal */}
      {showResignConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-white/20 bg-black p-6 max-w-sm w-full"
          >
            <p
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-white text-xl mb-2"
            >
              Are you sure you want to resign?
            </p>
            <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40 text-sm mb-6">
              This will count as a loss.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmResign}
                className="flex-1 py-2 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors"
                style={{ fontFamily: "'Geist', sans-serif" }}
              >
                Yes, Resign
              </button>
              <button
                onClick={() => setShowResignConfirm(false)}
                className="flex-1 py-2 border border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors"
                style={{ fontFamily: "'Geist', sans-serif" }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Analysis Phase Banner - Mobile only overlay */}
      <AnalysisPhaseBannerMobile
        isAnalysisPhase={isAnalysisPhase}
        analysisTimeRemaining={analysisTimeRemaining}
        totalAnalysisTime={totalAnalysisTime}
        currentTurn={currentTurn}
      />

      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={backgroundGridStyle}
      />

      <div className="relative max-w-7xl mx-auto px-2 lg:px-4 pb-0 lg:pb-4 pt-4 lg:py-4 h-[100dvh] lg:min-h-screen flex flex-col lg:flex lg:flex-col lg:justify-center">
        {!gameStarted && !isAnalysisPhase ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center">
              {/* Minimal chess piece spinner */}
              <div className="relative w-14 h-14 mb-6">
                {/* Spinning ring */}
                <div className="absolute inset-0 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                {/* Center piece */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl text-white/50 animate-pulse">♟</span>
                </div>
              </div>

              {/* Text */}
              <p
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-white/40 text-xs tracking-[0.2em] uppercase"
              >
                Joining game
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 lg:flex-none flex flex-col lg:grid lg:grid-cols-12 gap-0 lg:gap-8"
          >
            {/* Left - Game Info (hidden on mobile) */}
            <div className="lg:col-span-3 space-y-4 order-2 lg:order-1 hidden lg:flex lg:flex-col lg:max-h-[calc(100vh-2rem)] lg:overflow-hidden">
              {/* Analysis Phase - Desktop sidebar version */}
              <AnalysisPhaseBannerDesktop
                isAnalysisPhase={isAnalysisPhase}
                analysisTimeRemaining={analysisTimeRemaining}
                totalAnalysisTime={totalAnalysisTime}
                currentTurn={currentTurn}
              />

              {/* Current Turn */}
              <div className="border border-white/10 p-5 shrink-0">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3"
                >
                  Current Turn
                </p>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6",
                    currentTurn === "w" ? "bg-white" : "bg-black border border-white/30"
                  )} />
                  <span style={{ fontFamily: "'Geist', sans-serif" }} className="text-white font-medium">
                    {currentTurn === "w" ? "White" : "Black"}
                    {currentTurn === myColor && " (You)"}
                    {isAIGame && currentTurn === botColor && " (Bot)"}
                  </span>
                </div>
                {isAIGame && isBotThinking && (
                  <div className="mt-3 flex items-center gap-2 text-white/50">
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    <span style={{ fontFamily: "'Geist', sans-serif" }} className="text-xs">
                      Bot thinking...
                    </span>
                  </div>
                )}
              </div>

              {/* Game Status */}
              {(gameOver || game.isCheck()) && (
                <div className={cn(
                  "border p-5",
                  gameOver ? "border-white bg-white text-black" : "border-white/10"
                )}>
                  {gameOver ? (
                    <div className="text-center">
                      <p
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                        className="text-2xl mb-1"
                      >
                        {gameResult?.split(" — ")[0]}
                      </p>
                      <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-sm opacity-60">
                        {gameResult?.split(" — ")[1]}
                      </p>
                    </div>
                  ) : game.isCheck() && (
                    <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white font-medium text-center">
                      Check!
                    </p>
                  )}
                </div>
              )}

              {/* Post-Game Actions */}
              {gameOver && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="border border-white/10 p-5 space-y-3"
                >
                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-[10px] tracking-[0.3em] uppercase text-white/40"
                  >
                    What&apos;s Next?
                  </p>
                  {positionInfo && (
                    <button
                      onClick={() => router.replace(`/analysis/${gameId}`)}
                      className="w-full py-2.5 bg-white text-black hover:bg-white/90 transition-colors"
                      style={{ fontFamily: "'Geist', sans-serif" }}
                    >
                      {positionInfo.openingName ? "Review" : "Compare"}
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/play")}
                    className="w-full py-2.5 border border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors"
                    style={{ fontFamily: "'Geist', sans-serif" }}
                  >
                    Back
                  </button>
                </motion.div>
              )}

              {/* Move History */}
              <div className="border border-white/10 p-5 min-h-0 flex flex-col max-h-48">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3 shrink-0"
                >
                  Moves
                </p>
                <div className="overflow-y-auto custom-scrollbar space-y-1 min-h-0">
                  {moveHistory.length === 0 ? (
                    <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/30 text-sm">
                      No moves yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {moveHistory.map((move, index) => (
                        <div
                          key={index}
                          className={cn(
                            "px-2 py-1 text-sm",
                            index % 2 === 0 ? "bg-white/5" : ""
                          )}
                          style={{ fontFamily: "'Geist', sans-serif" }}
                        >
                          {index % 2 === 0 && (
                            <span className="text-white/30 mr-2">{Math.floor(index / 2) + 1}.</span>
                          )}
                          <span className="text-white/80 font-mono">{move.san}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center - Chess Board */}
            <div className="lg:col-span-6 order-1 lg:order-2 flex-1 flex flex-col justify-center lg:block max-w-2xl mx-auto w-full">
              {/* Opening / Tournament Name Banner - compact */}
              {(positionInfo?.openingName || positionInfo?.tournamentName) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center gap-2 lg:gap-3 mb-1 px-2"
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  {positionInfo.openingName ? (
                    <div className="flex items-center gap-2">
                      {positionInfo.openingEco && (
                        <span
                          style={{ fontFamily: "'Geist', sans-serif" }}
                          className="text-[10px] tracking-wider text-white/50 bg-white/10 px-1.5 py-0.5 uppercase"
                        >
                          {positionInfo.openingEco}
                        </span>
                      )}
                      <p
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                        className="text-white/40 text-xs lg:text-sm italic tracking-wide"
                      >
                        {positionInfo.openingName}
                      </p>
                    </div>
                  ) : (
                    <p
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                      className="text-white/40 text-xs lg:text-sm italic tracking-wide"
                    >
                      {positionInfo.tournamentName}
                    </p>
                  )}
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </motion.div>
              )}

              {/* Opponent Clock & Info */}
              <PlayerInfoCard
                isOpponent={true}
                myColor={myColor}
                whitePlayer={whitePlayer}
                blackPlayer={blackPlayer}
                whiteTime={whiteTime}
                blackTime={blackTime}
                currentTurn={currentTurn}
                isAIGame={isAIGame}
                botColor={botColor}
                positionInfo={positionInfo}
              />

              {/* Incoming Draw Offer Banner - compact on mobile */}
              {pendingDrawOffer && !gameOver && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-500/20 border border-amber-500/40 p-2 lg:p-3 mx-2 mb-2 lg:mb-4"
                >
                  <div className="flex items-center justify-between gap-2 lg:gap-4">
                    <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white text-xs lg:text-sm">
                      Draw offer
                    </p>
                    <div className="flex gap-1 lg:gap-2">
                      <button
                        onClick={handleAcceptDraw}
                        className="px-2 lg:px-3 py-1 text-xs lg:text-sm bg-white text-black hover:bg-white/90 transition-colors"
                        style={{ fontFamily: "'Geist', sans-serif" }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={handleDeclineDraw}
                        className="px-2 lg:px-3 py-1 text-xs lg:text-sm border border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors"
                        style={{ fontFamily: "'Geist', sans-serif" }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Board - minimal margins on mobile, tighter on desktop */}
              <div className="mx-0 my-1 lg:my-2">
                <ChessBoard
                  board={displayPosition.board()}
                  selectedSquare={isViewingHistory ? null : selectedSquare}
                  legalMoves={isViewingHistory ? [] : legalMoves}
                  onSquareClick={handleSquareClick}
                  playerColor={myColor}
                  showCoordinates={true}
                  lastMove={lastMoveForDisplay}
                  gameEndState={
                    gameOver
                      ? gameResult?.includes("Victory")
                        ? ("victory" as const)
                        : gameResult?.includes("Draw")
                        ? ("draw" as const)
                        : ("defeat" as const)
                      : null
                  }
                />
              </div>

              {/* Move Navigation - mobile only, desktop version is in right sidebar */}
              <div className="flex items-center justify-center mt-2 px-2 lg:hidden">
                <MoveNavigation
                  totalMoves={moveHistory.length}
                  viewingMoveIndex={viewingMoveIndex}
                  onNavigate={handleNavigate}
                  onPlaySound={() => playSound('move')}
                  disabled={!gameStarted}
                  enableKeyboard={false}
                />
              </div>

              {/* Mobile Game Actions - below navigation */}
              {!gameOver && (
                <GameActionButtons
                  variant="mobile"
                  drawOffered={drawOffered}
                  onOfferDraw={handleOfferDraw}
                  onResign={handleResign}
                />
              )}

              {/* Mobile Post-Game Actions */}
              {gameOver && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="lg:hidden flex items-center justify-center gap-2 mt-2 px-2"
                >
                  {positionInfo && (
                    <button
                      onClick={() => router.replace(`/analysis/${gameId}`)}
                      className="h-10 px-5 text-sm bg-white text-black hover:bg-white/90 transition-colors"
                      style={{ fontFamily: "'Geist', sans-serif" }}
                    >
                      {positionInfo.openingName ? "Review" : "Compare"}
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/play")}
                    className="h-10 px-5 text-sm border border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors"
                    style={{ fontFamily: "'Geist', sans-serif" }}
                  >
                    Back
                  </button>
                </motion.div>
              )}

              {/* Player Clock & Info */}
              <PlayerInfoCard
                isOpponent={false}
                myColor={myColor}
                whitePlayer={whitePlayer}
                blackPlayer={blackPlayer}
                whiteTime={whiteTime}
                blackTime={blackTime}
                currentTurn={currentTurn}
                isAIGame={isAIGame}
                botColor={botColor}
                positionInfo={positionInfo}
              />
            </div>

            {/* Right - Controls and info */}
            <div className="lg:col-span-3 order-3 hidden lg:block space-y-4">
              {/* Move Navigation - Desktop */}
              <div className="border border-white/10 p-5">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3"
                >
                  Navigation
                </p>
                <MoveNavigation
                  totalMoves={moveHistory.length}
                  viewingMoveIndex={viewingMoveIndex}
                  onNavigate={handleNavigate}
                  onPlaySound={() => playSound('move')}
                  disabled={!gameStarted}
                />
              </div>

              {/* Sound Controls */}
              <div className="border border-white/10 p-5">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3"
                >
                  Sound
                </p>
                <button
                  onClick={toggleMute}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2 border transition-colors",
                    isMuted
                      ? "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                      : "border-white/20 text-white hover:border-white/40"
                  )}
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  <span className="text-lg">{isMuted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}</span>
                  <span className="text-sm">{isMuted ? "Unmute" : "Mute"}</span>
                </button>
              </div>

              {/* Game Actions - Desktop */}
              {!gameOver && (
                <GameActionButtons
                  variant="desktop"
                  drawOffered={drawOffered}
                  onOfferDraw={handleOfferDraw}
                  onResign={handleResign}
                />
              )}

              {/* Decorative element */}
              <div className="border border-white/5 p-6 text-center">
                <p
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="text-white/20 text-sm italic"
                >
                  "The beauty of a move lies not in its appearance but in the thought behind it."
                </p>
                <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/10 text-[10px] uppercase tracking-widest mt-2">
                  Aaron Nimzowitsch
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GamePage;
