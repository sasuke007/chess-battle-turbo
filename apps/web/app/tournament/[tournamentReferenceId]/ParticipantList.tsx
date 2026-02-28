"use client";

import React from "react";
import Image from "next/image";
import type { TournamentData } from "@/lib/hooks/useTournamentLobby";

const geistFont = { fontFamily: "'Geist', sans-serif" } as const;

type Participant = TournamentData["participants"][number];

interface ParticipantListProps {
  participants: Participant[];
}

export default function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <div className="border border-white/10">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 style={geistFont} className="text-sm font-medium text-white/60 tracking-wider uppercase">
          Participants ({participants.length})
        </h2>
      </div>
      <div className="p-4">
        {participants.length === 0 ? (
          <p style={geistFont} className="text-white/30 text-sm text-center py-4">
            No participants yet
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {participants.map((p) => (
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
        )}
      </div>
    </div>
  );
}
