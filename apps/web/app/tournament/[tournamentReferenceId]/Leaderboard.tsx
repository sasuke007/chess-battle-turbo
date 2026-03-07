"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { TournamentData } from "@/lib/hooks/useTournamentLobby";

const geistFont = { fontFamily: "'Geist', sans-serif" } as const;

type Participant = TournamentData["participants"][number];
type RankedParticipant = Participant & { rank: number };

interface LeaderboardProps {
  participants: Participant[];
  isCompleted: boolean;
  currentUserParticipant: RankedParticipant | null;
  participantCount: number;
  tournamentReferenceId: string;
}

function RankBadge({ rank }: { rank: number }) {
  return (
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
  );
}

function ParticipantRow({
  p,
  rank,
  isCompleted,
}: {
  p: Participant;
  rank: number;
  isCompleted: boolean;
}) {
  const isWinner = isCompleted && rank === 1;
  return (
    <>
      {/* Desktop row */}
      <div
        className={cn(
          "hidden sm:grid grid-cols-[2rem_1fr_4rem_3rem_3rem_3rem_3rem] gap-2 px-4 py-2.5 items-center border-b border-white/5 last:border-b-0",
          isWinner && "bg-amber-400/5"
        )}
        data-testid="leaderboard-row"
      >
        <RankBadge rank={rank} />
        <Link href={`/profile/${p.user.referenceId}`} className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
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
        </Link>
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

      {/* Mobile row */}
      <div
        className={cn("sm:hidden px-4 py-3 border-b border-white/5 last:border-b-0", isWinner && "bg-amber-400/5")}
        data-testid="leaderboard-row"
      >
        <div className="flex items-center gap-3 mb-2">
          <RankBadge rank={rank} />
          <Link href={`/profile/${p.user.referenceId}`} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
            {p.user.profilePictureUrl ? (
              <Image
                src={p.user.profilePictureUrl}
                alt={p.user.name}
                width={28}
                height={28}
                className="w-7 h-7 rounded-full shrink-0"
              />
            ) : (
              <div className="w-7 h-7 bg-white/10 rounded-full shrink-0" />
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
          </Link>
          <span style={geistFont} className="ml-auto text-sm text-white font-medium tabular-nums">
            {p.points} pts
          </span>
        </div>
        <div className="flex gap-4 pl-9 text-xs tabular-nums" style={geistFont}>
          <span className="text-emerald-400/70">{p.wins}W</span>
          <span className="text-white/40">{p.draws}D</span>
          <span className="text-red-400/70">{p.losses}L</span>
          <span className="text-white/30">{p.gamesPlayed} played</span>
        </div>
      </div>
    </>
  );
}

export default function Leaderboard({
  participants,
  isCompleted,
  currentUserParticipant,
  participantCount,
  tournamentReferenceId,
}: LeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RankedParticipant[] | null>(null);
  const [isSearchingState, setIsSearchingState] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearchingState(false);
      return;
    }

    setIsSearchingState(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/tournament/${tournamentReferenceId}?search=${encodeURIComponent(searchQuery.trim())}`
        );
        const data = await res.json();
        if (data.success && data.searchResults) {
          setSearchResults(data.searchResults);
        }
      } catch {
        // ignore
      } finally {
        setIsSearchingState(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, tournamentReferenceId]);

  return (
    <div data-testid="leaderboard" className="space-y-4">
      {/* Your Rank card */}
      {currentUserParticipant && (
        <div className="border border-amber-400/30 bg-amber-400/10">
          <div className="px-4 py-2 border-b border-amber-400/20">
            <h3 style={geistFont} className="text-xs font-medium text-amber-400 tracking-wider uppercase">
              Your Rank
            </h3>
          </div>
          <ParticipantRow
            p={currentUserParticipant}
            rank={currentUserParticipant.rank}
            isCompleted={isCompleted}
          />
        </div>
      )}

      {/* Main leaderboard */}
      <div className="border border-white/10">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 style={geistFont} className="text-sm font-medium text-white/60 tracking-wider uppercase">
            {searchQuery && searchResults ? "Search Results" : "Leaderboard"}
          </h2>
          {!searchQuery && (
            <span style={geistFont} className="text-xs text-white/30">
              {participantCount.toLocaleString()} players
            </span>
          )}
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border border-white/10 text-white text-sm pl-9 pr-9 py-2 outline-none placeholder:text-white/30 focus:border-white/20 transition-colors"
              style={geistFont}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isSearchingState ? (
          <div className="px-4 py-8 text-center">
            <p style={geistFont} className="text-white/30 text-sm">Searching...</p>
          </div>
        ) : searchResults !== null ? (
          searchResults.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p style={geistFont} className="text-white/30 text-sm">No players found</p>
            </div>
          ) : (
            <>
              {/* Desktop header */}
              <div className="hidden sm:grid grid-cols-[2rem_1fr_4rem_3rem_3rem_3rem_3rem] gap-2 px-4 py-2 border-b border-white/5 text-[10px] text-white/30 tracking-wider uppercase" style={geistFont}>
                <span>#</span>
                <span>Player</span>
                <span className="text-right">Points</span>
                <span className="text-right">W</span>
                <span className="text-right">D</span>
                <span className="text-right">L</span>
                <span className="text-right">GP</span>
              </div>
              {searchResults.map((p) => (
                <ParticipantRow
                  key={p.referenceId}
                  p={p}
                  rank={p.rank}
                  isCompleted={isCompleted}
                />
              ))}
            </>
          )
        ) : participants.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p style={geistFont} className="text-white/30 text-sm">
              No participants yet
            </p>
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden sm:grid grid-cols-[2rem_1fr_4rem_3rem_3rem_3rem_3rem] gap-2 px-4 py-2 border-b border-white/5 text-[10px] text-white/30 tracking-wider uppercase" style={geistFont}>
              <span>#</span>
              <span>Player</span>
              <span className="text-right">Points</span>
              <span className="text-right">W</span>
              <span className="text-right">D</span>
              <span className="text-right">L</span>
              <span className="text-right">GP</span>
            </div>
            {participants.map((p, index) => (
              <ParticipantRow
                key={p.referenceId}
                p={p}
                rank={index + 1}
                isCompleted={isCompleted}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
