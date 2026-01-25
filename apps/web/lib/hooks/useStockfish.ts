"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UseStockfishReturn {
  getBestMove: (fen: string, depth: number) => Promise<string>;
  isReady: boolean;
  isSearching: boolean;
  stopSearch: () => void;
}

/**
 * Hook for using Stockfish chess engine via Web Worker.
 * Runs entirely in the browser using WebAssembly for optimal performance.
 */
export function useStockfish(): UseStockfishReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const resolveRef = useRef<((move: string) => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Create Web Worker from public directory
    const worker = new Worker("/workers/stockfish.wasm.js");
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const line = event.data as string;

      // Engine ready
      if (line === "uciok") {
        setIsReady(true);
      }

      // Best move found
      if (line.startsWith("bestmove")) {
        const parts = line.split(" ");
        const move = parts[1]; // "bestmove e2e4 ponder e7e5" → "e2e4"
        if (move && resolveRef.current) {
          resolveRef.current(move);
          resolveRef.current = null;
          rejectRef.current = null;
        }
        setIsSearching(false);
      }
    };

    worker.onerror = (error) => {
      console.error("Stockfish worker error:", error);
      if (rejectRef.current) {
        rejectRef.current(new Error("Stockfish worker error"));
        resolveRef.current = null;
        rejectRef.current = null;
      }
      setIsSearching(false);
    };

    // Initialize UCI protocol
    worker.postMessage("uci");

    return () => {
      worker.terminate();
    };
  }, []);

  const getBestMove = useCallback(
    (fen: string, depth: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !isReady) {
          reject(new Error("Stockfish not ready"));
          return;
        }

        resolveRef.current = resolve;
        rejectRef.current = reject;
        setIsSearching(true);

        const worker = workerRef.current;
        worker.postMessage("ucinewgame");
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);
      });
    },
    [isReady]
  );

  const stopSearch = useCallback(() => {
    workerRef.current?.postMessage("stop");
    setIsSearching(false);
    resolveRef.current = null;
    rejectRef.current = null;
  }, []);

  return { getBestMove, isReady, isSearching, stopSearch };
}
