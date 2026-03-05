import type React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  OffthreadVideo,
} from "remotion";
import { COLORS, SPRING_CONFIGS } from "../constants";
import { DecorativeCorners } from "../components/shared";
import { instrumentSerif, geist, geistMono } from "../fonts";

export const S05_Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Video background
  const videoBgOpacity = interpolate(frame, [0, 20], [0, 0.18], {
    extrapolateRight: "clamp",
  });

  // Logo entrance
  const logoProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.bouncy,
    delay: 8,
  });
  const logoScale = interpolate(logoProgress, [0, 1], [0.5, 1]);

  // Brand name
  const nameProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 22,
  });

  // Line
  const lineProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 35,
  });

  // URL
  const urlProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
    delay: 45,
  });

  // CTA
  const ctaProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
    delay: 60,
  });

  // Corners
  const cornerProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 55,
  });

  // Subtle ambient glow
  const glowOpacity = interpolate(
    frame,
    [70, 95, 120, 150],
    [0, 0.1, 0.06, 0.08],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

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
          opacity: videoBgOpacity,
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

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 500,
          height: 500,
          transform: "translate(-50%, -55%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(245,158,11,${glowOpacity}) 0%, transparent 70%)`,
          pointerEvents: "none",
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
          justifyContent: "center",
          gap: 16,
        }}
      >
        {/* Logo */}
        <div
          style={{
            opacity: logoProgress,
            transform: `scale(${logoScale})`,
            marginBottom: 8,
          }}
        >
          <Img
            src={staticFile("chess-logo-bnw.png")}
            style={{
              width: 120,
              height: 120,
              objectFit: "contain",
            }}
          />
        </div>

        {/* Brand name */}
        <div
          style={{
            fontFamily: instrumentSerif,
            fontSize: 96,
            color: COLORS.text,
            opacity: nameProgress,
            transform: `translateY(${interpolate(nameProgress, [0, 1], [25, 0])}px)`,
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          Replay Chess
        </div>

        {/* Line */}
        <div
          style={{
            width: `${lineProgress * 200}px`,
            height: 1,
            backgroundColor: COLORS.borderLight,
            marginTop: 8,
            marginBottom: 8,
          }}
        />

        {/* URL */}
        <div
          style={{
            fontFamily: geistMono,
            fontSize: 26,
            color: COLORS.amber,
            opacity: urlProgress,
            transform: `translateY(${interpolate(urlProgress, [0, 1], [10, 0])}px)`,
            letterSpacing: "0.08em",
          }}
        >
          playchess.tech
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 36,
            opacity: ctaProgress,
            transform: `translateY(${interpolate(ctaProgress, [0, 1], [15, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: geist,
              fontSize: 16,
              color: COLORS.text,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              padding: "16px 48px",
              border: `1px solid ${COLORS.borderLight}`,
              backgroundColor: `rgba(255,255,255,${0.03 * ctaProgress})`,
            }}
          >
            Start Playing
          </div>
        </div>
      </div>

      <DecorativeCorners progress={cornerProgress} padding={60} size={80} />
    </AbsoluteFill>
  );
};
