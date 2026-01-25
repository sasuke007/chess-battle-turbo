"use client";

import React from "react";
import { cn } from "../../lib/utils";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

// Load fonts
const fontLink = typeof document !== 'undefined' ? (() => {
  const existing = document.querySelector('link[href*="Instrument+Serif"]');
  if (!existing) {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  return true;
})() : null;

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
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 w-full z-50",
        "flex justify-between items-center",
        "px-4 sm:px-6 lg:px-8 py-3",
        "bg-black/40 backdrop-blur-xl",
        "border-b border-white/[0.08]",
        "supports-[backdrop-filter]:bg-black/30"
      )}
      style={{
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 group">
        <Image
          src="/chess-logo-bnw.png"
          alt="Chess Battle"
          width={100}
          height={100}
          className={cn(
            "w-10 h-10 sm:w-11 sm:h-11",
            "transition-all duration-300",
            "group-hover:opacity-80"
          )}
        />
        <span
          style={{ fontFamily: "'Instrument Serif', serif" }}
          className="hidden sm:block text-white text-lg tracking-tight"
        >
          Chess Battle
        </span>
      </Link>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Play Button */}
        <button
          onClick={handlePlayClick}
          className={cn(
            "group relative overflow-hidden",
            "bg-white text-black",
            "h-9 px-5",
            "text-sm font-medium tracking-wide",
            "transition-all duration-300"
          )}
          style={{ fontFamily: "'Geist', sans-serif" }}
        >
          {/* Invert animation */}
          <span className="absolute inset-0 bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          <span className="relative flex items-center gap-2 group-hover:text-white transition-colors duration-300">
            Play
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>

        <SignedOut>
          <SignInButton>
            <button
              className={cn(
                "h-9 px-4",
                "border border-white/20 hover:border-white/40",
                "bg-white/5 hover:bg-white/10",
                "text-white/70 hover:text-white",
                "text-sm font-medium tracking-wide",
                "transition-all duration-300",
                "backdrop-blur-sm"
              )}
              style={{ fontFamily: "'Geist', sans-serif" }}
            >
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button
              className={cn(
                "hidden sm:block",
                "h-9 px-4",
                "border border-white/10 hover:border-white/20",
                "text-white/50 hover:text-white/70",
                "text-sm font-medium tracking-wide",
                "transition-all duration-300"
              )}
              style={{ fontFamily: "'Geist', sans-serif" }}
            >
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <div className="ml-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border border-white/20",
                },
              }}
            />
          </div>
        </SignedIn>
      </div>
    </nav>
  );
};
