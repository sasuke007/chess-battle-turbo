"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import ChessBoard from "../components/ChessBoard";
import TimeControlSelector, { TimeControlValue } from "../components/TimeControlSelector";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { CompleteUserObject } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/Navbar";
import { Users, Zap, Crown, Bot, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  interface Legend {
    id: string;
    name: string;
    era: string;
    profilePhotoUrl: string | null;
    description: string;
    playingStyle: string | null;
  }
  const [legends, setLegends] = useState<Legend[]>([]);
  const [legendsLoading, setLegendsLoading] = useState(true);

  useEffect(() => {
    async function fetchLegends() {
      try {
        const response = await fetch("/api/legends?isVisible=true&isActive=true");
        const data = await response.json();
        if (data.success && data.data?.legends) {
          setLegends(data.data.legends);
        }
      } catch (error) {
        console.error("Failed to fetch legends:", error);
      } finally {
        setLegendsLoading(false);
      }
    }
    fetchLegends();
  }, []);

  const handleCreateGame = async () => {
    if (!userReferenceId) {
      alert("User not authenticated. Please sign in.");
      return;
    }

    setIsCreatingGame(true);

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

    if (selectedMode === "ai") {
      const aiGameData = {
        userReferenceId: userReferenceId,
        initialTimeSeconds: timeControl.time,
        incrementSeconds: timeControl.increment,
        ...(playAsLegend && selectedHero && { selectedLegend: selectedHero }),
      };

      try {
        const response = await fetch("/api/chess/create-ai-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aiGameData),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to create AI game");
        }

        router.push(`/game/${data.data.game.referenceId}`);
      } catch (error) {
        console.error("Error creating AI game:", error);
        alert(error instanceof Error ? error.message : "Failed to create AI game");
        setIsCreatingGame(false);
      }
      return;
    }

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create game");
      }

      const gameRef = data.data.game.referenceId;
      await navigator.clipboard.writeText(`${window.location.origin}/join/${gameRef}`);
      alert("Game link copied to clipboard! Share it with your friend.");
      router.push(`/game/${gameRef}`);
    } catch (error) {
      console.error("Error creating game:", error);
      alert(error instanceof Error ? error.message : "Failed to create game");
      setIsCreatingGame(false);
    }
  };

  const gameModes = [
    {
      id: "quick" as const,
      title: "Quick Match",
      subtitle: "Find an opponent instantly",
      icon: Zap,
    },
    {
      id: "friend" as const,
      title: "Challenge Friend",
      subtitle: "Share a private invitation",
      icon: Users,
    },
    {
      id: "ai" as const,
      title: "Play the Machine",
      subtitle: "Test your skills against AI",
      icon: Bot,
    },
  ];

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Chess piece loading animation */}
          <div className="relative w-16 h-16">
            <motion.div
              className="absolute inset-0 border-2 border-white/20 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 border-2 border-white/40 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
          <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40 text-sm tracking-[0.2em] uppercase">
            Loading
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-black flex flex-col lg:flex-row pt-16 sm:pt-18 relative overflow-hidden">
        {/* Dramatic diagonal gradient */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: `linear-gradient(135deg,
              rgba(255,255,255,0.03) 0%,
              transparent 40%,
              transparent 60%,
              rgba(255,255,255,0.02) 100%
            )`,
          }}
        />

        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Left Side - Controls */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {/* Header */}
            <div className="mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-4"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-white/30 to-transparent" />
                <span style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/50 text-[10px] tracking-[0.4em] uppercase">
                  New Game
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-white/30 to-transparent" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="text-5xl lg:text-6xl text-white leading-[1.05] tracking-tight text-center"
              >
                Your Move
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-white/40 text-sm text-center mt-3 tracking-wide"
              >
                Choose how you want to play
              </motion.p>
            </div>

            {/* Game Mode Cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-2 mb-8"
            >
              {gameModes.map((mode, index) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;
                const isHovered = hoveredMode === mode.id;

                return (
                  <motion.button
                    key={mode.id}
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                    onClick={() => setSelectedMode(mode.id)}
                    onMouseEnter={() => setHoveredMode(mode.id)}
                    onMouseLeave={() => setHoveredMode(null)}
                    className={cn(
                      "w-full group relative overflow-hidden transition-all duration-500",
                      "border rounded-none",
                      isSelected
                        ? "bg-white border-white"
                        : "bg-transparent border-white/10 hover:border-white/30"
                    )}
                  >
                    {/* Hover fill animation */}
                    <motion.div
                      className="absolute inset-0 bg-white origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isHovered && !isSelected ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />

                    <div className="relative p-5 flex items-center gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 flex items-center justify-center transition-colors duration-300",
                        "border",
                        isSelected
                          ? "border-black/20 bg-black/5"
                          : isHovered
                            ? "border-black/20 bg-black/5"
                            : "border-white/20"
                      )}>
                        <Icon className={cn(
                          "w-4 h-4 transition-colors duration-300",
                          isSelected || isHovered ? "text-black" : "text-white/70"
                        )} strokeWidth={1.5} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 text-left">
                        <p style={{ fontFamily: "'Geist', sans-serif" }} className={cn(
                          "font-medium tracking-tight transition-colors duration-300",
                          isSelected || isHovered ? "text-black" : "text-white"
                        )}>
                          {mode.title}
                        </p>
                        <p style={{ fontFamily: "'Geist', sans-serif" }} className={cn(
                          "text-xs transition-colors duration-300",
                          isSelected || isHovered ? "text-black/50" : "text-white/40"
                        )}>
                          {mode.subtitle}
                        </p>
                      </div>

                      {/* Arrow indicator */}
                      <ArrowRight className={cn(
                        "w-4 h-4 transition-all duration-300",
                        isSelected || isHovered
                          ? "text-black opacity-100 translate-x-0"
                          : "text-white opacity-0 -translate-x-2"
                      )} />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Legends Section */}
            {!legendsLoading && legends.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className={cn(
                  "mb-8 border overflow-hidden transition-all duration-500",
                  playAsLegend
                    ? "border-white bg-white/5"
                    : "border-white/10"
                )}
              >
                {/* Toggle */}
                <button
                  onClick={() => {
                    setPlayAsLegend(!playAsLegend);
                    if (playAsLegend) setSelectedHero(null);
                  }}
                  className="w-full p-5 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 border flex items-center justify-center transition-all duration-300",
                      playAsLegend ? "border-white bg-white" : "border-white/20"
                    )}>
                      <Crown className={cn(
                        "w-4 h-4 transition-colors",
                        playAsLegend ? "text-black" : "text-white/60"
                      )} strokeWidth={1.5} />
                    </div>
                    <div className="text-left">
                      <p style={{ fontFamily: "'Geist', sans-serif" }} className={cn(
                        "font-medium tracking-tight transition-colors",
                        playAsLegend ? "text-white" : "text-white/80"
                      )}>
                        Play as Legend
                      </p>
                      <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-xs text-white/40 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Master iconic positions
                      </p>
                    </div>
                  </div>

                  {/* Minimal toggle */}
                  <div className={cn(
                    "w-10 h-5 border relative overflow-hidden transition-colors duration-300 flex-shrink-0",
                    playAsLegend ? "border-white bg-white" : "border-white/30"
                  )}>
                    <motion.div
                      className={cn(
                        "absolute top-0 w-1/2 h-full transition-colors duration-300",
                        playAsLegend ? "bg-black" : "bg-white/50"
                      )}
                      animate={{ left: playAsLegend ? "50%" : "0%" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </button>

                {/* Expandable legends */}
                <AnimatePresence>
                  {playAsLegend && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-5 pb-5 border-t border-white/10">
                        <div className="pt-4 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {legends.map((legend, index) => (
                            <motion.button
                              key={legend.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => setSelectedHero(legend.id)}
                              className={cn(
                                "p-3 border text-left transition-all duration-300",
                                selectedHero === legend.id
                                  ? "border-white bg-white"
                                  : "border-white/10 hover:border-white/30"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                {legend.profilePhotoUrl ? (
                                  <Image
                                    src={legend.profilePhotoUrl}
                                    alt={legend.name}
                                    width={32}
                                    height={32}
                                    className={cn(
                                      "w-8 h-8 object-cover grayscale transition-all",
                                      selectedHero === legend.id ? "grayscale-0" : "opacity-70"
                                    )}
                                  />
                                ) : (
                                  <div className={cn(
                                    "w-8 h-8 flex items-center justify-center text-xs font-medium border",
                                    selectedHero === legend.id
                                      ? "bg-black text-white border-black"
                                      : "bg-white/5 text-white/60 border-white/20"
                                  )}>
                                    {legend.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p style={{ fontFamily: "'Geist', sans-serif" }} className={cn(
                                    "text-xs font-medium truncate transition-colors",
                                    selectedHero === legend.id ? "text-black" : "text-white/80"
                                  )}>
                                    {legend.name}
                                  </p>
                                  <p className={cn(
                                    "text-[10px] truncate transition-colors",
                                    selectedHero === legend.id ? "text-black/50" : "text-white/40"
                                  )}>
                                    {legend.era}
                                  </p>
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Time Control */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-3">
                <span style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/40 text-[10px] tracking-[0.3em] uppercase">
                  Time Control
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <TimeControlSelector value={timeControl} onChange={setTimeControl} />
            </motion.div>

            {/* Start Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              onClick={handleCreateGame}
              disabled={isCreatingGame}
              className={cn(
                "w-full group relative overflow-hidden transition-all duration-300",
                "bg-white text-black",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {/* Invert animation on hover */}
              <motion.div
                className="absolute inset-0 bg-black origin-bottom"
                initial={{ scaleY: 0 }}
                whileHover={{ scaleY: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />

              <div className="relative py-4 px-6 flex items-center justify-center gap-3">
                {isCreatingGame ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-black/30 border-t-black group-hover:border-white/30 group-hover:border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span style={{ fontFamily: "'Geist', sans-serif" }} className="font-semibold text-sm tracking-wide group-hover:text-white transition-colors">
                      {selectedMode === "quick" ? "FINDING OPPONENT" : "CREATING GAME"}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontFamily: "'Geist', sans-serif" }} className="font-semibold text-sm tracking-[0.1em] group-hover:text-white transition-colors">
                      {selectedMode === "quick" ? "FIND MATCH" : "START GAME"}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </div>
            </motion.button>

            {/* Online Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 flex items-center justify-center"
            >
              <div className="flex items-center gap-6 text-white/30">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                  </span>
                  <span style={{ fontFamily: "'Geist', sans-serif" }} className="text-[11px] tracking-wide">
                    12,453 online
                  </span>
                </div>
                <div className="w-px h-3 bg-white/20" />
                <span style={{ fontFamily: "'Geist', sans-serif" }} className="text-[11px] tracking-wide">
                  847 games
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - Chess Board */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative">
          {/* Subtle light source effect */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl relative"
          >
            {/* Board frame */}
            <div className="relative">
              {/* Outer frame */}
              <div className="absolute -inset-4 border border-white/10" />
              <div className="absolute -inset-8 border border-white/5" />

              {/* Board */}
              <div className="relative border border-white/20 shadow-2xl shadow-black/80">
                <ChessBoard />
              </div>
            </div>

            {/* Caption */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-12 text-center"
            >
              <p
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="text-white/30 text-sm italic"
              >
                &ldquo;In chess, as in life, forethought wins.&rdquo;
              </p>
              <p style={{ fontFamily: "'Geist', sans-serif" }} className="text-white/20 text-[10px] tracking-[0.2em] uppercase mt-2">
                Charles Buxton
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-20 left-6 w-16 h-16 border-l border-t border-white/10" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-r border-b border-white/10" />
      </div>
    </>
  );
}
