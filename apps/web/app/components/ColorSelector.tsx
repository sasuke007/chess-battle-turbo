"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

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
      <svg viewBox="0 0 45 45" width="36" height="36">
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
      <svg viewBox="0 0 45 45" width="36" height="36">
        <g
          fill="none"
          fillRule="evenodd"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <path d="M22.5 11.63V6" strokeLinejoin="miter" />
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
          <path
            d="M20 8h5"
            stroke="#fff"
            strokeLinejoin="miter"
          />
          <path
            d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0"
            stroke="#000"
          />
        </g>
      </svg>
    ),
  },
  {
    value: "random",
    label: "Random",
    icon: (
      <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </svg>
    ),
  },
];

export default function ColorSelector({ value, onChange }: ColorSelectorProps) {
  return (
    <div className="w-full">
      <label
        style={{ fontFamily: "'Geist', sans-serif" }}
        className="block text-xs text-white/40 uppercase tracking-widest mb-4"
      >
        Play As
      </label>
      <div className="grid grid-cols-3 gap-3">
        {colorOptions.map((option, index) => (
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

            <span className={cn(
              "relative z-10 mb-3 transition-colors duration-300",
              value === option.value
                ? "text-black"
                : "text-white/60 group-hover:text-black"
            )}>
              {option.value === "white" && (
                <svg viewBox="0 0 45 45" width="36" height="36">
                  <g
                    fill={value === option.value ? "#000" : "currentColor"}
                    fillRule="evenodd"
                    stroke={value === option.value ? "#000" : "currentColor"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    className="group-hover:fill-black group-hover:stroke-black transition-colors"
                  >
                    <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
                    <path
                      d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
                      strokeLinecap="butt"
                      strokeLinejoin="miter"
                    />
                    <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7" />
                    <path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0" fill="none" />
                  </g>
                </svg>
              )}
              {option.value === "black" && (
                <svg viewBox="0 0 45 45" width="36" height="36">
                  <g
                    fill={value === option.value ? "#000" : "currentColor"}
                    fillRule="evenodd"
                    stroke={value === option.value ? "#000" : "currentColor"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    className="group-hover:fill-black group-hover:stroke-black transition-colors"
                  >
                    <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
                    <path
                      d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
                      strokeLinecap="butt"
                      strokeLinejoin="miter"
                    />
                    <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7" />
                    <path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0" fill="none" />
                  </g>
                </svg>
              )}
              {option.value === "random" && (
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:stroke-black transition-colors">
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                </svg>
              )}
            </span>

            <span
              style={{ fontFamily: "'Geist', sans-serif" }}
              className={cn(
                "relative z-10 text-sm font-medium transition-colors duration-300",
                value === option.value
                  ? "text-black"
                  : "text-white/60 group-hover:text-black"
              )}
            >
              {option.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
