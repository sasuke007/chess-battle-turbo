"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

export function NavbarTournaments() {
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    async function checkTournaments() {
      try {
        const res = await fetch("/api/tournament?statuses=LOBBY,ACTIVE&count=true");
        const data = await res.json();
        if (data.success) {
          setHasActive(data.data.count > 0);
        }
      } catch {
        // silent
      }
    }

    checkTournaments();
    const interval = setInterval(checkTournaments, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/tournaments"
      className={cn(
        "group relative overflow-hidden",
        "h-9 px-3 sm:px-5 flex items-center",
        "border border-white/20 hover:border-white/40",
        "bg-white/5 backdrop-blur-sm",
        "text-sm font-medium tracking-wide",
        "transition-all duration-300"
      )}
      style={{ fontFamily: "'Geist', sans-serif" }}
    >
      <span className="absolute inset-0 bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      <span className="relative flex items-center gap-1.5 text-white/70 group-hover:text-black transition-colors duration-300">
        <Trophy className="w-3.5 h-3.5" strokeWidth={1.5} />
        <span className="hidden sm:inline">Tournaments</span>
      </span>
      {hasActive && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-white/70 rounded-full" />
      )}
    </Link>
  );
}
