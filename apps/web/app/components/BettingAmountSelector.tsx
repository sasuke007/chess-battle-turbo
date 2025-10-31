"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Coins } from "lucide-react";

const presetAmounts = [50, 100, 200, 500];

type BettingAmountSelectorProps = {
  amount: number;
  onChange: (amount: number) => void;
};

export default function BettingAmountSelector({ amount, onChange }: BettingAmountSelectorProps) {
  const [customAmount, setCustomAmount] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePresetClick = (value: number) => {
    onChange(value);
    setCustomAmount("");
    setIsExpanded(false);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setCustomAmount(value);
      if (value !== "") {
        onChange(parseInt(value));
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800">
      {/* Selected Amount Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-neutral-900 hover:bg-neutral-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-white">
          <Coins className="text-white" size={20} />
          <span className="font-semibold text-lg">{amount} Coins</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-gray-400" size={20} />
        ) : (
          <ChevronDown className="text-gray-400" size={20} />
        )}
      </button>

      {/* Expandable Betting Options */}
      {isExpanded && (
        <div className="border-t border-neutral-800 p-4">
          {/* Preset Amounts */}
          <div className="mb-4">
            <h4 className="text-sm text-gray-400 mb-3 font-medium">
              Quick Select
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    "px-4 py-3 rounded text-sm font-medium transition-colors",
                    amount === preset && customAmount === ""
                      ? "bg-white text-black"
                      : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                  )}
                >
                  {preset} Coins
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <h4 className="text-sm text-gray-400 mb-2 font-medium">
              Custom Amount
            </h4>
            <div className="relative">
              <input
                type="text"
                value={customAmount}
                onChange={handleCustomInputChange}
                placeholder="Enter amount..."
                className="w-full px-4 py-3 bg-neutral-800 text-white rounded border border-neutral-700 focus:border-white focus:outline-none transition-colors placeholder:text-gray-500"
              />
              <Coins
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
            </div>
            {customAmount && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="w-full mt-3 px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-200 transition-colors"
              >
                Set {customAmount} Coins
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

