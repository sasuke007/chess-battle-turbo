"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { IOSInstallModal } from "./IOSInstallModal";

interface InstallAppPopoverProps {
  isIOS: boolean;
  onInstall: () => Promise<boolean>;
}

export function InstallAppPopover({ isIOS, onInstall }: InstallAppPopoverProps) {
  const [showIOSModal, setShowIOSModal] = useState(false);

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      await onInstall();
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "group relative overflow-hidden",
          "h-9 w-9",
          "flex items-center justify-center",
          "border border-white/20 hover:border-white/40",
          "bg-white/5",
          "transition-all duration-300"
        )}
        aria-label="Install app"
      >
        <span className="absolute inset-0 bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
        <Download className="relative w-4 h-4 text-white/70 group-hover:text-black transition-colors duration-300" />
      </button>

      {/* iOS Install Modal */}
      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
      />
    </>
  );
}
