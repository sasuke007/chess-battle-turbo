"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { Link as LinkIcon, Check, ExternalLink } from "lucide-react";

interface ProfileUser {
  referenceId: string;
  code: string;
  name: string;
  profilePictureUrl: string | null;
  createdAt: string;
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

interface ProfileHeroProps {
  user: ProfileUser;
  chessComProfile: ProfileChessComProfile | null;
}

const RATING_CATEGORIES = [
  { key: "rapid", label: "Rapid", icon: "♜" },
  { key: "blitz", label: "Blitz", icon: "♞" },
  { key: "bullet", label: "Bullet", icon: "♟" },
  { key: "daily", label: "Daily", icon: "♝" },
] as const;

function formatMemberSince(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function ProfileHero({ user, chessComProfile }: ProfileHeroProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${user.referenceId}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = profileUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="border border-white/10 relative"
    >
      {/* Top section: identity */}
      <div className="p-6 sm:p-8">
        {/* Share button — top right */}
        <button
          onClick={handleShare}
          className="absolute top-5 right-5 sm:top-7 sm:right-7 group flex items-center gap-2 transition-all duration-300"
          aria-label="Copy profile link"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="copied"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-white/60" strokeWidth={2} />
                <span
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-white/60 text-[10px] tracking-[0.15em] uppercase"
                >
                  Copied
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="share"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <LinkIcon
                  className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors duration-200"
                  strokeWidth={1.5}
                />
                <span
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-white/20 group-hover:text-white/50 text-[10px] tracking-[0.15em] uppercase transition-colors duration-200"
                >
                  Share
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 border border-white/20 bg-white/5 flex-shrink-0 overflow-hidden">
            {user.profilePictureUrl ? (
              <Image
                src={user.profilePictureUrl}
                alt={user.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="text-white/60 text-2xl sm:text-3xl"
                >
                  {getInitials(user.name)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col items-center sm:items-start gap-2">
            <h1
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-white text-2xl sm:text-3xl tracking-tight"
            >
              {user.name}
            </h1>

            <div className="flex items-center gap-3">
              <span
                style={{ fontFamily: "'Geist Mono', monospace" }}
                className="text-white/40 text-sm tracking-wider"
              >
                #{user.code}
              </span>
              <div className="w-px h-3 bg-white/15" />
              <span
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-white/30 text-xs tracking-wide"
              >
                Member since {formatMemberSince(user.createdAt)}
              </span>
            </div>

            {/* Chess.com handle inline */}
            {chessComProfile && (
              <a
                href={`https://www.chess.com/member/${chessComProfile.chessComHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white/20 hover:text-white/45 transition-colors duration-200 mt-1"
              >
                <span
                  style={{ fontFamily: "'Geist Mono', monospace" }}
                  className="text-xs"
                >
                  chess.com/{chessComProfile.chessComHandle}
                </span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Chess.com ratings strip */}
      {chessComProfile && (
        <div className="border-t border-white/[0.06]">
          <div className="grid grid-cols-4 gap-px bg-white/[0.04]">
            {RATING_CATEGORIES.map(({ key, label, icon }) => {
              const rating = chessComProfile[
                `${key}Rating` as keyof ProfileChessComProfile
              ] as number | null;
              const bestRating = chessComProfile[
                `${key}BestRating` as keyof ProfileChessComProfile
              ] as number | null;

              return (
                <div
                  key={key}
                  className="bg-black px-3 py-3.5 sm:px-5 sm:py-4 text-center sm:text-left"
                >
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1.5">
                    <span className="text-white/10 text-xs hidden sm:inline">
                      {icon}
                    </span>
                    <p
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/25 text-[9px] sm:text-[10px] tracking-[0.15em] uppercase"
                    >
                      {label}
                    </p>
                  </div>
                  <p
                    style={{ fontFamily: "'Geist Mono', monospace" }}
                    className="text-white text-lg sm:text-xl font-medium leading-none"
                  >
                    {rating ?? "—"}
                  </p>
                  {bestRating && (
                    <p
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/12 text-[10px] mt-1 hidden sm:block"
                    >
                      Best {bestRating}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
