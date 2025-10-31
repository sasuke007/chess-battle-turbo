import React from "react";
import { cn } from "../../lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export const Navbar = () => {
  return (
    <div
      className={cn(
        "fixed w-[98%] mx-auto z-50 flex justify-center gap-200 items-center bg-[rgba(255_255_255_0.13)] backdrop-blur-xs"
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
              "w-25 h-25 transition-all duration-300 ease-in-out",
              "hover:scale-105 ",
              "drop-shadow-[0_4px_8px_rgba(255,255,255,0.15)]",
              "hover:drop-shadow-[0_8px_16px_rgba(255,255,255,0.3)]",
              "filter brightness-100 hover:brightness-110",
              "cursor-pointer"
            )}
          />
        </Link>
      </div>
      <div className={cn("flex gap-4")}>
        <SignedOut>
          <SignInButton>
            <button className="relative bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 text-white rounded-lg font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-neutral-950 shadow-lg hover:shadow-xl before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-t before:from-transparent before:via-white/10 before:to-white/30 before:opacity-70 overflow-hidden backdrop-blur-xs shadow-[rgba(17,_17,_26,_0.1)_0px_0px_16px]">
              <span className={cn("")}>Sign In</span>
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="relative bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 text-white rounded-lg font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-neutral-950 shadow-lg hover:shadow-xl before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-t before:from-transparent before:via-white/10 before:to-white/30 before:opacity-70 overflow-hidden shadow-[rgba(17,_17,_26,_0.1)_0px_0px_16px]">
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
