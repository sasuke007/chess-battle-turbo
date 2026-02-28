"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { TournamentData } from "@/lib/hooks/useTournamentLobby";

const geistFont = { fontFamily: "'Geist', sans-serif" } as const;

type Participant = TournamentData["participants"][number];

interface LeaderboardProps {
  participants: Participant[];
  isCompleted: boolean;
}

export default function Leaderboard({ participants, isCompleted }: LeaderboardProps) {
  return (
    <div data-testid="leaderboard" className="border border-white/10">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 style={geistFont} className="text-sm font-medium text-white/60 tracking-wider uppercase">
          Leaderboard
        </h2>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2.5rem_1fr_4rem_3rem_3rem_3rem_3rem] gap-2 px-4 py-2 border-b border-white/5 text-[10px] text-white/30 tracking-wider uppercase" style={geistFont}>
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Points</span>
        <span className="text-right">W</span>
        <span className="text-right">D</span>
        <span className="text-right">L</span>
        <span className="text-right">GP</span>
      </div>

      {/* Rows */}
      {participants.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p style={geistFont} className="text-white/30 text-sm">
            No participants yet
          </p>
        </div>
      ) : (
        participants.map((p, index) => {
          const rank = index + 1;
          const isWinner = isCompleted && rank === 1;
          return (
            <div
              key={p.referenceId}
              data-testid="leaderboard-row"
              className={cn(
                "grid grid-cols-[2.5rem_1fr_4rem_3rem_3rem_3rem_3rem] gap-2 px-4 py-2.5 items-center border-b border-white/5 last:border-b-0",
                isWinner && "bg-amber-400/5"
              )}
            >
              <span
                style={geistFont}
                className={cn(
                  "text-sm",
                  rank === 1
                    ? "text-amber-400 font-medium"
                    : rank === 2
                      ? "text-gray-300"
                      : rank === 3
                        ? "text-amber-700"
                        : "text-white/30"
                )}
              >
                {rank}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                {p.user.profilePictureUrl ? (
                  <Image
                    src={p.user.profilePictureUrl}
                    alt={p.user.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 bg-white/10 rounded-full shrink-0" />
                )}
                <span
                  style={geistFont}
                  className={cn(
                    "text-sm truncate",
                    isWinner ? "text-amber-400 font-medium" : "text-white"
                  )}
                >
                  {p.user.name}
                </span>
              </div>
              <span style={geistFont} className="text-sm text-white font-medium text-right tabular-nums">
                {p.points}
              </span>
              <span style={geistFont} className="text-sm text-emerald-400/70 text-right tabular-nums">
                {p.wins}
              </span>
              <span style={geistFont} className="text-sm text-white/40 text-right tabular-nums">
                {p.draws}
              </span>
              <span style={geistFont} className="text-sm text-red-400/70 text-right tabular-nums">
                {p.losses}
              </span>
              <span style={geistFont} className="text-sm text-white/30 text-right tabular-nums">
                {p.gamesPlayed}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
