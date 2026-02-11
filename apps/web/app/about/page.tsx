"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const stats = [
  { value: "10K+", label: "Games Played" },
  { value: "500+", label: "Positions" },
  { value: "50+", label: "Legends" },
  { value: "99.9%", label: "Uptime" },
];

const milestones = [
  { year: "2023", title: "The First Move", description: "Chess Battle was founded with a vision to make legendary chess moments playable and shareable." },
  { year: "2024", title: "Opening Gambit", description: "Launched the first 100 legendary positions and introduced real-time multiplayer matchmaking." },
  { year: "2024", title: "Middlegame Expansion", description: "Integrated AI-powered analysis, voice coaching, and Chess.com game imports." },
  { year: "2025", title: "Endgame Precision", description: "Reached 10,000 active players. Introduced tournaments, rankings, and community features." },
  { year: "2026", title: "New Horizons", description: "Expanding into mobile-native experiences, API access, and competitive league partnerships." },
];

const team = [
  { piece: "♔", name: "Alexander Petrov", role: "Founder & CEO", line: "Building the future of chess, one move at a time." },
  { piece: "♕", name: "Maria Chen", role: "Head of Product", line: "Turning chess theory into intuitive experiences." },
  { piece: "♗", name: "James Okafor", role: "Lead Engineer", line: "Performance obsessed. Sub-100ms move latency." },
  { piece: "♘", name: "Sofia Andersson", role: "Head of Design", line: "Where editorial precision meets digital craft." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 min-w-full min-h-full w-auto h-auto opacity-20 object-cover grayscale"
        >
          <source src="/Kings_Gambit_Chess_Board_Animation.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Decorative corners */}
        <div className="absolute top-20 left-8 w-32 h-32 border-l border-t border-white/10" />
        <div className="absolute bottom-20 right-8 w-32 h-32 border-r border-b border-white/10" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-px w-12 bg-white/30" />
            <span
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-white/50 text-[10px] tracking-[0.4em] uppercase"
            >
              Our Story
            </span>
            <div className="h-px w-12 bg-white/30" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-6 text-white leading-[0.95]"
          >
            Where Legends
            <br />
            <span className="text-white/40">Meet the Board</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ fontFamily: "'Geist', sans-serif" }}
            className="text-lg sm:text-xl text-white/40 max-w-2xl"
          >
            We&apos;re on a mission to make chess history interactive, immersive, and unforgettable.
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative py-20 sm:py-32 px-6">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="max-w-6xl mx-auto relative grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-3xl sm:text-4xl lg:text-5xl text-white/60 italic leading-snug"
            >
              &ldquo;Every great chess game tells a story. We built a platform where you can live those stories.&rdquo;
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-white/40 text-base leading-relaxed mb-6"
            >
              Chess Battle was born from a simple idea: the greatest moments in chess history shouldn&apos;t just be
              studied — they should be experienced. We believe that stepping into the shoes of Kasparov, Fischer, or
              Carlsen at the critical moment of a legendary game is the most powerful way to learn and appreciate chess.
            </p>
            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-white/40 text-base leading-relaxed"
            >
              Our platform combines real-time multiplayer gaming with a curated library of historic positions,
              AI-powered analysis, and a community of passionate players who share our love for the royal game.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-black p-8 text-center"
              >
                <p
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="text-4xl sm:text-5xl text-white mb-2"
                >
                  {stat.value}
                </p>
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] tracking-[0.2em] uppercase text-white/30"
                >
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative py-20 sm:py-32 px-6">
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16 bg-white/20" />
              <span
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-white/40 text-[10px] tracking-[0.4em] uppercase"
              >
                Our Journey
              </span>
              <div className="h-px w-16 bg-white/20" />
            </div>
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-4xl sm:text-5xl text-white"
            >
              Milestones
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-px bg-white/10" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative pl-16 sm:pl-24"
                >
                  {/* Dot */}
                  <div className="absolute left-[13px] sm:left-[29px] top-1 w-2 h-2 bg-white" />

                  <p
                    style={{ fontFamily: "'Geist Mono', monospace" }}
                    className="text-xs text-white/30 mb-1"
                  >
                    {milestone.year}
                  </p>
                  <h3
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                    className="text-xl sm:text-2xl text-white mb-2"
                  >
                    {milestone.title}
                  </h3>
                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-sm text-white/40 leading-relaxed max-w-lg"
                  >
                    {milestone.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="relative py-20 sm:py-32 px-6">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16 bg-white/20" />
              <span
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-white/40 text-[10px] tracking-[0.4em] uppercase"
              >
                The Team
              </span>
              <div className="h-px w-16 bg-white/20" />
            </div>
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-4xl sm:text-5xl text-white"
            >
              Meet the Minds
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={cn(
                  "group relative bg-black p-8",
                  "hover:bg-white transition-colors duration-500"
                )}
              >
                <span className="text-5xl mb-6 block group-hover:scale-110 transition-transform duration-500">
                  {member.piece}
                </span>
                <h3
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-lg font-semibold text-white group-hover:text-black transition-colors duration-500 mb-1"
                >
                  {member.name}
                </h3>
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-xs text-white/40 group-hover:text-black/40 transition-colors duration-500 uppercase tracking-widest mb-4"
                >
                  {member.role}
                </p>
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-sm text-white/30 group-hover:text-black/50 transition-colors duration-500 leading-relaxed"
                >
                  {member.line}
                </p>

                {/* Corner accent */}
                <div className={cn(
                  "absolute top-4 right-4 w-8 h-8",
                  "border-t border-r",
                  "border-white/10 group-hover:border-black/10",
                  "transition-colors duration-500"
                )} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-32 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          {/* Decorative corners */}
          <div className="absolute -top-8 -left-8 w-24 h-24 border-l border-t border-white/10" />
          <div className="absolute -bottom-8 -right-8 w-24 h-24 border-r border-b border-white/10" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-4xl sm:text-5xl text-white mb-6"
            >
              Join Our Team
            </h2>
            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-white/40 text-lg mb-8 max-w-xl mx-auto"
            >
              We&apos;re always looking for passionate people who love chess and building great products.
            </p>
            <Link href="/careers">
              <button
                className={cn(
                  "group relative overflow-hidden",
                  "bg-white text-black",
                  "px-10 py-4",
                  "text-sm font-semibold tracking-[0.1em] uppercase",
                  "transition-all duration-300"
                )}
                style={{ fontFamily: "'Geist', sans-serif" }}
              >
                <span className="absolute inset-0 bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                <span className="relative flex items-center gap-3 group-hover:text-white transition-colors duration-300">
                  View Open Positions
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
