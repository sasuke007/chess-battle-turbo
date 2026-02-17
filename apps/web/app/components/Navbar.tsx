"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowRight, User } from "lucide-react";
import { usePWAInstall } from "@/lib/hooks";
import { InstallAppPopover } from "./InstallAppPopover";

export const Navbar = () => {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [userReferenceId, setUserReferenceId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !user?.emailAddresses[0]?.emailAddress) return;
    const email = user.emailAddresses[0].emailAddress;

    fetch(`/api/user/email/${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.user?.referenceId) {
          setUserReferenceId(data.data.user.referenceId);
        }
      })
      .catch(() => {});
  }, [isSignedIn, user]);

  const handlePlayClick = () => {
    if (isSignedIn) {
      router.push("/play");
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <nav
      aria-label="Main navigation"
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
          alt="ReplayChess"
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
          ReplayChess
        </span>
      </Link>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Install App Popover - only show if can install and not already installed */}
        {canInstall && !isInstalled && (
          <InstallAppPopover isIOS={isIOS} onInstall={install} />
        )}

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
          {userReferenceId && (
            <Link
              href={`/profile/${userReferenceId}`}
              className={cn(
                "group relative overflow-hidden",
                "bg-white text-black",
                "h-9 px-3 sm:px-5",
                "text-sm font-medium tracking-wide",
                "transition-all duration-300",
                "flex items-center"
              )}
              style={{ fontFamily: "'Geist', sans-serif" }}
            >
              <span className="absolute inset-0 bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              <span className="relative flex items-center gap-1.5 text-black group-hover:text-white transition-colors duration-300">
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Profile</span>
              </span>
            </Link>
          )}
          <div className="ml-2">
            <UserButton
              appearance={{
                variables: {
                  colorBackground: '#000000',
                  colorText: '#ffffff',
                  colorTextSecondary: 'rgba(255, 255, 255, 0.5)',
                  colorPrimary: '#ffffff',
                  colorNeutral: 'rgba(255, 255, 255, 0.4)',
                  colorDanger: '#ef4444',
                  borderRadius: '0px',
                  fontFamily: "'Geist', sans-serif",
                },
                elements: {
                  avatarBox: "w-9 h-9 border border-white/20 hover:border-white/40 transition-all duration-300",
                  userButtonTrigger: "focus:shadow-none focus:ring-0",
                  userButtonPopoverCard: {
                    backgroundColor: '#000000',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                    borderRadius: '0px',
                  },
                  userButtonPopoverActionButton: {
                    fontFamily: "'Geist', sans-serif",
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '0px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                    },
                  },
                  userButtonPopoverActionButtonText: {
                    fontFamily: "'Geist', sans-serif",
                  },
                  userButtonPopoverActionButtonIcon: {
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                  userButtonPopoverFooter: {
                    display: 'none',
                  },
                  userPreview: {
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  },
                  userPreviewMainIdentifier: {
                    fontFamily: "'Geist', sans-serif",
                    fontWeight: '500',
                    color: '#ffffff',
                  },
                  userPreviewSecondaryIdentifier: {
                    fontFamily: "'Geist', sans-serif",
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '12px',
                  },
                },
              }}
            />
          </div>
        </SignedIn>
      </div>
    </nav>
  );
};
