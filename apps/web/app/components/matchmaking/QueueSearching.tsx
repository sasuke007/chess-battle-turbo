"use client";

import React from "react";
import { cn, formatTime } from "@/lib/utils";
import { Search, Clock, X } from "lucide-react";
import { motion } from "motion/react";

interface QueueSearchingProps {
  timeRemaining: number;
  onCancel: () => void;
  isLoading?: boolean;
  isCancelling?: boolean;
  timeControlLabel?: string;
}

export function QueueSearching({
  timeRemaining,
  onCancel,
  isLoading = false,
  isCancelling = false,
  timeControlLabel = "5 min",
}: QueueSearchingProps) {
  return (
    <motion.div
      data-testid="queue-searching"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] space-y-8"
    >
      {/* Animated searching indicator */}
      <div className="relative">
        {/* Outer pulsing ring */}
        <motion.div
          className="absolute inset-0 border border-white/20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: 100, height: 100 }}
        />

        {/* Second ring */}
        <motion.div
          className="absolute inset-0 border border-white/10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          style={{ width: 100, height: 100 }}
        />

        {/* Center icon */}
        <div className="relative w-[100px] h-[100px] border border-white/20 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Search className="w-8 h-8 text-white/60" strokeWidth={1.5} />
          </motion.div>
        </div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-2">
        <h2
          style={{ fontFamily: "'Instrument Serif', serif" }}
          className="text-2xl text-white"
        >
          Finding Opponent
        </h2>
        <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40">
          Looking for a {timeControlLabel} match
        </p>
      </div>

      {/* Time remaining */}
      <div className="flex items-center gap-3 px-4 py-2 border border-white/10">
        <Clock className="w-4 h-4 text-white/40" strokeWidth={1.5} />
        <span style={{ fontFamily: "'Geist', sans-serif" }} className="text-lg font-mono text-white">
          {formatTime(timeRemaining)}
        </span>
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        disabled={isLoading || isCancelling}
        className={cn(
          "group flex items-center gap-2 px-6 py-3",
          "border border-white/10 hover:border-white/30 hover:bg-white hover:text-black",
          "text-white/60 hover:text-black transition-all duration-300",
          "disabled:cursor-not-allowed"
        )}
        style={{ fontFamily: "'Geist', sans-serif" }}
      >
        {isCancelling ? (
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 group-hover:border-black/20 group-hover:border-t-black rounded-full animate-spin transition-colors duration-300" />
        ) : (
          <X className="w-4 h-4" strokeWidth={1.5} />
        )}
        <span>{isCancelling ? "Cancelling..." : "Cancel Search"}</span>
      </button>

      {/* Tips */}
      <div className="max-w-sm text-center">
        <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-xs text-white/30">
          Matching players with similar ratings for fair games
        </p>
      </div>
    </motion.div>
  );
}
