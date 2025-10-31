"use client";

import { useState, useCallback, useEffect } from "react";
import { Chess, Square, Move } from "chess.js";
import ChessBoard from "../../components/ChessBoard";



type GamePageProps = {

}


const GamePage = ({ params }: { params: { gameId: string } }) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [currentTurn, setCurrentTurn] = useState<"w" | "b">("w");

  const gameId = params.gameId;

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
      // If no square is selected, select the clicked square if it has a piece
      if (!selectedSquare) {
        const piece = game.get(square);
        
        // Only allow selecting pieces of the current player's color
        if (piece && piece.color === currentTurn) {
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
      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: "q", // Always promote to queen for simplicity
        });

        if (move) {
          setGame(new Chess(game.fen())); // Create new instance to trigger re-render
          setMoveHistory([...moveHistory, move]);
          setCurrentTurn(game.turn());
          setSelectedSquare(null);
          setLegalMoves([]);
          sendMoveToServer(move, gameId);
        }
      } catch (error) {
        const piece = game.get(square);
        if (piece && piece.color === currentTurn) {
          setSelectedSquare(square);
          setLegalMoves(getLegalMovesForSquare(square));
        } else {
          setSelectedSquare(null);
          setLegalMoves([]);
        }
      }
    },
    [selectedSquare, game, currentTurn, getLegalMovesForSquare, moveHistory, gameId]
  );

  // Function to send move to server (placeholder)
  const sendMoveToServer = (move: Move, gameId: string) => {
    console.log("Sending move to server:", {
      gameId,
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: move.captured,
      promotion: move.promotion,
      san: move.san, // Standard Algebraic Notation (e.g., "e4", "Nf3")
      uci: `${move.from}${move.to}${move.promotion || ""}`, // UCI notation (e.g., "e2e4")
    });

    // TODO: Replace with actual API call or WebSocket emit
    // Example:
    // fetch(`/api/chess/move/${gameId}`, {
    //   method: 'POST',
    //   body: JSON.stringify({ move }),
    // });
  };

  // Function to handle opponent's move (from WebSocket)
  const handleOpponentMove = useCallback(
    (from: Square, to: Square, promotion?: string) => {
      try {
        const move = game.move({ from, to, promotion: promotion as any });
        if (move) {
          setGame(new Chess(game.fen()));
          setMoveHistory([...moveHistory, move]);
          setCurrentTurn(game.turn());
        }
      } catch (error) {
        console.error("Invalid opponent move:", error);
      }
    },
    [game, moveHistory]
  );

  // Example: Listen for opponent moves via WebSocket
  useEffect(() => {
    // TODO: Setup WebSocket connection
    // const socket = io();
    // socket.on(`game:${gameId}:move`, (moveData) => {
    //   handleOpponentMove(moveData.from, moveData.to, moveData.promotion);
    // });
    // return () => socket.disconnect();
  }, [gameId, handleOpponentMove]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chess Board */}
          <div className="lg:col-span-2 flex justify-center">
            <ChessBoard
              board={game.board()}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              onSquareClick={handleSquareClick}
            />
          </div>

          {/* Game Info Sidebar */}
          <div className="space-y-6">
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
                </span>
              </div>
            </div>

            {/* Game Status */}
            <div className="bg-neutral-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Status</h2>
              <div className="space-y-2">
                {game.isCheck() && (
                  <p className="text-yellow-500 font-semibold">Check!</p>
                )}
                {game.isCheckmate() && (
                  <p className="text-red-500 font-bold text-xl">Checkmate!</p>
                )}
                {game.isDraw() && (
                  <p className="text-blue-500 font-semibold">Draw!</p>
                )}
                {game.isStalemate() && (
                  <p className="text-blue-500 font-semibold">Stalemate!</p>
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
      </div>
    </div>
  );
};

export default GamePage;
