"use client";

import { useState, useCallback, useEffect, useRef, use } from "react";
import { Chess, Square, Move, Color } from "chess.js";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import ChessBoard from "../../components/ChessBoard";
import { VictoryConfetti } from "../../components/GameEndEffects";
import PromotionPopup from "../../components/PromotionPopup";
import { useRequireAuth } from "@/lib/hooks";
import { CompleteUserObject } from "@/lib/types";
import { useBotMove, Difficulty } from "@/lib/hooks/useBotMove";
import { useChessSound } from "@/lib/hooks/useChessSound";
import { cn, formatTime } from "@/lib/utils";
import { motion } from "motion/react";
import type {
  Player,
  GameStartedPayload,
  MoveMadePayload,
  MoveErrorPayload,
  ClockUpdatePayload,
  GameOverPayload,
  ErrorPayload,
} from "@/lib/types/socket-events";

const GamePage = ({ params }: { params: Promise<{ gameId: string }> }) => {
  const router = useRouter();
  const { isLoaded, userObject }: { isLoaded: boolean; userObject: CompleteUserObject | null } = useRequireAuth();
  const userReferenceId = userObject?.user?.referenceId;
  const { gameId } = use(params);

  const [game, setGame] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [currentTurn, setCurrentTurn] = useState<"w" | "b">("w");

  const socketRef = useRef<Socket | null>(null);
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

  const onThinkingStart = useCallback(() => setIsBotThinking(true), []);
  const onThinkingEnd = useCallback(() => setIsBotThinking(false), []);

  const { computeBotMove } = useBotMove({
    difficulty: aiDifficulty,
    onThinkingStart,
    onThinkingEnd,
  });

  const { playSound, playSoundForMove, checkTenSecondWarning, toggleMute, isMuted } = useChessSound();

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

      socketRef.current.emit("make_move", {
        gameReferenceId: gameId,
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: piece,
      });

      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    },
    [pendingPromotion, gameId]
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (gameOver || !gameStarted) return;
      if (myColor !== currentTurn) return;

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

      if (socketRef.current) {
        socketRef.current.emit("make_move", {
          gameReferenceId: gameId,
          from,
          to,
          promotion: "q",
        });
      }

      setSelectedSquare(null);
      setLegalMoves([]);
    },
    [selectedSquare, game, currentTurn, myColor, gameId, gameStarted, gameOver, getLegalMovesForSquare, isPromotionMove]
  );

  useEffect(() => {
    if (!isLoaded || !gameId || !userReferenceId) return;
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

    socketRef.current.on("game_started", (payload: GameStartedPayload) => {
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

      if (payload.fen) {
        const newGame = new Chess(payload.fen);
        setGame(newGame);
        setCurrentTurn(newGame.turn());
      }

      // Play game start sound
      playSound('game-start');
    });

    socketRef.current.on("move_made", (payload: MoveMadePayload) => {
      const newGame = new Chess(payload.fen);
      setGame(newGame);
      setCurrentTurn(payload.turn);
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);

      // Update move history by adding the new move
      setMoveHistory(prev => [...prev, {
        from: payload.from,
        to: payload.to,
        san: payload.san,
        promotion: payload.promotion,
      } as Move]);

      // Play sound for the move using the SAN from payload
      if (!newGame.isGameOver()) {
        playSoundForMove(payload.san);
      }
    });

    socketRef.current.on("move_error", (payload: MoveErrorPayload) => {
      playSound('illegal');
      if (!isAIGameRef.current) {
        alert(payload.message || "Invalid move");
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
        : payload.winner === myColor
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
  }, [isLoaded, gameId, myColor, userReferenceId]);

  // Clear pending promotion if game ends
  useEffect(() => {
    if (gameOver && pendingPromotion) {
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [gameOver, pendingPromotion]);

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
        console.error("Error computing bot move:", error);
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40 text-sm tracking-wide">
            Loading...
          </p>
        </motion.div>
      </div>
    );
  }

  // Determine if this is a victory for confetti
  const isVictory = gameOver && gameResult?.includes("Victory");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Victory confetti effect */}
      <VictoryConfetti isActive={isVictory || false} />

      {/* Promotion popup */}
      <PromotionPopup
        isOpen={pendingPromotion !== null}
        color={myColor || "w"}
        onSelect={handlePromotionSelect}
      />

      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-8">
        {!gameStarted ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6" />
              <h1
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="text-3xl text-white mb-2"
              >
                Waiting for opponent
              </h1>
              <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40">
                The game will start momentarily
              </p>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8"
          >
            {/* Left - Game Info */}
            <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
              {/* Sound Toggle - Mobile Only */}
              <div className="lg:hidden border border-white/10 p-3 flex items-center justify-between">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.3em] uppercase text-white/40"
                >
                  Sound
                </p>
                <button
                  onClick={toggleMute}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 border transition-colors text-sm",
                    isMuted
                      ? "border-white/10 text-white/40"
                      : "border-white/20 text-white"
                  )}
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  <span>{isMuted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}</span>
                </button>
              </div>

              {/* Current Turn */}
              <div className="border border-white/10 p-5">
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

              {/* Move History */}
              <div className="border border-white/10 p-5">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3"
                >
                  Moves
                </p>
                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
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
            <div className="lg:col-span-6 order-1 lg:order-2">
              {/* Opponent Clock & Info */}
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center",
                    myColor === "w" ? "bg-black border border-white/30" : "bg-white"
                  )}>
                    <span className={myColor === "w" ? "text-white" : "text-black"}>
                      {myColor === "w" ? "♚" : "♔"}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white font-medium text-sm">
                      {myColor === "w" ? blackPlayer?.name || "Black" : whitePlayer?.name || "White"}
                    </p>
                    {isAIGame && botColor && myColor !== botColor && (
                      <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40 text-xs">Bot</p>
                    )}
                  </div>
                </div>
                <div className={cn(
                  "px-4 py-2 font-mono text-xl",
                  currentTurn !== myColor ? "bg-white text-black" : "bg-white/10 text-white"
                )}>
                  {formatTime(myColor === "w" ? blackTime : whiteTime)}
                </div>
              </div>

              {/* Board - m-8 accounts for the -inset-8 outer frame */}
              <div className="m-8">
                <ChessBoard
                  board={game.board()}
                  selectedSquare={selectedSquare}
                  legalMoves={legalMoves}
                  onSquareClick={handleSquareClick}
                  playerColor={myColor}
                  showCoordinates={true}
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

              {/* Player Clock & Info */}
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center",
                    myColor === "w" ? "bg-white" : "bg-black border border-white/30"
                  )}>
                    <span className={myColor === "w" ? "text-black" : "text-white"}>
                      {myColor === "w" ? "♔" : "♚"}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white font-medium text-sm">
                      {myColor === "w" ? whitePlayer?.name || "White" : blackPlayer?.name || "Black"}
                    </p>
                    <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40 text-xs">You</p>
                  </div>
                </div>
                <div className={cn(
                  "px-4 py-2 font-mono text-xl",
                  currentTurn === myColor ? "bg-white text-black" : "bg-white/10 text-white"
                )}>
                  {formatTime(myColor === "w" ? whiteTime : blackTime)}
                </div>
              </div>
            </div>

            {/* Right - Controls and info */}
            <div className="lg:col-span-3 order-3 hidden lg:block space-y-4">
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
