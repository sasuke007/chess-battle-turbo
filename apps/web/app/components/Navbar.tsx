"use client";

import React from "react";
import {cn} from "../../lib/utils";
import Image from "next/image";
import Link from "next/link";
import {SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser} from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export const Navbar = () => {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handlePlayClick = () => {
    if (isSignedIn) {
      router.push("/play");
    } else {
      router.push("/sign-in");
    }
  };
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 w-full z-50 flex justify-between gap-4 items-center px-2 sm:px-3 md:px-4 lg:px-6 py-1 sm:py-1 md:py-1 lg:py-1 bg-[rgba(255_255_255_0.13)] backdrop-blur-xs"
      )}
    >
      <div className={cn(" text-2xl font-bold")}>
        <Link href="/" className="block">
          <Image
            src="/chess-logo-bnw.png"
            alt="Logo"
            width={100}
            height={100}
            className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-16 lg:h-16 transition-all duration-300 ease-in-out",
              "hover:scale-105 ",
              "drop-shadow-[0_4px_8px_rgba(255,255,255,0.15)]",
              "hover:drop-shadow-[0_8px_16px_rgba(255,255,255,0.3)]",
              "filter brightness-100 hover:brightness-110",
              "cursor-pointer"
            )}
          />
        </Link>
      </div>
      <div className={cn("flex gap-2 sm:gap-3 md:gap-3 lg:gap-4 items-center")}>
        {/* Play Now Button */}
        <button
          onClick={handlePlayClick}
          className={cn(
            "relative bg-gradient-to-br from-neutral-200 via-neutral-300 to-neutral-400",
            "text-neutral-900 rounded-lg font-bold",
            "text-xs sm:text-sm md:text-sm lg:text-base",
            "h-7 sm:h-8 md:h-9 lg:h-9",
            "px-3 sm:px-4 md:px-6 lg:px-8",
            "cursor-pointer transition-all duration-300",
            "hover:scale-105 hover:from-neutral-100 hover:via-neutral-200 hover:to-neutral-300",
            "shadow-[0_4px_16px_rgba(255,255,255,0.2)]",
            "hover:shadow-[0_6px_24px_rgba(255,255,255,0.3)]",
            "before:absolute before:inset-0 before:rounded-lg",
            "before:bg-gradient-to-t before:from-transparent before:via-white/20 before:to-white/40",
            "before:opacity-70 overflow-hidden"
          )}
        >
          <span className="relative z-10">Play Now ♟️</span>
        </button>

        <SignedOut>
          <SignInButton>
            <button className="relative bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 text-white rounded-lg font-medium text-xs sm:text-sm md:text-sm lg:text-base h-7 sm:h-8 md:h-9 lg:h-9 px-2 sm:px-3 md:px-3 lg:px-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-neutral-950 shadow-lg hover:shadow-xl before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-t before:from-transparent before:via-white/10 before:to-white/30 before:opacity-70 overflow-hidden backdrop-blur-xs shadow-[rgba(17,_17,_26,_0.1)_0px_0px_16px]">
              <span className={cn("")}>Sign In</span>
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="relative bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 text-white rounded-lg font-medium text-xs sm:text-sm md:text-sm lg:text-base h-7 sm:h-8 md:h-9 lg:h-9 px-2 sm:px-3 md:px-3 lg:px-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-neutral-950 shadow-lg hover:shadow-xl before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-t before:from-transparent before:via-white/10 before:to-white/30 before:opacity-70 overflow-hidden shadow-[rgba(17,_17,_26,_0.1)_0px_0px_16px]">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  );
};
