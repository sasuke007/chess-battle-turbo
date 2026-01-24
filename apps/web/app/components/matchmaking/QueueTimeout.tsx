"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Clock, RefreshCw, ArrowLeft } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
      {/* Timeout icon */}
      <div className="relative">
        <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center">
          <Clock className="w-12 h-12 text-neutral-500" />
        </div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">No Match Found</h2>
        <p className="text-neutral-400 max-w-sm">
          We couldn&apos;t find an opponent within your rating range. This can
          happen when fewer players are online.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3 rounded-xl",
            "bg-gradient-to-b from-neutral-700 to-neutral-800 hover:from-neutral-600 hover:to-neutral-700",
            "text-white border border-white/20 hover:border-white/30",
            "transition-all duration-200 hover:scale-[1.02]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <RefreshCw
            className={cn("w-4 h-4", isRetrying && "animate-spin")}
          />
          <span>{isRetrying ? "Searching..." : "Try Again"}</span>
        </button>

        <button
          onClick={onBack}
          disabled={isRetrying}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3 rounded-xl",
            "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
            "text-neutral-300 hover:text-white transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Play</span>
        </button>
      </div>

      {/* Tips */}
      <div className="max-w-sm text-center">
        <p className="text-sm text-neutral-500">
          Try different time controls or play during peak hours for faster matches
        </p>
      </div>
    </div>
  );
}
