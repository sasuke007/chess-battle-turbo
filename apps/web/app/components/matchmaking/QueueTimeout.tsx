"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Clock, RefreshCw, ArrowLeft } from "lucide-react";
import * as m from "motion/react-m";

interface QueueTimeoutProps {
  onRetry: () => void;
  onBack: () => void;
  isRetrying?: boolean;
}

export function QueueTimeout({
  onRetry,
  onBack,
  isRetrying = false,
}: QueueTimeoutProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] space-y-8"
    >
      {/* Timeout icon */}
      <div className="w-[100px] h-[100px] border border-white/10 flex items-center justify-center">
        <Clock className="w-10 h-10 text-white/30" strokeWidth={1.5} />
      </div>

      {/* Status text */}
      <div className="text-center space-y-3">
        <h2
          style={{ fontFamily: "'Instrument Serif', serif" }}
          className="text-2xl text-white"
        >
          No Match Found
        </h2>
        <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40 max-w-sm">
          We couldn&apos;t find an opponent. This can happen when fewer players are online.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className={cn(
            "group relative flex items-center justify-center gap-2 px-8 py-3",
            "bg-white text-black",
            "transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          )}
          style={{ fontFamily: "'Geist', sans-serif" }}
        >
          {/* Hover effect */}
          <span className="absolute inset-0 bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          <RefreshCw
            className={cn("w-4 h-4 relative z-10 group-hover:text-white transition-colors", isRetrying && "animate-spin")}
            strokeWidth={1.5}
          />
          <span className="relative z-10 group-hover:text-white transition-colors">
            {isRetrying ? "Searching..." : "Try Again"}
          </span>
        </button>

        <button
          onClick={onBack}
          disabled={isRetrying}
          className={cn(
            "flex items-center justify-center gap-2 px-8 py-3",
            "border border-white/10 hover:border-white/30",
            "text-white/60 hover:text-white transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          style={{ fontFamily: "'Geist', sans-serif" }}
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span>Back</span>
        </button>
      </div>

      {/* Tips */}
      <div className="max-w-sm text-center">
        <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-xs text-white/30">
          Try different time controls or play during peak hours
        </p>
      </div>
    </m.div>
  );
}
