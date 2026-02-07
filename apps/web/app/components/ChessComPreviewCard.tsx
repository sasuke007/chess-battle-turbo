"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ArrowRight, RotateCcw } from "lucide-react";
import type { ChessComPreviewData } from "@/lib/types/chess-com";

const RATING_CATEGORIES = [
  { key: "rapid" as const, label: "Rapid" },
  { key: "blitz" as const, label: "Blitz" },
  { key: "bullet" as const, label: "Bullet" },
  { key: "daily" as const, label: "Daily" },
];

interface ChessComPreviewCardProps {
  previewData: ChessComPreviewData;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ChessComPreviewCard({
  previewData,
  onConfirm,
  onCancel,
  loading = false,
  confirmLabel = "Confirm Connection",
  cancelLabel = "Go Back",
}: ChessComPreviewCardProps) {
  const { profile, ratings } = previewData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="border border-white/10 overflow-hidden"
    >
      {/* Profile header */}
      <div className="p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-start gap-5"
        >
          {/* Avatar */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 border border-white/20 bg-white/5 flex-shrink-0 overflow-hidden">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={profile.name}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="text-white/30 text-2xl"
                >
                  ♟
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {profile.title && (
                <span
                  style={{ fontFamily: "'Geist Mono', monospace" }}
                  className="text-[11px] px-2 py-0.5 bg-white/10 text-white/70 tracking-wider"
                >
                  {profile.title}
                </span>
              )}
              <h3
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="text-white text-xl sm:text-2xl truncate"
              >
                {profile.name}
              </h3>
            </div>

            <p
              style={{ fontFamily: "'Geist Mono', monospace" }}
              className="text-white/30 text-sm mt-1"
            >
              @{profile.username}
            </p>

            <div className="flex items-center gap-3 mt-2">
              {profile.country && (
                <span
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-white/25 text-xs tracking-wide"
                >
                  {profile.country}
                </span>
              )}
              {profile.country && profile.followers !== null && (
                <div className="w-px h-3 bg-white/10" />
              )}
              {profile.followers !== null && (
                <span
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-white/25 text-xs tracking-wide"
                >
                  {profile.followers.toLocaleString()} followers
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Ratings grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-6 sm:p-8"
      >
        <p
          style={{ fontFamily: "'Geist', sans-serif" }}
          className="text-white/30 text-[10px] tracking-[0.3em] uppercase mb-4"
        >
          Ratings
        </p>

        <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
          {RATING_CATEGORIES.map(({ key, label }) => {
            const rating = ratings[key];

            return (
              <div key={key} className="bg-black p-4">
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-white/25 text-[10px] tracking-[0.15em] uppercase mb-1.5"
                >
                  {label}
                </p>
                <p
                  style={{ fontFamily: "'Geist Mono', monospace" }}
                  className="text-white text-xl font-medium"
                >
                  {rating ?? "--"}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 sm:p-8 space-y-3"
      >
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "group relative w-full flex items-center justify-center gap-2 px-8 py-4",
            "bg-white text-black",
            "transition-all duration-300 overflow-hidden",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          style={{ fontFamily: "'Geist', sans-serif" }}
        >
          <span className="absolute inset-0 bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          {loading ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-black/30 border-t-black group-hover:border-white/30 group-hover:border-t-white relative z-10"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="relative z-10 font-semibold text-sm tracking-[0.1em] group-hover:text-white transition-colors"
              >
                CONNECTING
              </span>
            </>
          ) : (
            <>
              <span className="relative z-10 font-medium group-hover:text-white transition-colors duration-300">
                {confirmLabel}
              </span>
              <ArrowRight
                className="w-4 h-4 relative z-10 group-hover:text-white transition-colors duration-300"
                strokeWidth={1.5}
              />
            </>
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={loading}
          className={cn(
            "group w-full flex items-center justify-center gap-2 px-8 py-4",
            "border border-white/10 hover:border-white/30",
            "text-white/50 hover:text-white transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          style={{ fontFamily: "'Geist', sans-serif" }}
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          {cancelLabel}
        </button>
      </motion.div>
    </motion.div>
  );
}
