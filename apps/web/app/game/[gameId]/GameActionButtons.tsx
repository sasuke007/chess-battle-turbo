import { cn } from "@/lib/utils";

interface GameActionButtonsProps {
  variant: "mobile" | "desktop";
  drawOffered: boolean;
  onOfferDraw: () => void;
  onResign: () => void;
}

export function GameActionButtons({
  variant,
  drawOffered,
  onOfferDraw,
  onResign,
}: GameActionButtonsProps) {
  if (variant === "mobile") {
    return (
      <div className="lg:hidden flex items-center justify-center gap-2 mt-2 px-2">
        <button
          onClick={onOfferDraw}
          disabled={drawOffered}
          className={cn(
            "h-10 px-5 text-sm border transition-colors",
            drawOffered
              ? "border-white/10 text-white/30 cursor-not-allowed bg-white/5"
              : "border-white/20 text-white bg-white/5 hover:bg-white/15 active:bg-white/20"
          )}
          style={{ fontFamily: "'Geist', sans-serif" }}
        >
          {drawOffered ? "Offered" : "Draw"}
        </button>
        <button
          onClick={onResign}
          className="h-10 px-5 text-sm border border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25 transition-colors"
          style={{ fontFamily: "'Geist', sans-serif" }}
        >
          Resign
        </button>
      </div>
    );
  }

  return (
    <div className="border border-white/10 p-5 space-y-3">
      <p
        style={{ fontFamily: "'Geist', sans-serif" }}
        className="text-[10px] tracking-[0.3em] uppercase text-white/40"
      >
        Game Actions
      </p>
      <button
        onClick={onOfferDraw}
        disabled={drawOffered}
        className={cn(
          "w-full py-2 border transition-colors",
          drawOffered
            ? "border-white/10 text-white/30 cursor-not-allowed"
            : "border-white/20 text-white/60 hover:border-white/40 hover:text-white"
        )}
        style={{ fontFamily: "'Geist', sans-serif" }}
      >
        {drawOffered ? "Draw Offered" : "Offer Draw"}
      </button>
      <button
        onClick={onResign}
        className="w-full py-2 border border-red-500/30 text-red-400/60 hover:border-red-500/50 hover:text-red-400 transition-colors"
        style={{ fontFamily: "'Geist', sans-serif" }}
      >
        Resign
      </button>
    </div>
  );
}
