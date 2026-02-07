"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { getInitials } from "@/lib/utils";

interface ProfileUser {
  referenceId: string;
  code: string;
  name: string;
  profilePictureUrl: string | null;
  createdAt: string;
}

interface ProfileHeroProps {
  user: ProfileUser;
}

function formatMemberSince(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function ProfileHero({ user }: ProfileHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="border border-white/10 p-6 sm:p-8"
    >
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
        </div>
      </div>
    </motion.div>
  );
}
