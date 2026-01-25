"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Difficulty, DIFFICULTY_OPTIONS } from "@/lib/hooks/useBotMove";

type DifficultySelectorProps = {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
};

export default function DifficultySelector({
  value,
  onChange,
}: DifficultySelectorProps) {
  return (
    <div className="w-full">
      <label
        style={{ fontFamily: "'Geist', sans-serif" }}
        className="block text-xs text-white/40 uppercase tracking-widest mb-4"
      >
        Bot Difficulty
      </label>
      <div className="grid grid-cols-2 gap-3">
        {DIFFICULTY_OPTIONS.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "group relative flex flex-col items-center justify-center p-5 border transition-all duration-300 overflow-hidden",
              value === option.value
                ? "bg-white text-black border-white"
                : "bg-transparent text-white/60 border-white/10 hover:border-white/30"
            )}
          >
            {/* Hover fill effect for unselected */}
            {value !== option.value && (
              <span className="absolute inset-0 bg-white origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
            )}

            <span
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className={cn(
                "relative z-10 text-xl transition-colors duration-300",
                value === option.value
                  ? "text-black"
                  : "text-white group-hover:text-black"
              )}
            >
              {option.label}
            </span>

            <span
              style={{ fontFamily: "'Geist', sans-serif" }}
              className={cn(
                "relative z-10 text-xs mt-1 transition-colors duration-300",
                value === option.value
                  ? "text-black/50"
                  : "text-white/30 group-hover:text-black/50"
              )}
            >
              ~{option.elo} ELO
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
