"use client";

{/* when user makes a move, move should be visible in ui first and then backend calls should go it feels like a smooth transition*/}
import { useState, useCallback, useEffect, useRef, use } from "react";
import { Chess, Square, Move, Color } from "chess.js";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import ChessBoard from "../../components/ChessBoard";
import { useRequireAuth } from "@/lib/hooks";
import { CompleteUserObject } from "@/lib/types";
const GamePage = ({ params }: { params: Promise<{ gameId: string }> }) => {
  const router = useRouter();
  const { isLoaded, userObject }: { isLoaded: boolean; userObject: CompleteUserObject | null } = useRequireAuth();
  const userReferenceId = userObject?.user?.referenceId;
  // Unwrap params Promise
  const { gameId } = use(params);
  
  const [game, setGame] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [currentTurn, setCurrentTurn] = useState<"w" | "b">("w");
  
  // WebSocket and game state
  const socketRef = useRef<Socket | null>(null);
  const [myColor, setMyColor] = useState<Color | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [whiteTime, setWhiteTime] = useState(300);
  const [blackTime, setBlackTime] = useState(300);
  const [whitePlayer, setWhitePlayer] = useState<any>(null);
  const [blackPlayer, setBlackPlayer] = useState<any>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);


  // Get legal moves for a selected piece
  const getLegalMovesForSquare = useCallback(
    (square: Square): Square[] => {
      const moves = game.moves({ square, verbose: true });
      return moves.map((move) => move.to);
    },
    [game]
  );

  // Handle square click
  const handleSquareClick = useCallback(
    (square: Square) => {
      if (gameOver || !gameStarted) return;
      
      // Only allow moves if it's my turn
      if (myColor !== currentTurn) return;

      // If no square is selected, select the clicked square if it has a piece
      if (!selectedSquare) {
        const piece = game.get(square);
        
        // Only allow selecting pieces of the current player's color
        if (piece && piece.color === myColor) {
          setSelectedSquare(square);
          setLegalMoves(getLegalMovesForSquare(square));
        }
        return;
      }

      // If the same square is clicked again, deselect it
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Try to make a move
      const from = selectedSquare;
      const to = square;

      // Send move to server via WebSocket
      if (socketRef.current) {
        socketRef.current.emit("make_move", {
          gameReferenceId: gameId,
          from,
          to,
          promotion: "q", // Always promote to queen for simplicity
        });
      }

      // Clear selection
      setSelectedSquare(null);
      setLegalMoves([]);
    },
    [selectedSquare, game, currentTurn, myColor, gameId, gameStarted, gameOver, getLegalMovesForSquare]
  );

  // Setup WebSocket connection
  useEffect(() => {
    // Wait for auth to load and ensure we have both gameId and userReferenceId
    if (!isLoaded || !gameId || !userReferenceId) {
      console.log("Waiting for auth or game data...", { isLoaded, gameId, userReferenceId });
      return;
    }

    // Don't create a new socket if one already exists and is connected
    if (socketRef.current?.connected) {
      console.log("Socket already connected, reusing existing connection");
      return;
    }

    console.log("Initializing WebSocket connection with:", { gameId, userReferenceId });

    // Get WebSocket URL from environment variable or use default
    const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3002";

    // Initialize WebSocket with reconnection enabled (Socket.IO default)
    socketRef.current = io(WEBSOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server:", socketRef.current?.id);
      console.log("Attempting to join game with:", {
        gameReferenceId: gameId,
        userReferenceId,
        userObjectAvailable: !!userObject,
      });

      // Join/rejoin the game (server will handle reconnection logic)
      socketRef.current!.emit("join_game", {
        gameReferenceId: gameId,
        userReferenceId,
      });
    });

    socketRef.current.on("reconnect", (attemptNumber: number) => {
      console.log(`Reconnected to server after ${attemptNumber} attempts`);
      // Socket.IO will automatically trigger 'connect' event, which will rejoin the game
    });

    socketRef.current.on("game_started", (payload: any) => {
      console.log("Game started:", payload);
      setGameStarted(true);
      setMyColor(payload.yourColor);
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);
      setWhitePlayer(payload.whitePlayer);
      setBlackPlayer(payload.blackPlayer);

      // Load FEN if provided
      if (payload.fen) {
        const newGame = new Chess(payload.fen);
        setGame(newGame);
        setCurrentTurn(newGame.turn());
      }
    });

    socketRef.current.on("move_made", (payload: any) => {
      console.log("Move made:", payload);

      // Update game state
      const newGame = new Chess(payload.fen);
      setGame(newGame);
      setCurrentTurn(payload.turn);
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);

      // Add to move history
      const moves = newGame.history({ verbose: true });
      setMoveHistory(moves);
    });

    socketRef.current.on("move_error", (payload: any) => {
      console.error("Move error:", payload);
      alert(payload.message || "Invalid move");
    });

    socketRef.current.on("clock_update", (payload: any) => {
      setWhiteTime(payload.whiteTime);
      setBlackTime(payload.blackTime);
    });

    socketRef.current.on("game_over", (payload: any) => {
      console.log("Game over:", payload);
      setGameOver(true);
      
      const resultText = payload.result === "DRAW" 
        ? "Game ended in a draw"
        : payload.winner === myColor
        ? "You won!"
        : "You lost!";
      
      setGameResult(`${resultText} (${payload.method})`);
      
      // Update final times
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
      console.error("WebSocket error:", payload);
      
      // Handle "not part of game" error
      if (payload.message && payload.message.includes("not part of")) {
        alert("You are not part of this game. Redirecting...");
        // Try to join the game first
        router.push(`/join/${gameId}`);
        return;
      }
      
      alert(payload.message || "An error occurred");
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isLoaded, gameId, myColor, userReferenceId]);

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/**
         * TODO: Add a good loader here.
         */}
        {!gameStarted ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Waiting for game to start...</h1>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chess Board */}
            <div className="lg:col-span-2 flex justify-center">
              <ChessBoard
                board={game.board()}
                selectedSquare={selectedSquare}
                legalMoves={legalMoves}
                onSquareClick={handleSquareClick}
                playerColor={myColor}
              />
            </div>

            {/* Game Info Sidebar */}
            <div className="space-y-6">
              {/* Players and Clocks */}
              <div className="bg-neutral-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Players</h2>
                
                {/* Black Player */}
                <div className="mb-4 p-3 bg-neutral-700 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-black border-2 border-white" />
                      <span className="font-semibold">{blackPlayer?.name || "Black"}</span>
                      {myColor === "b" && <span className="text-xs text-green-400">(You)</span>}
                    </div>
                    <div className={`text-2xl font-mono ${currentTurn === "b" ? "text-green-400" : ""}`}>
                      {Math.floor(blackTime / 60)}:{String(blackTime % 60).padStart(2, "0")}
                    </div>
                  </div>
                </div>

                {/* White Player */}
                <div className="p-3 bg-neutral-700 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white" />
                      <span className="font-semibold">{whitePlayer?.name || "White"}</span>
                      {myColor === "w" && <span className="text-xs text-green-400">(You)</span>}
                    </div>
                    <div className={`text-2xl font-mono ${currentTurn === "w" ? "text-green-400" : ""}`}>
                      {Math.floor(whiteTime / 60)}:{String(whiteTime % 60).padStart(2, "0")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Turn */}
              <div className="bg-neutral-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Current Turn</h2>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${
                      currentTurn === "w" ? "bg-white" : "bg-black border-2 border-white"
                    }`}
                  />
                  <span className="text-xl">
                    {currentTurn === "w" ? "White" : "Black"}
                    {currentTurn === myColor && " (Your turn)"}
                  </span>
                </div>
              </div>

              {/* Game Status */}
              <div className="bg-neutral-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Status</h2>
                <div className="space-y-2">
                  {gameOver ? (
                    <div className="text-center p-4 bg-neutral-700 rounded">
                      <p className="text-xl font-bold mb-2">Game Over!</p>
                      <p className="text-lg">{gameResult}</p>
                    </div>
                  ) : (
                    <>
                      {game.isCheck() && (
                        <p className="text-yellow-500 font-semibold">Check!</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Move History */}
              <div className="bg-neutral-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Move History</h2>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {moveHistory.length === 0 ? (
                    <p className="text-neutral-400">No moves yet</p>
                  ) : (
                    moveHistory.map((move, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-sm bg-neutral-700 rounded p-2"
                      >
                        <span className="font-bold text-neutral-400">
                          {Math.floor(index / 2) + 1}.
                        </span>
                        <span className="font-mono">{move.san}</span>
                        <span className="text-neutral-500 text-xs">
                          ({move.from} → {move.to})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;
