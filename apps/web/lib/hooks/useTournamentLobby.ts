import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface TournamentParticipant {
  referenceId: string;
  points: string;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  isSearching: boolean;
  joinedAt: string;
  user: {
    referenceId: string;
    name: string;
    profilePictureUrl: string | null;
  };
}

interface ActiveGame {
  referenceId: string;
  creator: { referenceId: string; name: string; profilePictureUrl: string | null };
  opponent: { referenceId: string; name: string; profilePictureUrl: string | null } | null;
  startedAt: string | null;
}

export interface TournamentData {
  referenceId: string;
  name: string;
  mode: string;
  status: string;
  maxParticipants: number | null;
  initialTimeSeconds: number;
  incrementSeconds: number;
  durationMinutes: number;
  startedAt: string | null;
  endsAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: {
    referenceId: string;
    name: string;
    profilePictureUrl: string | null;
  };
  opening: { referenceId: string; name: string; eco: string } | null;
  legend: { referenceId: string; name: string; profilePhotoUrl: string | null } | null;
  chessPosition: { referenceId: string; fen: string } | null;
  participants: TournamentParticipant[];
  participantCount: number;
  activeGames: ActiveGame[];
}

export function useTournamentLobby(tournamentReferenceId: string) {
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchTournament = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournament/${tournamentReferenceId}`);
      const data = await res.json();
      if (data.success) {
        setTournament(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to load tournament");
      }
    } catch {
      setError("Failed to load tournament");
    } finally {
      setIsLoading(false);
    }
  }, [tournamentReferenceId]);

  // Initial fetch
  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  // Socket connection for real-time updates
  useEffect(() => {
    const WEBSOCKET_URL =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3002";

    const socket = io(WEBSOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_tournament_lobby", { tournamentReferenceId });
    });

    // Listen for real-time events and refetch tournament data
    socket.on("tournament_player_joined", () => {
      fetchTournament();
    });

    socket.on("tournament_started", () => {
      fetchTournament();
    });

    socket.on("tournament_game_started", () => {
      fetchTournament();
    });

    socket.on("tournament_game_ended", () => {
      fetchTournament();
    });

    socket.on("tournament_ended", () => {
      fetchTournament();
    });

    return () => {
      socket.emit("leave_tournament_lobby", { tournamentReferenceId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tournamentReferenceId, fetchTournament]);

  return {
    tournament,
    isLoading,
    error,
    refetch: fetchTournament,
  };
}
