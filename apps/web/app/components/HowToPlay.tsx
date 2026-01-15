"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";

export const HowToPlay = () => {
  const steps = [
    {
      number: "01",
      title: "Choose a Legendary Position",
      description:
        "Select from iconic chess positions from the greatest games in history. Kasparov, Carlsen, Morphy, and more.",
      icon: "⚡",
    },
    {
      number: "02",
      title: "Share With Your Friend",
      description:
        "Get a unique link to the position and challenge your friend to battle from that critical moment.",
      icon: "🔗",
    },
    {
      number: "03",
      title: "Play the Position",
      description:
        "Step into the shoes of chess legends. Navigate through the same critical decisions they faced.",
      icon: "♟️",
    },
    {
      number: "04",
      title: "Master the Classics",
      description:
        "Learn from the best games ever played. Experience tactical brilliance and strategic mastery firsthand.",
      icon: "👑",
    },
  ];

  return (
    <section className="w-full py-20 px-4 bg-neutral-900">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500">
              How to Play
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto">
            Relive legendary chess moments and challenge your friends from the most critical positions in chess history
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
                ease: "easeOut",
              }}
              className={cn(
                "group relative overflow-hidden rounded-2xl",
                "bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent",
                "backdrop-blur-xl border border-white/10",
                "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
                "hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                "hover:scale-[1.02] hover:border-white/20",
                "p-8"
              )}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-700/10 via-transparent to-neutral-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Step Number */}
              <div className="relative mb-6">
                <span className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-neutral-600 to-neutral-800">
                  {step.number}
                </span>
              </div>

              {/* Icon */}
              <div className="relative mb-6 text-5xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                {step.icon}
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-neutral-100 transition-colors">
                  {step.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
