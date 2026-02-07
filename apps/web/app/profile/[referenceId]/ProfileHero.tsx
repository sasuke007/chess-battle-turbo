"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { Link as LinkIcon, Check } from "lucide-react";

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
      className="border border-white/10 p-6 sm:p-8 relative"
    >
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
        </div>
      </div>
    </motion.div>
  );
}
