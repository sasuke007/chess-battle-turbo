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
          "h-9 w-9",
          "flex items-center justify-center",
          "border border-white/20 hover:border-white/40",
          "bg-white/5 hover:bg-white/10",
          "text-white/70 hover:text-white",
          "transition-all duration-300"
        )}
        aria-label="Install app"
      >
        <Download className="w-4 h-4" />
      </button>

      {/* iOS Install Modal */}
      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
      />
    </>
  );
}
