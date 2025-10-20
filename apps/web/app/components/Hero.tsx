"use client";

import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export default function Hero() {
  return (
    <section className="relative h-full w-full mx-auto flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a1a1a] rounded-md">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute  min-w-full min-h-full w-auto h-auto opacity-[0.3] object-cover"
      >
        <source
          src="/Kings_Gambit_Chess_Board_Animation.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-[rgba(10,10,10,0.4)] to-[rgba(10,10,10,0.8)] pointer-events-none"></div>
      <motion.div
        initial={{
          opacity: 0,
          y: -100,
        }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.8,
            ease: "easeInOut",
          },
        }}
        className="relative z-10 flex flex-col items-center justify-center text-center max-w-[70%]"
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white mb-6 md:mb-8 leading-none shadow-[rgba(17,_17,_26,_0.1)_0px_0px_16px]">
          <span className=" bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-neutral-800  to-neutral-300">
            Chess Battle
          </span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-light text-[#a3a3a3] leading-relaxed">
          Challenge your friends to a chess game and win money
        </p>
      </motion.div>
      <div className={cn("absolute h-[30%] w-full bottom-0 left-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent pointer-events-none")}></div>
    </section>
  );
}
