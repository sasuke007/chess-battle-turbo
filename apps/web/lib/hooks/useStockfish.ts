"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UseStockfishReturn {
  getBestMove: (fen: string, depth: number) => Promise<string>;
  isReady: boolean;
  isSearching: boolean;
  stopSearch: () => void;
}

// Timeout for Stockfish to respond (15 seconds for pure JS version which is slower)
const STOCKFISH_TIMEOUT_MS = 15000;

/**
 * Hook for using Stockfish chess engine via Web Worker.
 * Uses pure JavaScript version for maximum compatibility.
 */
export function useStockfish(): UseStockfishReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const resolveRef = useRef<((move: string) => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    console.log("[Stockfish] Initializing Web Worker...");

    // Use pure JavaScript version (no WASM) for better compatibility
    const worker = new Worker("/workers/stockfish-pure.js");
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const line = event.data as string;

      // Log important messages for debugging
      if (line.includes("uciok") || line.includes("bestmove") || line.includes("error")) {
        console.log("[Stockfish]", line);
      }

      // Engine ready
      if (line === "uciok") {
        console.log("[Stockfish] Engine ready!");
        setIsReady(true);
      }

      // Best move found
      if (line.startsWith("bestmove")) {
        const parts = line.split(" ");
        const move = parts[1]; // "bestmove e2e4 ponder e7e5" → "e2e4"
        console.log("[Stockfish] Best move:", move);

        // Clear timeout since we got a response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (move && resolveRef.current) {
          resolveRef.current(move);
          resolveRef.current = null;
          rejectRef.current = null;
        }
        setIsSearching(false);
      }
    };

    worker.onerror = (error) => {
      console.error("[Stockfish] Worker error:", error);

      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

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
      console.log("[Stockfish] Terminating worker");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      worker.terminate();
    };
  }, []);

  const getBestMove = useCallback(
    (fen: string, depth: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          console.error("[Stockfish] Worker not initialized");
          reject(new Error("Stockfish worker not initialized"));
          return;
        }

        if (!isReady) {
          console.warn("[Stockfish] Engine not ready yet, rejecting request");
          reject(new Error("Stockfish not ready"));
          return;
        }

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        resolveRef.current = resolve;
        rejectRef.current = reject;
        setIsSearching(true);

        // Set timeout to prevent hanging
        timeoutRef.current = setTimeout(() => {
          console.error("[Stockfish] Timeout - no response in", STOCKFISH_TIMEOUT_MS, "ms");
          if (rejectRef.current) {
            rejectRef.current(new Error("Stockfish timeout"));
            resolveRef.current = null;
            rejectRef.current = null;
          }
          setIsSearching(false);

          // Try to stop the current search
          workerRef.current?.postMessage("stop");
        }, STOCKFISH_TIMEOUT_MS);

        const worker = workerRef.current;
        console.log(`[Stockfish] Searching: depth=${depth}`);
        console.log(`[Stockfish] FEN: ${fen}`);

        // Send UCI commands
        worker.postMessage("ucinewgame");
        worker.postMessage("isready"); // Wait for readyok
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);
      });
    },
    [isReady]
  );

  const stopSearch = useCallback(() => {
    console.log("[Stockfish] Stopping search");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    workerRef.current?.postMessage("stop");
    setIsSearching(false);
    resolveRef.current = null;
    rejectRef.current = null;
  }, []);

  return { getBestMove, isReady, isSearching, stopSearch };
}
