"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Swords } from "lucide-react";
import type { TournamentData } from "@/lib/hooks/useTournamentLobby";

const geistFont = { fontFamily: "'Geist', sans-serif" } as const;

type ActiveGame = TournamentData["activeGames"][number];

interface ActiveGamesProps {
  games: ActiveGame[];
}

export default function ActiveGames({ games }: ActiveGamesProps) {
  if (games.length === 0) return null;

  return (
    <div className="border border-white/10">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 style={geistFont} className="text-sm font-medium text-white/60 tracking-wider uppercase">
          Live Games ({games.length})
        </h2>
      </div>
      <div className="divide-y divide-white/5">
        {games.map((g) => (
          <Link
            key={g.referenceId}
            href={`/game/${g.referenceId}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <Swords className="w-4 h-4 text-white/30 shrink-0" />
            <span style={geistFont} className="text-sm text-white">
              {g.creator.name}
            </span>
            <span style={geistFont} className="text-xs text-white/30">
              vs
            </span>
            <span style={geistFont} className="text-sm text-white">
              {g.opponent?.name || "..."}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
