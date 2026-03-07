"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import type { TournamentData } from "@/lib/hooks/useTournamentLobby";

const geistFont = { fontFamily: "'Geist', sans-serif" } as const;

type Participant = TournamentData["participants"][number];

interface ParticipantListProps {
  participants: Participant[];
  participantCount: number;
  tournamentReferenceId: string;
}

export default function ParticipantList({
  participants,
  participantCount,
  tournamentReferenceId,
}: ParticipantListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Participant[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

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
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, tournamentReferenceId]);

  const displayParticipants = searchResults ?? participants.slice(0, 30);

  return (
    <div className="border border-white/10">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 style={geistFont} className="text-sm font-medium text-white/60 tracking-wider uppercase">
          Participants ({participantCount.toLocaleString()})
        </h2>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
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

      <div className="p-4">
        {isSearching ? (
          <p style={geistFont} className="text-white/30 text-sm text-center py-4">
            Searching...
          </p>
        ) : displayParticipants.length === 0 ? (
          <p style={geistFont} className="text-white/30 text-sm text-center py-4">
            {searchQuery ? "No players found" : "No participants yet"}
          </p>
        ) : (
          <>
            {searchQuery && searchResults && (
              <p style={geistFont} className="text-white/30 text-xs mb-3 uppercase tracking-wider">
                Search Results
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayParticipants.map((p) => (
                <div
                  key={p.referenceId}
                  className="flex items-center gap-2 p-2 border border-white/5"
                >
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
                  <span style={geistFont} className="text-sm text-white truncate">
                    {p.user.name}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
