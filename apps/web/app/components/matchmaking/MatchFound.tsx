"use client";

import React from "react";
import { motion } from "motion/react";
import { Swords } from "lucide-react";

interface MatchFoundProps {
  opponentName: string;
  opponentProfilePictureUrl?: string | null;
}

export function MatchFound({
  opponentName,
  opponentProfilePictureUrl,
}: MatchFoundProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
      {/* Match found animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative"
      >
        {/* Success ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500/20"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1, repeat: 2 }}
          style={{ width: 120, height: 120 }}
        />

        {/* Center icon */}
        <div className="relative w-[120px] h-[120px] rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/40 flex items-center justify-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Swords className="w-12 h-12 text-green-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Match found text */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-2"
      >
        <h2 className="text-2xl font-bold text-white">Match Found!</h2>
        <p className="text-neutral-400">Get ready to play</p>
      </motion.div>

      {/* Opponent info */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
      >
        {/* Opponent avatar */}
        {opponentProfilePictureUrl ? (
          <img
            src={opponentProfilePictureUrl}
            alt={opponentName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-800 flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {getInitials(opponentName)}
            </span>
          </div>
        )}

        <div>
          <p className="text-sm text-neutral-400">Your opponent</p>
          <p className="text-lg font-semibold text-white">{opponentName}</p>
        </div>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 text-neutral-400"
      >
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span>Starting game...</span>
      </motion.div>
    </div>
  );
}
