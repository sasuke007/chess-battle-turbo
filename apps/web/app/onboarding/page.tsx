"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
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
      // Call API to validate and save chess.com handle
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

      // Redirect to home page after successful connection
      router.push("/");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // User can add chess.com handle later from profile
    router.push("/");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-neutral-800 rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Chess Battle! ♟️
          </h1>
          <p className="text-neutral-400">
            Connect your chess.com account (optional)
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            You can add this later from your profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="chessComHandle" className="block text-sm font-medium text-neutral-300 mb-2">
              Chess.com Username
            </label>
            <input
              type="text"
              id="chessComHandle"
              value={chessComHandle}
              onChange={(e) => setChessComHandle(e.target.value)}
              placeholder="e.g., anaestheticcoder"
              className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-neutral-500">
              We'll fetch your ratings and stats from chess.com
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-gray-200 font-semibold text-lg py-6"
            >
              {loading ? "Connecting..." : "Connect Chess.com Account"}
            </Button>

            <Button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="w-full bg-neutral-700 text-white hover:bg-neutral-600 font-semibold text-lg py-6"
            >
              Skip for Now
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-neutral-500">
              Don't have a chess.com account?{" "}
              <a
                href="https://www.chess.com/register"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                Create one here
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

