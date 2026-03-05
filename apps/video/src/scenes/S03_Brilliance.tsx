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
import { COLORS, SPRING_CONFIGS, PIECE_UNICODE } from "../constants";
import { instrumentSerif, geist, geistMono } from "../fonts";

const SQUARE_SIZE = 78;
const BOARD_SIZE = SQUARE_SIZE * 8;

// Board after 1.e4 e5 2.Nf3 Nc6
const STARTING_BOARD: (string | null)[][] = [
  ["br", null, "bb", "bq", "bk", "bb", "bn", "br"],
  ["bp", "bp", "bp", "bp", null, "bp", "bp", "bp"],
  [null, null, "bn", null, null, null, null, null],
  [null, null, null, null, "bp", null, null, null],
  [null, null, null, null, "wp", null, null, null],
  [null, null, null, null, null, "wn", null, null],
  ["wp", "wp", "wp", "wp", null, "wp", "wp", "wp"],
  ["wr", "wn", "wb", "wq", "wk", "wb", null, "wr"],
];

const MOVE_DURATION = 14;
const BRILLIANCE_MOVE_DURATION = 20;

// Slower pacing — ~25 frame gaps between moves so viewers can follow
const MOVE_SEQ = [
  { from: [7, 5], to: [4, 2], start: 15, notation: "3. Bc4", brilliance: false },
  { from: [0, 6], to: [2, 5], start: 44, notation: "3... Nf6", brilliance: false },
  { from: [5, 5], to: [3, 6], start: 73, notation: "4. Ng5", brilliance: false },
  { from: [1, 3], to: [3, 3], start: 100, notation: "4... d5", brilliance: false },
  { from: [4, 4], to: [3, 3], start: 125, notation: "5. exd5", brilliance: false },
  { from: [2, 5], to: [3, 3], start: 150, notation: "5... Nxd5", brilliance: false },
  { from: [3, 6], to: [1, 5], start: 180, notation: "6. Nxf7!!", brilliance: true },
];

const MOVE_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

function computeBoardState(frame: number) {
  const board = STARTING_BOARD.map((row) => [...row]);
  let animating: {
    piece: string;
    from: number[];
    to: number[];
    progress: number;
    brilliance: boolean;
  } | null = null;

  for (const move of MOVE_SEQ) {
    const dur = move.brilliance ? BRILLIANCE_MOVE_DURATION : MOVE_DURATION;
    const endFrame = move.start + dur;

    if (frame >= endFrame) {
      board[move.to[0]][move.to[1]] = board[move.from[0]][move.from[1]];
      board[move.from[0]][move.from[1]] = null;
    } else if (frame >= move.start) {
      const raw = (frame - move.start) / dur;
      const progress = MOVE_EASING(raw);
      const piece = board[move.from[0]][move.from[1]];
      if (piece) {
        animating = {
          piece,
          from: move.from,
          to: move.to,
          progress,
          brilliance: move.brilliance,
        };
      }
      board[move.from[0]][move.from[1]] = null;
      if (raw > 0.75) {
        board[move.to[0]][move.to[1]] = null;
      }
    }
  }

  return { board, animating };
}

export const S03_Brilliance: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { board, animating } = computeBoardState(frame);

  // Board entrance
  const boardProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 3,
  });

  // Typewriter: "Experience Moments of"
  const typeText1 = "Experience Moments of";
  const type1Start = 8;
  const type1End = 90;
  const chars1 = Math.floor(
    interpolate(frame, [type1Start, type1End], [0, typeText1.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const display1 = typeText1.slice(0, chars1);

  // Typewriter: "Brilliance" (after sacrifice lands)
  const brillianceLandFrame = 180 + BRILLIANCE_MOVE_DURATION;
  const typeText2 = "Brilliance";
  const type2Start = brillianceLandFrame + 4;
  const type2End = type2Start + 25;
  const chars2 = Math.floor(
    interpolate(frame, [type2Start, type2End], [0, typeText2.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const display2 = typeText2.slice(0, chars2);

  // Cursor blink
  const showCursor =
    frame < type2End + 15 && Math.floor(frame / 8) % 2 === 0;

  // Label
  const labelProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
    delay: 2,
  });

  // Brilliance effects
  const brillFrame = brillianceLandFrame;
  const glowOpacity = interpolate(
    frame,
    [brillFrame, brillFrame + 8, brillFrame + 40, brillFrame + 55],
    [0, 0.45, 0.2, 0.15],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const ring1Expand = interpolate(
    frame,
    [brillFrame, brillFrame + 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const ring1Opacity = interpolate(
    frame,
    [brillFrame, brillFrame + 30],
    [0.8, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const ring2Expand = interpolate(
    frame,
    [brillFrame + 6, brillFrame + 36],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const ring2Opacity = interpolate(
    frame,
    [brillFrame + 6, brillFrame + 36],
    [0.6, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const exclamProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.bouncy,
    delay: brillFrame + 3,
  });

  // Move notation list
  const visibleMoves = MOVE_SEQ.filter((m) => frame >= m.start);

  // Sacrifice target square (f7 = row 1, col 5)
  const TARGET = MOVE_SEQ[MOVE_SEQ.length - 1].to;

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
          opacity: 0.18,
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

      {/* Centered content: text + board side by side */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 70,
        }}
      >
        {/* Left side: text + notation */}
        <div
          style={{
            width: 500,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Label */}
          <div
            style={{
              fontFamily: geist,
              fontSize: 13,
              color: COLORS.amber,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: 20,
              opacity: labelProgress,
            }}
          >
            The Fried Liver Attack
          </div>

          {/* Typewriter headline */}
          <div style={{ marginBottom: 6 }}>
            <span
              style={{
                fontFamily: instrumentSerif,
                fontSize: 58,
                color: COLORS.text,
                lineHeight: 1.2,
              }}
            >
              {display1}
            </span>
            {frame < type1End + 5 && frame >= type1Start && (
              <span
                style={{
                  fontFamily: instrumentSerif,
                  fontSize: 58,
                  color: COLORS.amber,
                  opacity: showCursor ? 1 : 0,
                }}
              >
                |
              </span>
            )}
          </div>
          <div>
            <span
              style={{
                fontFamily: instrumentSerif,
                fontSize: 58,
                fontStyle: "italic",
                color: COLORS.amber,
                lineHeight: 1.2,
              }}
            >
              {display2}
            </span>
            {frame >= type2Start && frame < type2End + 15 && (
              <span
                style={{
                  fontFamily: instrumentSerif,
                  fontSize: 58,
                  color: COLORS.amber,
                  opacity: showCursor ? 1 : 0,
                }}
              >
                |
              </span>
            )}
          </div>

          {/* Move notation list */}
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 5 }}>
            {visibleMoves.map((move, i) => {
              const moveAge = frame - move.start;
              const opacity = interpolate(moveAge, [0, 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const isBrilliance = move.brilliance;

              return (
                <div
                  key={i}
                  style={{
                    fontFamily: geistMono,
                    fontSize: 17,
                    color: isBrilliance ? COLORS.amber : COLORS.textSecondary,
                    opacity,
                    fontWeight: isBrilliance ? 700 : 400,
                    transform: `translateX(${interpolate(opacity, [0, 1], [10, 0])}px)`,
                    textShadow: isBrilliance
                      ? "0 0 12px rgba(245,158,11,0.4)"
                      : "none",
                  }}
                >
                  {move.notation}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side: chess board */}
        <div
          style={{
            transform: `scale(${interpolate(boardProgress, [0, 1], [0.93, 1])})`,
            opacity: boardProgress,
            position: "relative",
          }}
        >
          {/* Board background for contrast */}
          <div
            style={{
              position: "absolute",
              inset: -14,
              backgroundColor: "rgba(0,0,0,0.95)",
              border: `1px solid rgba(255,255,255,0.2)`,
            }}
          />

          <div
            style={{
              width: BOARD_SIZE,
              height: BOARD_SIZE,
              position: "relative",
            }}
          >
            {/* Squares */}
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 8 }).map((_, col) => {
                const isLight = (row + col) % 2 === 0;
                return (
                  <div
                    key={`sq-${row}-${col}`}
                    style={{
                      position: "absolute",
                      top: row * SQUARE_SIZE,
                      left: col * SQUARE_SIZE,
                      width: SQUARE_SIZE,
                      height: SQUARE_SIZE,
                      backgroundColor: isLight
                        ? "rgba(255,255,255,0.35)"
                        : "rgba(255,255,255,0.12)",
                    }}
                  />
                );
              })
            )}

            {/* Brilliance glow on target square */}
            {frame >= brillFrame && (
              <div
                style={{
                  position: "absolute",
                  top: TARGET[0] * SQUARE_SIZE,
                  left: TARGET[1] * SQUARE_SIZE,
                  width: SQUARE_SIZE,
                  height: SQUARE_SIZE,
                  backgroundColor: COLORS.amber,
                  opacity: glowOpacity,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Static pieces */}
            {board.map((row, rowIdx) =>
              row.map((piece, colIdx) => {
                if (!piece) return null;
                return (
                  <div
                    key={`p-${rowIdx}-${colIdx}-${piece}`}
                    style={{
                      position: "absolute",
                      top: rowIdx * SQUARE_SIZE,
                      left: colIdx * SQUARE_SIZE,
                      width: SQUARE_SIZE,
                      height: SQUARE_SIZE,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 48,
                      pointerEvents: "none",
                    }}
                  >
                    {PIECE_UNICODE[piece]}
                  </div>
                );
              })
            )}

            {/* Animating piece */}
            {animating && (
              <div
                style={{
                  position: "absolute",
                  top: interpolate(
                    animating.progress,
                    [0, 1],
                    [
                      animating.from[0] * SQUARE_SIZE,
                      animating.to[0] * SQUARE_SIZE,
                    ]
                  ),
                  left: interpolate(
                    animating.progress,
                    [0, 1],
                    [
                      animating.from[1] * SQUARE_SIZE,
                      animating.to[1] * SQUARE_SIZE,
                    ]
                  ),
                  width: SQUARE_SIZE,
                  height: SQUARE_SIZE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48,
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                {PIECE_UNICODE[animating.piece]}
              </div>
            )}

            {/* Brilliance expanding rings */}
            {frame >= brillFrame && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top:
                      TARGET[0] * SQUARE_SIZE +
                      SQUARE_SIZE / 2 -
                      ring1Expand * 140,
                    left:
                      TARGET[1] * SQUARE_SIZE +
                      SQUARE_SIZE / 2 -
                      ring1Expand * 140,
                    width: ring1Expand * 280,
                    height: ring1Expand * 280,
                    borderRadius: "50%",
                    border: `2px solid ${COLORS.amber}`,
                    opacity: ring1Opacity,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top:
                      TARGET[0] * SQUARE_SIZE +
                      SQUARE_SIZE / 2 -
                      ring2Expand * 100,
                    left:
                      TARGET[1] * SQUARE_SIZE +
                      SQUARE_SIZE / 2 -
                      ring2Expand * 100,
                    width: ring2Expand * 200,
                    height: ring2Expand * 200,
                    borderRadius: "50%",
                    border: `1px solid ${COLORS.amber}`,
                    opacity: ring2Opacity,
                    pointerEvents: "none",
                  }}
                />
              </>
            )}

            {/* "!!" marker */}
            <div
              style={{
                position: "absolute",
                top: TARGET[0] * SQUARE_SIZE - 44,
                left: TARGET[1] * SQUARE_SIZE + SQUARE_SIZE + 6,
                fontFamily: instrumentSerif,
                fontSize: 44,
                color: COLORS.amber,
                fontWeight: 700,
                opacity: exclamProgress,
                transform: `scale(${interpolate(exclamProgress, [0, 1], [0.3, 1])})`,
                textShadow: "0 0 20px rgba(245,158,11,0.5)",
                pointerEvents: "none",
                zIndex: 20,
              }}
            >
              !!
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
