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
import { COLORS, SPRING_CONFIGS, GAME_MODES } from "../constants";
import { instrumentSerif, geist } from "../fonts";

export const S02_AppIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Video background fade in
  const videoBgOpacity = interpolate(frame, [0, 30], [0, 0.18], {
    extrapolateRight: "clamp",
  });

  // "Replay Chess" title — the hero moment
  const titleProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.bouncy,
    delay: 25,
  });
  const titleScale = interpolate(titleProgress, [0, 1], [0.7, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [50, 0]);

  // Tagline
  const taglineProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 50,
  });

  // Horizontal divider
  const lineProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 60,
  });

  // "Game Modes" label
  const modesLabelProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 75,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Video background — matching app's hero treatment */}
      <OffthreadVideo
        src={staticFile("Kings_Gambit_Chess_Board_Animation.mp4")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: videoBgOpacity,
          filter: "grayscale(100%)",
        }}
        muted
      />

      {/* Gradient overlays — exact match to app's Hero.tsx */}
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

      {/* Main content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Top section — title area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 140,
            gap: 16,
          }}
        >
          {/* Chess king icon */}
          <div
            style={{
              fontSize: 48,
              opacity: titleProgress * 0.6,
              transform: `scale(${titleScale})`,
            }}
          >
            ♚
          </div>

          {/* "Replay Chess" — the grand moment */}
          <div
            style={{
              fontFamily: instrumentSerif,
              fontSize: 130,
              color: COLORS.text,
              opacity: titleProgress,
              transform: `translateY(${titleY}px) scale(${titleScale})`,
              letterSpacing: "0.04em",
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            Replay Chess
          </div>

          {/* Tagline */}
          <div
            style={{
              fontFamily: geist,
              fontSize: 20,
              color: COLORS.textSecondary,
              opacity: taglineProgress,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              transform: `translateY(${interpolate(taglineProgress, [0, 1], [10, 0])}px)`,
            }}
          >
            Play the Legends. Be the Legend.
          </div>
        </div>

        {/* Divider line */}
        <div
          style={{
            width: `${lineProgress * 600}px`,
            height: 1,
            backgroundColor: COLORS.borderLight,
            marginTop: 48,
          }}
        />

        {/* Game modes section */}
        <div
          style={{
            marginTop: 40,
            opacity: modesLabelProgress,
            transform: `translateY(${interpolate(modesLabelProgress, [0, 1], [10, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: geist,
              fontSize: 13,
              color: COLORS.amber,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            Choose Your Way to Play
          </div>
        </div>

        {/* Mode cards — horizontal row */}
        <div
          style={{
            display: "flex",
            gap: 16,
            paddingLeft: 80,
            paddingRight: 80,
          }}
        >
          {GAME_MODES.map((mode, i) => {
            const delay = 85 + i * 18;
            const cardProgress = spring({
              frame,
              fps,
              config: SPRING_CONFIGS.snappy,
              delay,
            });
            const cardY = interpolate(cardProgress, [0, 1], [30, 0]);

            return (
              <div
                key={mode.title}
                style={{
                  flex: 1,
                  opacity: cardProgress,
                  transform: `translateY(${cardY}px)`,
                  border: `1px solid rgba(255,255,255,${0.08 * cardProgress})`,
                  padding: "28px 24px",
                  textAlign: "center",
                  backgroundColor: `rgba(255,255,255,${0.02 * cardProgress})`,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    fontSize: 32,
                    marginBottom: 14,
                    opacity: 0.6,
                  }}
                >
                  {mode.icon}
                </div>

                {/* Title */}
                <div
                  style={{
                    fontFamily: instrumentSerif,
                    fontSize: 22,
                    color: COLORS.text,
                    marginBottom: 8,
                  }}
                >
                  {mode.title}
                </div>

                {/* Description */}
                <div
                  style={{
                    fontFamily: geist,
                    fontSize: 13,
                    color: COLORS.textSecondary,
                    lineHeight: 1.4,
                  }}
                >
                  {mode.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
