"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Search, Clock, X } from "lucide-react";
import { motion } from "motion/react";

interface QueueSearchingProps {
  timeRemaining: number;
  onCancel: () => void;
  isLoading?: boolean;
  timeControlLabel?: string;
}

export function QueueSearching({
  timeRemaining,
  onCancel,
  isLoading = false,
  timeControlLabel = "5 min",
}: QueueSearchingProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
      {/* Animated searching indicator */}
      <div className="relative">
        {/* Outer pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/10"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: 120, height: 120 }}
        />

        {/* Second ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/10"
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
          style={{ width: 120, height: 120 }}
        />

        {/* Center icon */}
        <div className="relative w-[120px] h-[120px] rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Search className="w-12 h-12 text-white/80" />
          </motion.div>
        </div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Finding Opponent</h2>
        <p className="text-neutral-400">
          Looking for a {timeControlLabel} match...
        </p>
      </div>

      {/* Time remaining */}
      <div className="flex items-center gap-2 text-neutral-300">
        <Clock className="w-5 h-5" />
        <span className="text-lg font-mono">{formatTime(timeRemaining)}</span>
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-xl",
          "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
          "text-neutral-300 hover:text-white transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <X className="w-4 h-4" />
        <span>{isLoading ? "Cancelling..." : "Cancel Search"}</span>
      </button>

      {/* Tips */}
      <div className="max-w-sm text-center">
        <p className="text-sm text-neutral-500">
          We match players with similar ratings to ensure fair games
        </p>
      </div>
    </div>
  );
}
