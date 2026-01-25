"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type PlayerColor = "white" | "black" | "random";

type ColorSelectorProps = {
  value: PlayerColor;
  onChange: (value: PlayerColor) => void;
};

const colorOptions: Array<{
  value: PlayerColor;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "white",
    label: "White",
    icon: (
      <svg viewBox="0 0 45 45" width="32" height="32">
        <g
          fill="#fff"
          fillRule="evenodd"
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
          <path
            d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
            fill="#fff"
            strokeLinecap="butt"
            strokeLinejoin="miter"
          />
          <path
            d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"
            fill="#fff"
          />
          <path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0" />
        </g>
      </svg>
    ),
  },
  {
    value: "black",
    label: "Black",
    icon: (
      <svg viewBox="0 0 45 45" width="32" height="32">
        <g
          fill="none"
          fillRule="evenodd"
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <path d="M22.5 11.63V6" strokeLinejoin="miter" />
          <path
            d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
            fill="#000"
            strokeLinecap="butt"
            strokeLinejoin="miter"
          />
          <path
            d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"
            fill="#000"
          />
          <path
            d="M20 8h5"
            stroke="#000"
            strokeLinejoin="miter"
          />
          <path
            d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0"
            stroke="#fff"
          />
        </g>
      </svg>
    ),
  },
  {
    value: "random",
    label: "Random",
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </svg>
    ),
  },
];

export default function ColorSelector({ value, onChange }: ColorSelectorProps) {
  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Play As
      </label>
      <div className="grid grid-cols-3 gap-2">
        {colorOptions.map((option) => (
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
            <span className={cn(
              "mb-2",
              option.value === "random" && value !== option.value && "text-gray-400"
            )}>
              {option.icon}
            </span>
            <span className="font-medium text-sm">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
