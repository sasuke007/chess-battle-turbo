"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";

export const AgadmatorFeature = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [userPreferredMute, setUserPreferredMute] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuteState = !isMuted;
      videoRef.current.muted = newMuteState;
      setIsMuted(newMuteState);
      setUserPreferredMute(newMuteState);
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            // Video is out of viewport, mute it
            videoElement.muted = true;
            setIsMuted(true);
          } else {
            // Video is in viewport, restore user preference
            videoElement.muted = userPreferredMute;
            setIsMuted(userPreferredMute);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when at least 50% of video is visible
      }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
    };
  }, [userPreferredMute]);
  return (
    <section className="w-full py-20 px-4 bg-neutral-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Heading */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500">
                Play Agadmator's{" "}
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-300 to-neutral-600">
                Pause the Video
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500">
                {" "}
                Moments
              </span>
            </h2>

            {/* Description */}
            <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
              Love Agadmator's legendary chess content? Now you can play all the
              iconic "pause the video" moments from his channel with your
              friends. Test your tactical vision against the same positions that
              challenge millions of chess fans.
            </p>

            {/* Feature Points */}
            <div className="space-y-4">
              {[
                {
                  icon: "🎯",
                  text: "Access every pause the video moment",
                },
                {
                  icon: "⚔️",
                  text: "Challenge friends to solve the position",
                },
                {
                  icon: "🧠",
                  text: "Learn from the best tactical puzzles",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center text-xl">
                    {feature.icon}
                  </div>
                  <span className="text-neutral-300">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Video Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div
              className={cn(
                "group relative overflow-hidden rounded-2xl",
                "bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent",
                "backdrop-blur-xl border border-white/10",
                "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
                "hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                "hover:scale-[1.02] transition-all duration-300",
                "p-8"
              )}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-700/10 via-transparent to-neutral-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative space-y-6">
                {/* Video Preview */}
                <div className="aspect-video rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/5 overflow-hidden relative group/video">
                  {/* Video Element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src="/video_clip.webm" type="video/webm" />
                  </video>

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Text Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10 flex items-end justify-between">
                    <div>
                      <div className="text-neutral-200 text-sm font-medium">
                        Agadmator&apos;s Chess Channel
                      </div>
                      <div className="text-neutral-400 text-xs mt-1">
                        #pause-the-video
                      </div>
                    </div>

                    {/* Audio Toggle Button */}
                    <button
                      onClick={toggleMute}
                      className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center text-white"
                      aria-label={isMuted ? "Unmute video" : "Mute video"}
                    >
                      {isMuted ? (
                        // Muted Icon
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-5 h-5"
                        >
                          <path d="M11 5L6 9H2v6h4l5 4V5z" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                      ) : (
                        // Unmuted Icon
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-5 h-5"
                        >
                          <path d="M11 5L6 9H2v6h4l5 4V5z" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Videos", value: "4000+" },
                    { label: "Positions", value: "6000+" },
                    { label: "Players", value: "1M+" },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="text-center p-4 rounded-lg bg-white/5 border border-white/5"
                    >
                      <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-neutral-200 to-neutral-400">
                        {stat.value}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Channel Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-2xl border border-white/10">
                    ♔
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-200">
                      Agadmator
                    </div>
                    <div className="text-sm text-neutral-500">
                      World&apos;s Most Popular Chess Channel
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};