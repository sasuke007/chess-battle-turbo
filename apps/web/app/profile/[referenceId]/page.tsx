"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Navbar } from "../../components/Navbar";
import { ProfileHero } from "./ProfileHero";
import { StatsOverview } from "./StatsOverview";
import { GameHistory } from "./GameHistory";
import { ChessComRatings } from "./ChessComRatings";

interface ProfileUser {
  referenceId: string;
  code: string;
  name: string;
  profilePictureUrl: string | null;
  createdAt: string;
}

interface ProfileStats {
  totalGamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  winRate: number;
  currentWinStreak: number;
  longestWinStreak: number;
  averageGameDuration: number | null;
  lastPlayedAt: string | null;
}

interface ProfileChessComProfile {
  chessComHandle: string;
  rapidRating: number | null;
  rapidBestRating: number | null;
  blitzRating: number | null;
  blitzBestRating: number | null;
  bulletRating: number | null;
  bulletBestRating: number | null;
  dailyRating: number | null;
  dailyBestRating: number | null;
  lastSyncedAt: string;
}

interface ProfileGame {
  referenceId: string;
  opponent: {
    name: string;
    profilePictureUrl: string | null;
    code: string;
  } | null;
  outcome: "win" | "loss" | "draw";
  result: string;
  timeControl: string;
  completedAt: string | null;
}

interface ProfileData {
  user: ProfileUser;
  stats: ProfileStats | null;
  chessComProfile: ProfileChessComProfile | null;
  games: ProfileGame[];
}

const ProfilePage = ({
  params,
}: {
  params: Promise<{ referenceId: string }>;
}) => {
  const router = useRouter();
  const { referenceId } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${referenceId}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || "Profile not found");
          return;
        }

        setData(result.data);
      } catch (err) {
        setError("Failed to load profile");
        if (process.env.NODE_ENV === "development") {
          console.error("Profile fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [referenceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border border-white/20 border-t-white/60 rounded-full animate-spin mb-6" />
          <p
            style={{ fontFamily: "'Geist', sans-serif" }}
            className="text-white/40 text-xs tracking-[0.2em] uppercase"
          >
            Loading Profile
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <span className="text-white/10 text-6xl block mb-6">♔</span>
          <p
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-white text-xl mb-2"
          >
            {error || "Profile not found"}
          </p>
          <p
            style={{ fontFamily: "'Geist', sans-serif" }}
            className="text-white/30 text-sm mb-8"
          >
            This player may not exist or their profile is unavailable
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 border border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors duration-300"
            style={{ fontFamily: "'Geist', sans-serif" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Hero / Identity Card */}
          <ProfileHero user={data.user} />

          {/* Stats Overview */}
          <StatsOverview stats={data.stats} />

          {/* Game History + Chess.com Ratings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className={cn(!data.chessComProfile && "lg:col-span-2")}>
              <GameHistory games={data.games} />
            </div>

            {data.chessComProfile && (
              <ChessComRatings profile={data.chessComProfile} />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
