"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import ChessBoard from "../components/ChessBoard";
import TimeControlSelector, { TimeControlValue } from "../components/TimeControlSelector";
import DifficultySelector from "../components/DifficultySelector";
import ColorSelector, { PlayerColor } from "../components/ColorSelector";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { Difficulty } from "@/lib/hooks/useBotMove";
import { CompleteUserObject } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/Navbar";
import { Users, Zap, Crown, Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

{/* play with a friend, play with a bot, compete with other players, bet against a friend,  */
}
{/* on play page only, I'll give a fen of the legendary chess positions and tell people to guess it and then there will be reveal button to check if they guessed it right
    this will let people engage on the site even on play page
    To implement this feature we have to fetch a random game from the database and give its fen to the chess object, and it should work,
    And store the game players information and game metadata on the page itself to reveal the answer.
*/
}

{/* This page holds information, about playing like the chess heroes, we can make a hall of fame section which will show all the legends like vishy, morphy and on click they will

*/
}

// TODO: Need to create a new table for legends and their games and then fetch those on this page to show the legends box

export default function Play() {
  const { isLoaded, userObject }: { isLoaded: boolean; userObject: CompleteUserObject | null } = useRequireAuth();
  const userReferenceId = userObject?.user?.referenceId;
  const router = useRouter();

  const [timeControl, setTimeControl] = useState<TimeControlValue>({
    mode: "Blitz",
    control: "5 | 5",
    time: 300,
    increment: 5,
  });
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"quick" | "friend" | "ai">("quick");
  const [playAsLegend, setPlayAsLegend] = useState(false);
  const [selectedHero, setSelectedHero] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [playerColor, setPlayerColor] = useState<PlayerColor>("random");

  // TODO: We can have photos of the legends and a short description of the players like this and this should be enough.
  const chessHeroes = [
    { id: "carlsen", name: "Magnus Carlsen", title: "The GOAT", era: "Modern Era" },
    { id: "kasparov", name: "Garry Kasparov", title: "The Beast", era: "Modern Era" },
    { id: "morphy", name: "Paul Morphy", title: "The Pride", era: "Romantic Era" },
    { id: "tal", name: "Mikhail Tal", title: "The Magician", era: "Soviet Era" },
    { id: "fischer", name: "Bobby Fischer", title: "The Genius", era: "Modern Era" },
    { id: "capablanca", name: "José Capablanca", title: "The Machine", era: "Classical Era" },
  ];

  const handleCreateGame = async () => {
    if (!userReferenceId) {
      alert("User not authenticated. Please sign in.");
      return;
    }

    setIsCreatingGame(true);

    // For Quick Game mode, route to matchmaking queue
    if (selectedMode === "quick") {
      const params = new URLSearchParams({
        time: timeControl.time.toString(),
        increment: timeControl.increment.toString(),
      });
      if (playAsLegend && selectedHero) {
        params.set("legend", selectedHero);
      }
      router.push(`/queue?${params.toString()}`);
      return;
    }

    // For AI mode, create AI game
    if (selectedMode === "ai") {
      const aiGameData = {
        userReferenceId: userReferenceId,
        initialTimeSeconds: timeControl.time,
        incrementSeconds: timeControl.increment,
        difficulty: difficulty,
        playerColor: playerColor,
      };

      try {
        const response = await fetch("/api/chess/create-ai-game", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(aiGameData),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to create AI game");
        }

        const gameRef = data.data.game.referenceId;
        router.push(`/game/${gameRef}`);
      } catch (error) {
        console.error("Error creating AI game:", error);
        alert(error instanceof Error ? error.message : "Failed to create AI game");
        setIsCreatingGame(false);
      }
      return;
    }

    // For Friend mode, create game directly
    const gameData = {
      userReferenceId: userReferenceId,
      stakeAmount: 0,
      initialTimeSeconds: timeControl.time,
      incrementSeconds: timeControl.increment,
      gameMode: selectedMode,
      playAsLegend: playAsLegend,
      selectedLegend: playAsLegend ? selectedHero : null,
    };

    try {
      const response = await fetch("/api/chess/create-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create game");
      }

      const gameRef = data.data.game.referenceId;
      const joinUrl = `${window.location.origin}/join/${gameRef}`;

      await navigator.clipboard.writeText(joinUrl);
      alert("Game link copied to clipboard! Share it with your friend.");
      router.push(`/game/${gameRef}`);
    } catch (error) {
      console.error("Error creating game:", error);
      alert(error instanceof Error ? error.message : "Failed to create game");
      setIsCreatingGame(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-neutral-900 items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a1a1a] flex flex-col lg:flex-row pt-16 sm:pt-18">
        {/* Left Side - Controls */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md space-y-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500">
                  Play Chess
                </span>
              </h1>
              <p className="text-neutral-400">Choose your game mode</p>
            </div>


            {/* Game Mode Selection */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setSelectedMode("quick")}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-3",
                  "bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-xl",
                  selectedMode === "quick"
                    ? "border-white/20 shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]"
                    : "border-white/10 hover:border-white/15 hover:scale-[1.02]"
                )}
              >
                <Zap className={cn("w-6 h-6 flex-shrink-0", selectedMode === "quick" ? "text-white" : "text-neutral-400")} />
                <div className="flex-1 text-left">
                  <p className={cn("text-sm font-medium", selectedMode === "quick" ? "text-white" : "text-neutral-300")}>
                    Quick Game
                  </p>
                  <p className="text-xs text-neutral-500">
                    Get matched instantly
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedMode("friend")}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-3",
                  "bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-xl",
                  selectedMode === "friend"
                    ? "border-white/20 shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]"
                    : "border-white/10 hover:border-white/15 hover:scale-[1.02]"
                )}
              >
                <Users className={cn("w-6 h-6 flex-shrink-0", selectedMode === "friend" ? "text-white" : "text-neutral-400")} />
                <div className="flex-1 text-left">
                  <p className={cn("text-sm font-medium", selectedMode === "friend" ? "text-white" : "text-neutral-300")}>
                    Play a Friend
                  </p>
                  <p className="text-xs text-neutral-500">
                    Challenge someone you know
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedMode("ai")}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-3",
                  "bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-xl",
                  selectedMode === "ai"
                    ? "border-white/20 shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]"
                    : "border-white/10 hover:border-white/15 hover:scale-[1.02]"
                )}
              >
                <Bot className={cn("w-6 h-6 flex-shrink-0", selectedMode === "ai" ? "text-white" : "text-neutral-400")} />
                <div className="flex-1 text-left">
                  <p className={cn("text-sm font-medium", selectedMode === "ai" ? "text-white" : "text-neutral-300")}>
                    Play with AI
                  </p>
                  <p className="text-xs text-neutral-500 italic">
                    Prove you are better than AI
                  </p>
                </div>
              </button>
            </div>

            {/* AI Mode Settings */}
            {selectedMode === "ai" && (
              <div className="space-y-4">
                <DifficultySelector value={difficulty} onChange={setDifficulty} />
                <ColorSelector value={playerColor} onChange={setPlayerColor} />
              </div>
            )}

            {/* Separator */}
            <div className="border-t border-white/10 mb-6"></div>

            {/* Play as Chess Legend (hide for AI games) */}
            {selectedMode !== "ai" && (
            <div className={cn(
              "rounded-xl border transition-all duration-200",
              "bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-xl",
              playAsLegend ? "border-white/20" : "border-white/10"
            )}>
              {/* Toggle Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => {
                  setPlayAsLegend(!playAsLegend);
                  if (playAsLegend) setSelectedHero(null);
                }}
              >
                <div className="flex items-center gap-3">
                  <Crown className={cn("w-5 h-5", playAsLegend ? "text-white" : "text-neutral-400")} />
                  <div>
                    <p className={cn("text-sm font-medium", playAsLegend ? "text-white" : "text-neutral-300")}>
                      Play as Chess Legend
                    </p>
                    <p className="text-xs text-neutral-500">Optional</p>
                  </div>
                </div>
                <div
                  className={cn(
                    "relative inline-block w-11 h-6 rounded-full transition-colors",
                    playAsLegend ? "bg-white/30" : "bg-white/10"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                      playAsLegend ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </div>
              </div>

              {/* Expandable Hero Selection */}
              <AnimatePresence>
                {playAsLegend && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-white/10">
                      <div className="pt-4 space-y-2">
                        <p className="text-xs text-neutral-400 mb-3">Select a chess legend to emulate their playing style</p>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {chessHeroes.map((hero) => (
                            <button
                              key={hero.id}
                              onClick={() => setSelectedHero(hero.id)}
                              className={cn(
                                "p-3 rounded-lg border transition-all duration-200 text-left",
                                "bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent",
                                selectedHero === hero.id
                                  ? "border-white/30 shadow-[0_4px_16px_0_rgba(255,255,255,0.1)]"
                                  : "border-white/10 hover:border-white/20 hover:scale-[1.02]"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-800 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-white">
                                    {hero.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-xs font-medium truncate",
                                    selectedHero === hero.id ? "text-white" : "text-neutral-300"
                                  )}>
                                    {hero.name}
                                  </p>
                                  <p className="text-[10px] text-neutral-500 truncate">{hero.title}</p>
                                  <p className="text-[10px] text-neutral-600">{hero.era}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}

            {/* Time Control Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-300">Time Control</label>
              <TimeControlSelector value={timeControl} onChange={setTimeControl} />
            </div>

            {/* Start Game Button */}
            <button
              onClick={handleCreateGame}
              disabled={isCreatingGame}
              className={cn(
                "w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200",
                "bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800",
                "text-white border border-white/20 hover:border-white/30",
                "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.04)]",
                "hover:scale-[1.02]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100"
              )}
            >
              {isCreatingGame ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{selectedMode === "quick" ? "Finding Match..." : "Creating Game..."}</span>
                </div>
              ) : (
                selectedMode === "quick" ? "Find Match" : "Start Game"
              )}
            </button>

            {/* Stats Footer */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                  <span className="text-neutral-400">Online Players</span>
                </div>
                <span className="text-white font-medium">12,453</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Chess Board (hidden on mobile) */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-2xl">
            <ChessBoard />
          </div>
        </div>
      </div>
    </>
  );
}
