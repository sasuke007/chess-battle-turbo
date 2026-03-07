"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Swords, Clock, Info } from "lucide-react";
import type { TournamentData } from "@/lib/hooks/useTournamentLobby";

const geistFont = { fontFamily: "'Geist', sans-serif" } as const;

type ActiveGame = TournamentData["activeGames"][number];

interface ActiveGamesProps {
  games: ActiveGame[];
  tournamentStatus: string;
}

export default function ActiveGames({ games, tournamentStatus }: ActiveGamesProps) {
  if (games.length === 0) return null;

  const isFinishing = tournamentStatus === "COMPLETED";

  return (
    <div className={cn("border", isFinishing ? "border-amber-500/20" : "border-white/10")}>
      <div className={cn("px-4 py-3 border-b", isFinishing ? "border-amber-500/20" : "border-white/10")}>
        <div className="flex items-center gap-2">
          {isFinishing ? (
            <Clock className="w-3.5 h-3.5 text-amber-400/60" />
          ) : null}
          <h2 style={geistFont} className={cn(
            "text-sm font-medium tracking-wider uppercase",
            isFinishing ? "text-amber-400/60" : "text-white/60"
          )}>
            {isFinishing ? "Finishing Games" : "Live Games"} ({games.length})
          </h2>
        </div>
      </div>

      {isFinishing && (
        <div className="px-4 py-2.5 border-b border-amber-500/10 bg-amber-500/[0.03]">
          <p style={geistFont} className="text-xs text-amber-400/40 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            These games started before the tournament ended — results will still count toward final standings.
          </p>
        </div>
      )}

      <div className="divide-y divide-white/5">
        {games.map((g) => (
          <Link
            key={g.referenceId}
            href={`/game/${g.referenceId}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <Swords className={cn("w-4 h-4 shrink-0", isFinishing ? "text-amber-400/30" : "text-white/30")} />
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
