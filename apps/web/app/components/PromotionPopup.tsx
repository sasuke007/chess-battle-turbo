"use client";

import { AnimatePresence, LazyMotion, domAnimation } from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import { Color } from "chess.js";

type PromotionPiece = "q" | "r" | "b" | "n";

interface PromotionPopupProps {
  isOpen: boolean;
  color: Color;
  onSelect: (piece: PromotionPiece) => void;
}

const PROMOTION_PIECES: { piece: PromotionPiece; name: string }[] = [
  { piece: "q", name: "Queen" },
  { piece: "r", name: "Rook" },
  { piece: "b", name: "Bishop" },
  { piece: "n", name: "Knight" },
];

export const PromotionPopup = ({ isOpen, color, onSelect }: PromotionPopupProps) => {
  return (
    <LazyMotion features={domAnimation}>
    <AnimatePresence>
      {isOpen && (
        <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <m.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black border border-white/10 p-6 pointer-events-auto">
              {/* Header */}
              <h2
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="text-white text-xl text-center mb-4"
              >
                Promote Pawn
              </h2>

              {/* Piece options */}
              <div className="grid grid-cols-4 gap-3">
                {PROMOTION_PIECES.map(({ piece, name }) => (
                  <m.button
                    key={piece}
                    onClick={() => onSelect(piece)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2 p-3 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16">
                      <Image
                        src={`/chess-icons/${color}${piece}.png`}
                        alt={`${color === "w" ? "White" : "Black"} ${name}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                        draggable={false}
                      />
                    </div>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/60 text-xs uppercase tracking-wider"
                    >
                      {name}
                    </span>
                  </m.button>
                ))}
              </div>

              {/* Helper text */}
              <p
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-white/30 text-xs text-center mt-4"
              >
                Select a piece to promote your pawn
              </p>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
    </LazyMotion>
  );
};
