"use client";

import React from "react";
import Image from "next/image";
import * as m from "motion/react-m";
import { Swords } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface MatchFoundProps {
  opponentName: string;
  opponentProfilePictureUrl?: string | null;
}

export function MatchFound({
  opponentName,
  opponentProfilePictureUrl,
}: MatchFoundProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] space-y-8"
    >
      {/* Match found animation */}
      <m.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative"
      >
        {/* Success ring */}
        <m.div
          className="absolute inset-0 border border-white/30"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1, repeat: 2 }}
          style={{ width: 100, height: 100 }}
        />

        {/* Center icon */}
        <div className="relative w-[100px] h-[100px] bg-white flex items-center justify-center">
          <m.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Swords className="w-10 h-10 text-black" strokeWidth={1.5} />
          </m.div>
        </div>
      </m.div>

      {/* Match found text */}
      <m.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-2"
      >
        <h2
          style={{ fontFamily: "'Instrument Serif', serif" }}
          className="text-3xl text-white"
        >
          Match Found
        </h2>
        <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40">
          Get ready to play
        </p>
      </m.div>

      {/* Opponent info */}
      <m.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-4 p-5 border border-white/10"
      >
        {/* Opponent avatar */}
        {opponentProfilePictureUrl ? (
          <Image
            src={opponentProfilePictureUrl}
            alt={opponentName}
            width={48}
            height={48}
            className="w-12 h-12 object-cover grayscale"
          />
        ) : (
          <div className="w-12 h-12 bg-white flex items-center justify-center">
            <span
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-sm font-bold text-black"
            >
              {getInitials(opponentName)}
            </span>
          </div>
        )}

        <div>
          <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-xs text-white/40 uppercase tracking-widest">
            Your opponent
          </p>
          <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-lg font-medium text-white">
            {opponentName}
          </p>
        </div>
      </m.div>

      {/* Loading indicator */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 text-white/40"
      >
        <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
        <span style={{ fontFamily: "'Geist', sans-serif" }} className="text-sm">
          Starting game...
        </span>
      </m.div>
    </m.div>
  );
}
