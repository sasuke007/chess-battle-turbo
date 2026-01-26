"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Safari Share icon SVG
const ShareIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-blue-400"
  >
    <path d="M12 3v12" />
    <path d="M8 7l4-4 4 4" />
    <rect x="4" y="11" width="16" height="10" rx="2" />
  </svg>
);

// Add to Home Screen icon
const AddBoxIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

export function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              "w-[90%] max-w-sm",
              "bg-neutral-900 border border-white/10",
              "p-6"
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className={cn(
                "absolute top-4 right-4",
                "p-1.5",
                "text-white/40 hover:text-white",
                "transition-colors duration-200"
              )}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-xl text-white mb-2"
            >
              Install Chess Battle
            </h2>
            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-white/40 text-sm mb-6"
            >
              Add to your home screen for the best experience
            </p>

            {/* Steps */}
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10">
                  <span
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-white/60 text-sm"
                  >
                    1
                  </span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white text-sm"
                    >
                      Tap the Share button
                    </p>
                    <ShareIcon />
                  </div>
                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-white/40 text-xs"
                  >
                    At the bottom of your Safari browser
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10">
                  <span
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-white/60 text-sm"
                  >
                    2
                  </span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-white text-sm"
                    >
                      Tap &quot;Add to Home Screen&quot;
                    </p>
                    <AddBoxIcon />
                  </div>
                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-white/40 text-xs"
                  >
                    Scroll down if you don&apos;t see it
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10">
                  <span
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-white/60 text-sm"
                  >
                    3
                  </span>
                </div>
                <div className="flex-1 pt-1">
                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-white text-sm mb-1"
                  >
                    Tap &quot;Add&quot; in the top right
                  </p>
                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-white/40 text-xs"
                  >
                    Chess Battle will appear on your home screen
                  </p>
                </div>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={onClose}
              className={cn(
                "w-full mt-6",
                "h-10",
                "bg-white/5 hover:bg-white/10",
                "border border-white/10 hover:border-white/20",
                "text-white/70 hover:text-white",
                "text-sm font-medium",
                "transition-all duration-200"
              )}
              style={{ fontFamily: "'Geist', sans-serif" }}
            >
              Got it
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
