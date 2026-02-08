"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  opacity: number;
  shape: "square" | "line" | "dot";
}

interface VictoryConfettiProps {
  isActive: boolean;
}

export const VictoryConfetti = ({ isActive }: VictoryConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!isActive) {
      setPieces([]);
      return;
    }

    // Generate elegant, sparse confetti pieces
    const newPieces: ConfettiPiece[] = [];
    const pieceCount = 40; // Sparse, not overwhelming

    for (let i = 0; i < pieceCount; i++) {
      const shapes: ("square" | "line" | "dot")[] = ["square", "line", "dot"];
      newPieces.push({
        id: i,
        x: Math.random() * 100, // percentage across screen
        delay: Math.random() * 1.5,
        duration: 3 + Math.random() * 2,
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360,
        opacity: 0.3 + Math.random() * 0.5,
        shape: shapes[Math.floor(Math.random() * shapes.length)]!,
      });
    }

    setPieces(newPieces);
  }, [isActive]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: `${piece.x}vw`,
            y: -20,
            rotate: piece.rotation,
            opacity: 0,
          }}
          animate={{
            y: "110vh",
            rotate: piece.rotation + 360,
            opacity: [0, piece.opacity, piece.opacity, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "linear",
          }}
          className="absolute"
          style={{
            width: piece.shape === "line" ? 2 : piece.size,
            height: piece.shape === "dot" ? piece.size : piece.shape === "line" ? piece.size * 2 : piece.size,
            backgroundColor: piece.shape === "dot" ? "transparent" : "white",
            borderRadius: piece.shape === "dot" ? "50%" : piece.shape === "line" ? 1 : 0,
            border: piece.shape === "dot" ? "1px solid rgba(255,255,255,0.6)" : "none",
            boxShadow: "0 0 10px rgba(255,255,255,0.3)",
          }}
        />
      ))}

      {/* Subtle glow pulse at the center */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.15, 0], scale: [0.8, 1.5, 2] }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
        }}
      />
    </div>
  );
};

interface DefeatOverlayProps {
  isActive: boolean;
}

export const DefeatOverlay = ({ isActive }: DefeatOverlayProps) => {
  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Top-to-bottom decay sweep */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-30 pointer-events-none origin-top"
            style={{
              background: `linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0.6) 0%,
                rgba(15, 15, 15, 0.5) 30%,
                rgba(20, 20, 20, 0.4) 60%,
                rgba(10, 10, 10, 0.3) 100%
              )`,
            }}
          />

          {/* Grayscale/desaturation filter overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              backdropFilter: "saturate(0.3) brightness(0.85)",
              WebkitBackdropFilter: "saturate(0.3) brightness(0.85)",
            }}
          />

          {/* Subtle scan lines for "skeleton" effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.08 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute inset-0 z-40 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.5) 2px,
                rgba(0, 0, 0, 0.5) 4px
              )`,
            }}
          />

          {/* Vignette effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="absolute inset-0 z-35 pointer-events-none"
            style={{
              background: `radial-gradient(
                ellipse at center,
                transparent 30%,
                rgba(0, 0, 0, 0.4) 100%
              )`,
            }}
          />

          {/* Falling ash particles */}
          <AshParticles />
        </>
      )}
    </AnimatePresence>
  );
};

const AshParticles = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 3,
      size: 2 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 30,
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-45 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: `${particle.x}%`,
            y: "-5%",
            opacity: 0,
          }}
          animate={{
            x: `${particle.x + particle.drift}%`,
            y: "105%",
            opacity: [0, 0.4, 0.3, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "linear",
            repeat: Infinity,
          }}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: "rgba(100, 100, 100, 0.6)",
            filter: "blur(0.5px)",
          }}
        />
      ))}
    </div>
  );
};

// Draw result indicator (for draw games)
interface DrawOverlayProps {
  isActive: boolean;
}

export const DrawOverlay = ({ isActive }: DrawOverlayProps) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: `linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.05) 0%,
              rgba(0, 0, 0, 0.1) 50%,
              rgba(255, 255, 255, 0.05) 100%
            )`,
          }}
        >
          {/* Balanced scale-like pattern */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-[1px] bg-white/20"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Game End Overlay with Analysis Button (for analysis page)
interface GameEndOverlayProps {
  isActive: boolean;
  result: "victory" | "defeat" | "draw";
  onAnalysisClick: () => void;
  onBackClick?: () => void;
  onDismiss: () => void;
  analysisLabel?: string;
}

export const GameEndOverlay = ({
  isActive,
  result,
  onAnalysisClick,
  onBackClick,
  onDismiss,
  analysisLabel = "Compare",
}: GameEndOverlayProps) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Show button after animation delay (2.5 seconds)
      const timer = setTimeout(() => {
        setShowButton(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setShowButton(false);
    }
  }, [isActive, result]);

  const getResultText = () => {
    switch (result) {
      case "victory":
        return "Victory";
      case "defeat":
        return "Defeat";
      case "draw":
        return "Draw";
      default:
        return "Game Over";
    }
  };

  const getResultColor = () => {
    switch (result) {
      case "victory":
        return "text-white";
      case "defeat":
        return "text-white/60";
      case "draw":
        return "text-white/80";
      default:
        return "text-white";
    }
  };

  const handleDismiss = () => {
    setShowButton(false);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {isActive && showButton && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col items-center gap-6 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Result text */}
            <div className="text-center">
              <h2
                className={`text-4xl md:text-5xl tracking-[0.15em] ${getResultColor()}`}
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {getResultText()}
              </h2>
            </div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={onAnalysisClick}
                className="group relative px-8 py-3 bg-white text-black hover:bg-white/90 transition-all duration-300"
              >
                <span
                  className="text-sm uppercase tracking-[0.2em]"
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  {analysisLabel}
                </span>
              </button>
              <button
                onClick={onBackClick || onDismiss}
                className="group relative px-8 py-3 border border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50 transition-all duration-300"
              >
                <span
                  className="text-sm uppercase tracking-[0.2em] text-white/80 group-hover:text-white"
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  Back
                </span>
              </button>
            </motion.div>

            {/* Skip text */}
            <p
              className="text-white/30 text-xs"
              style={{ fontFamily: "'Geist', sans-serif" }}
            >
              Click anywhere to dismiss
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
