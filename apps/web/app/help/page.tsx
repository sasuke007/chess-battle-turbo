"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Search,
  BookOpen,
  Gamepad2,
  CreditCard,
  Wrench,
  Link2,
  HelpCircle,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const helpCategories = [
  { icon: BookOpen, title: "Getting Started", count: 12, description: "Account setup, first game, interface tour" },
  { icon: Gamepad2, title: "Game Modes", count: 8, description: "Quick match, legendary positions, practice" },
  { icon: CreditCard, title: "Account & Billing", count: 6, description: "Subscriptions, payments, account settings" },
  { icon: Wrench, title: "Technical Issues", count: 10, description: "Connectivity, browser support, performance" },
  { icon: Link2, title: "Chess.com Integration", count: 5, description: "Importing games, syncing accounts" },
  { icon: HelpCircle, title: "General", count: 7, description: "Fair play, community guidelines, feedback" },
];

const popularArticles = [
  { question: "How do I start my first game?", category: "Getting Started" },
  { question: "What are Legendary Positions?", category: "Game Modes" },
  { question: "How do I import my Chess.com games?", category: "Chess.com Integration" },
  { question: "Why is my game lagging or disconnecting?", category: "Technical Issues" },
  { question: "How does the rating system work?", category: "Getting Started" },
  { question: "How do I cancel or change my subscription?", category: "Account & Billing" },
  { question: "What browsers are supported?", category: "Technical Issues" },
  { question: "How do I report a player for cheating?", category: "General" },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Grid background */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Hero */}
      <section className="relative pt-32 pb-12 sm:pt-40 sm:pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-5xl sm:text-6xl md:text-7xl text-white mb-8"
            >
              How Can We Help?
            </h1>

            {/* Search Input */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for articles..."
                className={cn(
                  "w-full bg-white/[0.03] border border-white/10",
                  "pl-12 pr-4 py-4 text-sm text-white",
                  "placeholder:text-white/20",
                  "focus:outline-none focus:border-white/30 focus:bg-white/[0.05]",
                  "transition-all duration-300"
                )}
                style={{ fontFamily: "'Geist', sans-serif" }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Categories */}
      <section className="relative py-16 sm:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16 bg-white/20" />
              <span
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-white/40 text-[10px] tracking-[0.4em] uppercase"
              >
                Browse Topics
              </span>
              <div className="h-px w-16 bg-white/20" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            {helpCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={cn(
                  "group relative bg-black p-8 cursor-pointer",
                  "hover:bg-white transition-colors duration-500"
                )}
              >
                <category.icon
                  className="w-5 h-5 text-white/40 group-hover:text-black/40 transition-colors duration-500 mb-4"
                  strokeWidth={1.5}
                />
                <h3
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-lg font-semibold text-white group-hover:text-black transition-colors duration-500 mb-1"
                >
                  {category.title}
                </h3>
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-sm text-white/30 group-hover:text-black/40 transition-colors duration-500 mb-3"
                >
                  {category.description}
                </p>
                <p
                  style={{ fontFamily: "'Geist Mono', monospace" }}
                  className="text-xs text-white/20 group-hover:text-black/30 transition-colors duration-500"
                >
                  {category.count} articles
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

      {/* Popular Articles */}
      <section className="relative py-16 sm:py-24 px-6">
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
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-white/20" />
              <span
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-white/40 text-[10px] tracking-[0.4em] uppercase"
              >
                Popular Articles
              </span>
              <div className="h-px w-12 bg-white/20" />
            </div>
          </motion.div>

          <div className="space-y-1">
            {popularArticles.map((article, index) => (
              <motion.div
                key={article.question}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/[0.05]"
              >
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all flex-shrink-0" />
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-sm text-white/50 group-hover:text-white transition-colors flex-1"
                >
                  {article.question}
                </p>
                <span
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-[10px] px-2 py-0.5 border border-white/10 text-white/30 uppercase tracking-wider hidden sm:inline-block"
                >
                  {article.category}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-3xl sm:text-4xl text-white mb-4"
            >
              Still Need Help?
            </h2>
            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-white/40 text-base mb-8"
            >
              Our support team is ready to assist you with any questions.
            </p>
            <Link href="/contact">
              <button
                className={cn(
                  "group relative overflow-hidden",
                  "bg-white text-black",
                  "px-8 py-3",
                  "text-sm font-medium tracking-[0.1em] uppercase",
                  "transition-all duration-300"
                )}
                style={{ fontFamily: "'Geist', sans-serif" }}
              >
                <span className="absolute inset-0 bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                <span className="relative flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                  Contact Us
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
