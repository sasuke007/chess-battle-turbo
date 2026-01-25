"use client";

import { useState, useCallback, useEffect, useRef, use } from "react";
import { Chess, Square, Move, Color } from "chess.js";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import ChessBoard from "../../components/ChessBoard";
import { useRequireAuth } from "@/lib/hooks";
import { CompleteUserObject } from "@/lib/types";
import { useBotMove, Difficulty } from "@/lib/hooks/useBotMove";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

// Load fonts
const fontLink = typeof document !== 'undefined' ? (() => {
  const existing = document.querySelector('link[href*="Instrument+Serif"]');
  if (!existing) {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  return true;
})() : null;

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
  const [gameStarted, setGameStarted] = useState(false);
  const [whiteTime, setWhiteTime] = useState(300);
  const [blackTime, setBlackTime] = useState(300);
  const [whitePlayer, setWhitePlayer] = useState<any>(null);
  const [blackPlayer, setBlackPlayer] = useState<any>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);

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

  const getLegalMovesForSquare = useCallback(
    (square: Square): Square[] => {
      const moves = game.moves({ square, verbose: true });
      return moves.map((move) => move.to);
    },
    [game]
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
    [selectedSquare, game, currentTurn, myColor, gameId, gameStarted, gameOver, getLegalMovesForSquare]
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

    socketRef.current.on("game_started", (payload: any) => {
      setGameStarted(true);
      setMyColor(payload.yourColor);
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
    });

    socketRef.current.on("move_made", (payload: any) => {
      const newGame = new Chess(payload.fen);
      setGame(newGame);
      setCurrentTurn(payload.turn);
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);
      const moves = newGame.history({ verbose: true });
      setMoveHistory(moves);
    });

    socketRef.current.on("move_error", (payload: any) => {
      if (!isAIGameRef.current) {
        alert(payload.message || "Invalid move");
      }
    });

    socketRef.current.on("clock_update", (payload: any) => {
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);
    });

    socketRef.current.on("game_over", (payload: any) => {
      setGameOver(true);
      const resultText = payload.result === "DRAW"
        ? "Draw"
        : payload.winner === myColor
        ? "Victory"
        : "Defeat";
      setGameResult(`${resultText} — ${payload.method}`);
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);
    });

    socketRef.current.on("opponent_disconnected", () => {
      alert("Opponent disconnected. They have 30 seconds to reconnect.");
    });

    socketRef.current.on("opponent_reconnected", () => {
      alert("Opponent reconnected!");
    });

    socketRef.current.on("error", (payload: any) => {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-8">
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
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left - Game Info */}
            <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
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

              {/* Board with frame */}
              <div className="relative">
                <div className="absolute -inset-3 border border-white/10" />
                <div className="relative border border-white/20">
                  <ChessBoard
                    board={game.board()}
                    selectedSquare={selectedSquare}
                    legalMoves={legalMoves}
                    onSquareClick={handleSquareClick}
                    playerColor={myColor}
                  />
                </div>
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

            {/* Right - Empty or additional info */}
            <div className="lg:col-span-3 order-3 hidden lg:block">
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
