export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const COLORS = {
  bg: "#000000",
  text: "#ffffff",
  textSecondary: "rgba(255,255,255,0.4)",
  border: "rgba(255,255,255,0.1)",
  borderLight: "rgba(255,255,255,0.2)",
  gridLine: "rgba(255,255,255,0.02)",
  amber: "#f59e0b",
  green: "#22c55e",
  sky: "#38bdf8",
} as const;

export const SPRING_CONFIGS = {
  smooth: { damping: 200 },
  snappy: { damping: 20, stiffness: 200 },
  bouncy: { damping: 8 },
} as const;

// Scene durations in frames (at 30fps)
export const SCENE_DURATIONS = {
  S01_Concept: 120, // 4s
  S02_AppIntro: 240, // 8s
  S03_Brilliance: 240, // 8s
  S04_Analysis: 150, // 5s
  S05_Brand: 150, // 5s
} as const;

// Transition durations in frames
export const TRANSITION_DURATIONS = {
  fade: 30,
  wipe: 30,
} as const;

export const GAME_MODES = [
  { title: "Play as Legend", description: "Step into iconic positions", icon: "♚" },
  { title: "Play Openings", description: "6,000+ opening positions", icon: "♝" },
  { title: "Quick Match", description: "ELO-based matchmaking", icon: "⚡" },
  { title: "Challenge Friends", description: "Share a private invite", icon: "♟" },
  { title: "Tournaments", description: "Compete in real-time", icon: "♛" },
] as const;

// Brilliance position: Italian Game before Nxf7!! sacrifice
// White knight on g5, bishop on c4 — classic Fried Liver setup
export const BRILLIANCE_BOARD: (string | null)[][] = [
  ["br", null, "bb", "bq", "bk", "bb", null, "br"],
  ["bp", "bp", "bp", "bp", null, "bp", "bp", "bp"],
  [null, null, "bn", null, null, "bn", null, null],
  [null, null, null, null, "bp", null, "wn", null],
  [null, null, "wb", null, "wp", null, null, null],
  [null, null, null, null, null, "wn", null, null],
  ["wp", "wp", "wp", "wp", null, "wp", "wp", "wp"],
  ["wr", null, "wb", "wq", "wk", null, null, "wr"],
];

// Analysis move comparison data
export const ANALYSIS_MOVES = [
  { num: 8, you: "Nf3", legend: "Nf3", divergent: false },
  { num: 9, you: "Bb5", legend: "Bb5", divergent: false },
  { num: 10, you: "O-O", legend: "Bxc6", divergent: true },
  { num: 11, you: "d3", legend: "d4", divergent: false },
  { num: 12, you: "Re1", legend: "Nxf7!!", divergent: true },
  { num: 13, you: "Bg5", legend: "Qf3", divergent: true },
  { num: 14, you: "Nd2", legend: "Bxf7+", divergent: true },
  { num: 15, you: "Nf1", legend: "Nf1", divergent: false },
] as const;

export const PIECE_UNICODE: Record<string, string> = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};
