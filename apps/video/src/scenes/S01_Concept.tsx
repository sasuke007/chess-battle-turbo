import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  OffthreadVideo,
  staticFile,
} from "remotion";
import { COLORS, SPRING_CONFIGS } from "../constants";
import { GridBackground } from "../components/shared";
import { instrumentSerif, geist } from "../fonts";

const PIECES = ["♚", "♛", "♜", "♝", "♞"];

export const S01_Concept: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gridOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Main headline
  const headlineProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 8,
  });
  const headlineY = interpolate(headlineProgress, [0, 1], [30, 0]);

  // Horizontal line
  const lineProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 25,
  });

  // Sub-headline
  const subProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 35,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Video background */}
      <OffthreadVideo
        src={staticFile("Kings_Gambit_Chess_Board_Animation.mp4")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: interpolate(frame, [0, 20], [0, 0.18], {
            extrapolateRight: "clamp",
          }),
          filter: "grayscale(100%)",
        }}
        muted
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.5) 25%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.95))",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.4))",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {/* Chess pieces row */}
        <div style={{ display: "flex", gap: 20, marginBottom: 8 }}>
          {PIECES.map((piece, i) => {
            const pieceProgress = spring({
              frame,
              fps,
              config: SPRING_CONFIGS.bouncy,
              delay: 50 + i * 8,
            });
            return (
              <div
                key={i}
                style={{
                  fontSize: 36,
                  opacity: pieceProgress * 0.4,
                  transform: `translateY(${interpolate(pieceProgress, [0, 1], [15, 0])}px) scale(${interpolate(pieceProgress, [0, 1], [0.6, 1])})`,
                }}
              >
                {piece}
              </div>
            );
          })}
        </div>

        {/* Main headline */}
        <div
          style={{
            fontFamily: instrumentSerif,
            fontSize: 80,
            color: COLORS.text,
            opacity: headlineProgress,
            transform: `translateY(${headlineY}px)`,
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 1200,
          }}
        >
          Play Legendary Chess{" "}
          <span style={{ fontStyle: "italic", color: COLORS.amber }}>
            Positions
          </span>
        </div>

        {/* Horizontal line */}
        <div
          style={{
            width: `${lineProgress * 300}px`,
            height: 1,
            backgroundColor: COLORS.borderLight,
          }}
        />

        {/* Sub-headline */}
        <div
          style={{
            fontFamily: geist,
            fontSize: 22,
            color: COLORS.textSecondary,
            opacity: subProgress,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            transform: `translateY(${interpolate(subProgress, [0, 1], [12, 0])}px)`,
          }}
        >
          Relive the greatest moments in chess history
        </div>
      </div>
    </AbsoluteFill>
  );
};
