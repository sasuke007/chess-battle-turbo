import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  OffthreadVideo,
  staticFile,
} from "remotion";
import { COLORS, SPRING_CONFIGS, ANALYSIS_MOVES, BRILLIANCE_BOARD, PIECE_UNICODE } from "../constants";
import { instrumentSerif, geist, geistMono } from "../fonts";

const SMALL_SQUARE = 62;

export const S04_Analysis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Video background
  const videoBgOpacity = interpolate(frame, [0, 15], [0, 0.18], {
    extrapolateRight: "clamp",
  });

  // Board entrance
  const boardProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 5,
  });

  // Header text
  const headerProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 0,
  });

  // Move list header
  const moveListHeaderProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 20,
  });

  // Match rate counter
  const matchRateStart = 55;
  const matchRateValue = interpolate(
    frame,
    [matchRateStart, matchRateStart + 40],
    [0, 87],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }
  );

  // Stats panel
  const statsProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
    delay: 50,
  });

  // Bottom text
  const bottomProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 75,
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

      {/* Full-height centered layout */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            opacity: headerProgress,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontFamily: geist,
              fontSize: 14,
              color: COLORS.amber,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Post-Game Analysis
          </div>
          <div
            style={{
              fontFamily: instrumentSerif,
              fontSize: 56,
              color: COLORS.text,
            }}
          >
            Understand How{" "}
            <span style={{ fontStyle: "italic", color: COLORS.sky }}>
              Legends
            </span>{" "}
            Think
          </div>
        </div>

        {/* Main content row — centered */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 50,
          }}
        >
          {/* Left: Chess board */}
          <div
            style={{
              opacity: boardProgress,
              transform: `scale(${interpolate(boardProgress, [0, 1], [0.95, 1])})`,
            }}
          >
            <div
              style={{
                width: SMALL_SQUARE * 8,
                height: SMALL_SQUARE * 8,
                position: "relative",
              }}
            >
              {/* Dark backing for contrast */}
              <div
                style={{
                  position: "absolute",
                  inset: -12,
                  backgroundColor: "rgba(0,0,0,0.95)",
                  border: `1px solid rgba(255,255,255,0.2)`,
                }}
              />
              {Array.from({ length: 8 }).map((_, row) =>
                Array.from({ length: 8 }).map((_, col) => {
                  const isLight = (row + col) % 2 === 0;
                  return (
                    <div
                      key={`sq-${row}-${col}`}
                      style={{
                        position: "absolute",
                        top: row * SMALL_SQUARE,
                        left: col * SMALL_SQUARE,
                        width: SMALL_SQUARE,
                        height: SMALL_SQUARE,
                        backgroundColor: isLight
                          ? "rgba(255,255,255,0.35)"
                          : "rgba(255,255,255,0.12)",
                      }}
                    />
                  );
                })
              )}
              {BRILLIANCE_BOARD.map((row, rowIdx) =>
                row.map((piece, colIdx) => {
                  if (!piece) return null;
                  return (
                    <div
                      key={`p-${rowIdx}-${colIdx}`}
                      style={{
                        position: "absolute",
                        top: rowIdx * SMALL_SQUARE,
                        left: colIdx * SMALL_SQUARE,
                        width: SMALL_SQUARE,
                        height: SMALL_SQUARE,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 38,
                        pointerEvents: "none",
                      }}
                    >
                      {PIECE_UNICODE[piece]}
                    </div>
                  );
                })
              )}
            </div>

            {/* Legend badge under board */}
            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: boardProgress,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: COLORS.sky,
                  opacity: 0.6,
                }}
              />
              <span
                style={{
                  fontFamily: geist,
                  fontSize: 14,
                  color: COLORS.textSecondary,
                }}
              >
                Fischer vs Byrne, 1956
              </span>
            </div>
          </div>

          {/* Center: Move comparison list */}
          <div style={{ width: 380 }}>
            {/* Column headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "50px 1fr 1fr",
                gap: 0,
                padding: "12px 16px",
                borderBottom: `1px solid ${COLORS.border}`,
                opacity: moveListHeaderProgress,
              }}
            >
              <div
                style={{
                  fontFamily: geist,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                #
              </div>
              <div
                style={{
                  fontFamily: geist,
                  fontSize: 12,
                  color: COLORS.text,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  opacity: 0.7,
                }}
              >
                Your Move
              </div>
              <div
                style={{
                  fontFamily: geist,
                  fontSize: 12,
                  color: COLORS.sky,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  opacity: 0.7,
                }}
              >
                Legend&apos;s Move
              </div>
            </div>

            {/* Move rows */}
            {ANALYSIS_MOVES.map((move, i) => {
              const delay = 25 + i * 6;
              const rowProgress = spring({
                frame,
                fps,
                config: SPRING_CONFIGS.snappy,
                delay,
              });

              return (
                <div
                  key={move.num}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "50px 1fr 1fr",
                    gap: 0,
                    padding: "14px 16px",
                    borderBottom: `1px solid ${COLORS.border}`,
                    opacity: rowProgress,
                    transform: `translateX(${interpolate(rowProgress, [0, 1], [20, 0])}px)`,
                    backgroundColor: move.divergent
                      ? `rgba(245,158,11,${0.06 * rowProgress})`
                      : "transparent",
                  }}
                >
                  {/* Move number */}
                  <div
                    style={{
                      fontFamily: geistMono,
                      fontSize: 16,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {move.num}.
                  </div>

                  {/* Your move */}
                  <div
                    style={{
                      fontFamily: geistMono,
                      fontSize: 18,
                      color: COLORS.text,
                      opacity: move.divergent ? 0.7 : 1,
                    }}
                  >
                    {move.you}
                  </div>

                  {/* Legend's move */}
                  <div
                    style={{
                      fontFamily: geistMono,
                      fontSize: 18,
                      color: move.divergent ? COLORS.amber : COLORS.sky,
                      fontWeight: move.divergent ? 600 : 400,
                    }}
                  >
                    {move.legend}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Stats panel */}
          <div
            style={{
              width: 260,
              opacity: statsProgress,
              transform: `translateY(${interpolate(statsProgress, [0, 1], [20, 0])}px)`,
            }}
          >
            {/* Match Rate — the hero stat */}
            <div
              style={{
                border: `1px solid ${COLORS.border}`,
                padding: 36,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: geist,
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                Match Rate
              </div>
              <div
                style={{
                  fontFamily: instrumentSerif,
                  fontSize: 80,
                  color: COLORS.green,
                  lineHeight: 1,
                }}
              >
                {Math.round(matchRateValue)}%
              </div>
            </div>

            {/* Sub stats */}
            <div
              style={{
                border: `1px solid ${COLORS.border}`,
                padding: "22px 26px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: geist,
                    fontSize: 14,
                    color: COLORS.textSecondary,
                  }}
                >
                  Total Moves
                </span>
                <span
                  style={{
                    fontFamily: geistMono,
                    fontSize: 16,
                    color: COLORS.green,
                  }}
                >
                  23
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontFamily: geist,
                    fontSize: 14,
                    color: COLORS.textSecondary,
                  }}
                >
                  Divergent
                </span>
                <span
                  style={{
                    fontFamily: geistMono,
                    fontSize: 16,
                    color: COLORS.amber,
                  }}
                >
                  3
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            marginTop: 40,
            textAlign: "center",
            opacity: bottomProgress,
            transform: `translateY(${interpolate(bottomProgress, [0, 1], [10, 0])}px)`,
          }}
        >
          <span
            style={{
              fontFamily: instrumentSerif,
              fontSize: 30,
              color: COLORS.textSecondary,
              fontStyle: "italic",
            }}
          >
            Compare every move.{" "}
            <span style={{ color: COLORS.text }}>Learn from the best.</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
