"use client";

import React from "react";
import { cn } from "@/lib/utils";
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
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Bot Difficulty
      </label>
      <div className="grid grid-cols-2 gap-2">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-lg border transition-all",
              value === option.value
                ? "bg-white text-black border-white"
                : "bg-neutral-900 text-gray-300 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700"
            )}
          >
            <span className="font-semibold text-lg">{option.label}</span>
            <span
              className={cn(
                "text-xs mt-1",
                value === option.value ? "text-gray-600" : "text-gray-500"
              )}
            >
              ~{option.elo} ELO
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
