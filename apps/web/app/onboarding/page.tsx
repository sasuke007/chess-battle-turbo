"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ArrowRight, ExternalLink } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoaded } = useUser();
  const [chessComHandle, setChessComHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chessComHandle.trim()) {
      setError("Please enter your chess.com username");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/chess-com-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chessComHandle: chessComHandle.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save chess.com profile");
      }

      router.push("/");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40 text-sm tracking-wide">
            Loading...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 border border-white/10 p-8 sm:p-12 max-w-md w-full"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <h1
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-3xl sm:text-4xl text-white mb-3"
          >
            Welcome to Chess Battle
          </h1>
          <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40">
            Connect your chess.com account
          </p>
          <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-xs text-white/20 mt-2">
            You can add this later from your profile
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label
              htmlFor="chessComHandle"
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="block text-xs text-white/40 uppercase tracking-widest mb-3"
            >
              Chess.com Username
            </label>
            <input
              type="text"
              id="chessComHandle"
              value={chessComHandle}
              onChange={(e) => setChessComHandle(e.target.value)}
              placeholder="e.g., anaestheticcoder"
              className={cn(
                "w-full px-4 py-3 bg-transparent border border-white/10",
                "text-white placeholder-white/20",
                "focus:outline-none focus:border-white/40 transition-colors duration-300"
              )}
              style={{ fontFamily: "'Geist', sans-serif" }}
              disabled={loading}
            />
            <p style={{ fontFamily: "'Geist', sans-serif" }} className="mt-2 text-xs text-white/20">
              We&apos;ll fetch your ratings and stats from chess.com
            </p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-white/20 p-4"
            >
              <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/60 text-sm">
                {error}
              </p>
            </motion.div>
          )}

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <button
              type="submit"
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
              <span className="relative z-10 font-medium group-hover:text-white transition-colors duration-300">
                {loading ? "Connecting..." : "Connect Chess.com"}
              </span>
              {!loading && (
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className={cn(
                "group w-full flex items-center justify-center gap-2 px-8 py-4",
                "border border-white/10 hover:border-white/30",
                "text-white/60 hover:text-white transition-all duration-300",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              style={{ fontFamily: "'Geist', sans-serif" }}
            >
              Skip for Now
            </button>
          </motion.div>

          {/* Link to chess.com */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center pt-4"
          >
            <a
              href="https://www.chess.com/register"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Don&apos;t have an account? Create one
              <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
            </a>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
