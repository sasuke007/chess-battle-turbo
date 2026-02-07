"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { X, Search, ExternalLink } from "lucide-react";
import { ChessComPreviewCard } from "../../components/ChessComPreviewCard";
import type { ChessComPreviewData } from "@/lib/types/chess-com";

type Step = "input" | "preview";

interface ChessComConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChessComConnectModal({
  isOpen,
  onClose,
  onSuccess,
}: ChessComConnectModalProps) {
  const [step, setStep] = useState<Step>("input");
  const [handle, setHandle] = useState("");
  const [previewData, setPreviewData] = useState<ChessComPreviewData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setStep("input");
    setHandle("");
    setPreviewData(null);
    setLoading(false);
    setSaving(false);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handle.trim()) {
      setError("Please enter your chess.com username");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/chess-com-profile/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chessComHandle: handle.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to look up chess.com profile");
      }

      setPreviewData(data.data);
      setStep("preview");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Preview error:", err);
      }
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/user/chess-com-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chessComHandle: handle.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save chess.com profile");
      }

      resetState();
      onSuccess();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Confirm error:", err);
      }
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    setStep("input");
    setPreviewData(null);
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute -top-12 right-0 p-2 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <AnimatePresence mode="wait">
              {step === "input" && (
                <motion.div
                  key="modal-input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="border border-white/10 bg-black p-8"
                >
                  {/* Header */}
                  <div className="mb-8">
                    <h2
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                      className="text-2xl text-white mb-2"
                    >
                      Connect Chess.com
                    </h2>
                    <p
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white/40 text-sm"
                    >
                      Link your account to display ratings on your profile
                    </p>
                  </div>

                  <form onSubmit={handleLookup} className="space-y-5">
                    <div>
                      <label
                        htmlFor="modalChessComHandle"
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="block text-xs text-white/40 uppercase tracking-widest mb-3"
                      >
                        Chess.com Username
                      </label>
                      <input
                        type="text"
                        id="modalChessComHandle"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="e.g., hikaru"
                        className={cn(
                          "w-full px-4 py-3 bg-transparent border border-white/10",
                          "text-white placeholder-white/20",
                          "focus:outline-none focus:border-white/40 transition-colors duration-300"
                        )}
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        disabled={loading}
                        autoFocus
                      />
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-white/20 p-3"
                      >
                        <p
                          style={{ fontFamily: "'Geist', sans-serif" }}
                          className="text-white/60 text-sm"
                        >
                          {error}
                        </p>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className={cn(
                        "group relative w-full flex items-center justify-center gap-2 px-8 py-4",
                        "bg-white text-black",
                        "transition-all duration-300 overflow-hidden",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      style={{ fontFamily: "'Geist', sans-serif" }}
                    >
                      <span className="absolute inset-0 bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                      <span className="relative z-10 font-medium group-hover:text-white transition-colors duration-300">
                        {loading ? "Looking up..." : "Look Up Profile"}
                      </span>
                      {!loading && (
                        <Search
                          className="w-4 h-4 relative z-10 group-hover:text-white transition-colors duration-300"
                          strokeWidth={1.5}
                        />
                      )}
                    </button>

                    {/* chess.com link */}
                    <div className="text-center pt-2">
                      <a
                        href="https://www.chess.com/register"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
                      >
                        Don&apos;t have an account? Create one
                        <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                      </a>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === "preview" && previewData && (
                <motion.div
                  key="modal-preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChessComPreviewCard
                    previewData={previewData}
                    onConfirm={handleConfirm}
                    onCancel={handleGoBack}
                    loading={saving}
                    confirmLabel="Confirm & Connect"
                  />

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-white/20 p-3 mt-3"
                    >
                      <p
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-white/60 text-sm"
                      >
                        {error}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
