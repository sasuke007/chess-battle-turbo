"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Globe,
  Heart,
  Laptop,
  GraduationCap,
  Gamepad2,
  Coffee,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const values = [
  { number: "01", title: "Move with Purpose", description: "Every feature, every line of code serves a clear intent. Like a grandmaster, we think several moves ahead." },
  { number: "02", title: "Play Fair", description: "Integrity is non-negotiable. We build trust with our community through transparency and honest communication." },
  { number: "03", title: "Master Your Craft", description: "We invest in deep expertise. Whether it's chess theory or systems architecture, mastery is the standard." },
  { number: "04", title: "Think in Combinations", description: "The best solutions emerge when diverse perspectives work together. Collaboration multiplies our strengths." },
];

const perks = [
  { icon: Laptop, title: "Remote-First", description: "Work from anywhere in the world" },
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive health coverage" },
  { icon: GraduationCap, title: "Learning Budget", description: "$2,000/year for courses and conferences" },
  { icon: Gamepad2, title: "Chess Fridays", description: "Weekly team chess tournaments" },
  { icon: Globe, title: "Flexible Hours", description: "Async-first, work when you're sharpest" },
  { icon: Coffee, title: "Home Office", description: "$1,500 setup stipend for new hires" },
];

const positions = [
  {
    title: "Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build and scale our real-time chess platform using Next.js, TypeScript, and WebSockets. You'll work across the stack — from database optimization to pixel-perfect UI.",
    requirements: [
      "4+ years experience with React/Next.js and TypeScript",
      "Experience with real-time systems (WebSockets, Socket.io)",
      "Familiarity with PostgreSQL and Prisma ORM",
      "Strong understanding of performance optimization",
      "Passion for chess is a plus",
    ],
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Define the visual language and interaction patterns for Chess Battle. You'll craft interfaces that feel as precise and deliberate as a well-played game.",
    requirements: [
      "3+ years of product design experience",
      "Expert in Figma with strong prototyping skills",
      "Portfolio showing editorial or luxury design sensibility",
      "Experience designing data-rich interfaces",
      "Understanding of motion design principles",
    ],
  },
  {
    title: "Community Manager",
    department: "Community",
    location: "Remote",
    type: "Full-time",
    description: "Grow and nurture our player community. Run tournaments, moderate discussions, create engaging content, and be the voice of Chess Battle.",
    requirements: [
      "2+ years community management experience",
      "Strong written communication skills",
      "Experience with Discord community management",
      "Chess knowledge (rated 1200+ preferred)",
      "Tournament organization experience is a plus",
    ],
  },
  {
    title: "Content Writer",
    department: "Content",
    location: "Remote",
    type: "Contract",
    description: "Create compelling articles, tutorials, and game analyses that educate and inspire our community. Turn complex chess concepts into accessible content.",
    requirements: [
      "Proven writing portfolio in gaming or sports",
      "Strong chess knowledge (rated 1500+ preferred)",
      "Understanding of SEO best practices",
      "Ability to write technical and editorial content",
      "Experience with content management systems",
    ],
  },
  {
    title: "Chess Consultant",
    department: "Content",
    location: "Remote",
    type: "Contract",
    description: "Curate and verify legendary chess positions, write historical context, and ensure the accuracy of our educational content. Help shape the chess experience.",
    requirements: [
      "FIDE-rated player (2000+ preferred)",
      "Deep knowledge of chess history and theory",
      "Experience in chess education or coaching",
      "Strong analytical and writing skills",
      "Familiarity with PGN/FEN notation",
    ],
  },
];

export default function CareersPage() {
  const [openPosition, setOpenPosition] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[450px] w-full overflow-hidden">
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

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="relative inline-flex items-center gap-1.5 text-[10px] px-3 py-1 border border-white/20 text-white/60 font-medium uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              We&apos;re Hiring
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-6 text-white"
          >
            Build the Future
            <br />
            <span className="text-white/40">of Chess</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ fontFamily: "'Geist', sans-serif" }}
            className="text-lg sm:text-xl text-white/40 max-w-2xl"
          >
            Join a team that&apos;s reimagining how the world experiences chess.
          </motion.p>
        </div>
      </section>

      {/* Values */}
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
                What We Believe
              </span>
              <div className="h-px w-16 bg-white/20" />
            </div>
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-4xl sm:text-5xl text-white"
            >
              Our Values
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
            {values.map((value, index) => (
              <motion.div
                key={value.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={cn(
                  "group relative bg-black p-8",
                  "hover:bg-white transition-colors duration-500"
                )}
              >
                <span
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="text-5xl font-light text-white/10 group-hover:text-black/10 transition-colors duration-500 block mb-6"
                >
                  {value.number}
                </span>
                <h3
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-lg font-semibold text-white group-hover:text-black transition-colors duration-500 mb-3"
                >
                  {value.title}
                </h3>
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-sm text-white/40 group-hover:text-black/60 transition-colors duration-500 leading-relaxed"
                >
                  {value.description}
                </p>
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

      {/* Perks */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-4xl sm:text-5xl text-white"
            >
              Perks & Benefits
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk, index) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="border border-white/10 p-6 hover:border-white/20 transition-colors"
              >
                <perk.icon className="w-5 h-5 text-white/40 mb-4" strokeWidth={1.5} />
                <h3
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-sm font-semibold text-white mb-1"
                >
                  {perk.title}
                </h3>
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-sm text-white/30"
                >
                  {perk.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="relative py-20 sm:py-32 px-6">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="max-w-4xl mx-auto relative">
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
                Open Roles
              </span>
              <div className="h-px w-16 bg-white/20" />
            </div>
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-4xl sm:text-5xl text-white"
            >
              Open Positions
            </h2>
          </motion.div>

          <div className="space-y-3">
            {positions.map((position, index) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenPosition(openPosition === index ? null : index)}
                  className="w-full p-5 text-left flex flex-wrap items-center gap-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <h3
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-sm font-medium text-white flex-1 min-w-[200px]"
                  >
                    {position.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-[10px] px-2 py-0.5 border border-white/10 text-white/40 uppercase tracking-wider"
                    >
                      {position.department}
                    </span>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-[10px] px-2 py-0.5 border border-white/10 text-white/40 uppercase tracking-wider"
                    >
                      {position.location}
                    </span>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-[10px] px-2 py-0.5 border border-white/10 text-white/40 uppercase tracking-wider"
                    >
                      {position.type}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-white/40 transition-transform duration-300 ml-auto",
                      openPosition === index && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {openPosition === index && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 border-t border-white/[0.05] space-y-4">
                        <p
                          style={{ fontFamily: "'Geist', sans-serif" }}
                          className="text-sm text-white/40 leading-relaxed"
                        >
                          {position.description}
                        </p>
                        <div>
                          <p
                            style={{ fontFamily: "'Geist', sans-serif" }}
                            className="text-xs text-white/50 uppercase tracking-widest mb-2"
                          >
                            Requirements
                          </p>
                          <ul className="space-y-1.5">
                            {position.requirements.map((req) => (
                              <li
                                key={req}
                                style={{ fontFamily: "'Geist', sans-serif" }}
                                className="text-sm text-white/35 flex items-start gap-2"
                              >
                                <span className="text-white/20 mt-1.5 w-1 h-1 bg-white/30 flex-shrink-0" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <a
                          href="mailto:careers@chessbattle.com"
                          className={cn(
                            "group/btn relative overflow-hidden inline-block",
                            "px-6 py-3 bg-white text-black",
                            "text-sm font-medium",
                            "transition-all duration-300"
                          )}
                          style={{ fontFamily: "'Geist', sans-serif" }}
                        >
                          <span className="absolute inset-0 bg-black origin-left scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-300" />
                          <span className="relative group-hover/btn:text-white transition-colors duration-300">
                            Apply Now
                          </span>
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute -top-8 -left-8 w-24 h-24 border-l border-t border-white/10" />
          <div className="absolute -bottom-8 -right-8 w-24 h-24 border-r border-b border-white/10" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-3xl sm:text-4xl text-white mb-4"
            >
              Don&apos;t see your role?
            </h2>
            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-white/40 text-base mb-6"
            >
              We&apos;re always interested in hearing from talented people. Send us your resume and tell us how you&apos;d contribute.
            </p>
            <a
              href="mailto:careers@chessbattle.com"
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-white/60 hover:text-white underline text-sm transition-colors"
            >
              careers@chessbattle.com
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
