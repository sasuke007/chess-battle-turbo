"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const categories = ["All", "Strategy", "Updates", "Legends", "Community"];

const featuredPost = {
  title: "The Immortal Game: How Anderssen Changed Chess Forever",
  excerpt: "In 1851, Adolf Anderssen played what many consider the most beautiful chess game ever recorded. We explore how this masterpiece shaped modern attacking chess.",
  category: "Legends",
  date: "Jan 28, 2026",
  readTime: "8 min read",
};

const articles = [
  {
    title: "5 Opening Principles Every Player Should Know",
    excerpt: "Control the center, develop your pieces, and castle early — but there's more nuance than you think.",
    category: "Strategy",
    date: "Jan 22, 2026",
    readTime: "5 min read",
  },
  {
    title: "Chess Battle v2.4: New Analysis Engine",
    excerpt: "Our latest update brings a dramatically improved analysis engine with 3x faster evaluation and deeper search depth.",
    category: "Updates",
    date: "Jan 18, 2026",
    readTime: "3 min read",
  },
  {
    title: "Bobby Fischer's Endgame Mastery",
    excerpt: "A deep dive into Fischer's legendary endgame technique and how you can apply his principles to your own games.",
    category: "Legends",
    date: "Jan 12, 2026",
    readTime: "7 min read",
  },
  {
    title: "Community Tournament Recap: Winter Open 2026",
    excerpt: "Over 200 players competed in our biggest tournament yet. Here are the highlights, upsets, and brilliant games.",
    category: "Community",
    date: "Jan 8, 2026",
    readTime: "4 min read",
  },
  {
    title: "Understanding Pawn Structures",
    excerpt: "The pawn skeleton defines the character of the position. Learn to read and manipulate pawn structures like a grandmaster.",
    category: "Strategy",
    date: "Jan 3, 2026",
    readTime: "6 min read",
  },
  {
    title: "New Feature: Voice-Guided Analysis",
    excerpt: "Our AI coach can now walk you through your games with voice narration, explaining key moments and missed opportunities.",
    category: "Updates",
    date: "Dec 28, 2025",
    readTime: "3 min read",
  },
];

const gradients = [
  "from-white/[0.08] to-white/[0.02]",
  "from-white/[0.06] to-white/[0.01]",
  "from-white/[0.04] to-white/[0.08]",
  "from-white/[0.03] to-white/[0.06]",
  "from-white/[0.07] to-white/[0.02]",
  "from-white/[0.05] to-white/[0.03]",
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredArticles =
    activeCategory === "All"
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  const showFeatured = activeCategory === "All" || activeCategory === featuredPost.category;

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
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-12 bg-white/20" />
              <span
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-white/40 text-[10px] tracking-[0.4em] uppercase"
              >
                Insights & Stories
              </span>
              <div className="h-px w-12 bg-white/20" />
            </div>
            <h1
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-5xl sm:text-6xl md:text-7xl text-white mb-4"
            >
              The Chess Battle Journal
            </h1>
            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-lg text-white/40 max-w-xl mx-auto"
            >
              Strategy, stories, and updates from the world of Chess Battle.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Chips */}
      <section className="relative px-6 pb-12">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{ fontFamily: "'Geist', sans-serif" }}
              className={cn(
                "px-4 py-2 text-xs uppercase tracking-widest transition-all duration-300",
                activeCategory === category
                  ? "bg-white text-black"
                  : "border border-white/10 text-white/40 hover:text-white hover:border-white/30"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Featured Post */}
      {showFeatured && (
        <section className="relative py-12 sm:py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative border border-white/10 overflow-hidden hover:border-white/20 transition-colors cursor-pointer"
            >
              <div className="aspect-[21/9] bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.03] relative">
                {/* Decorative chess notation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                    className="text-[120px] sm:text-[200px] text-white/[0.03] select-none"
                  >
                    1.e4 e5
                  </span>
                </div>

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <span
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="inline-block text-[10px] px-2 py-0.5 border border-white/20 text-white/60 uppercase tracking-wider mb-3"
                  >
                    {featuredPost.category}
                  </span>
                  <h2
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                    className="text-2xl sm:text-4xl text-white mb-3 group-hover:text-white/80 transition-colors"
                  >
                    {featuredPost.title}
                  </h2>
                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-sm text-white/40 max-w-2xl mb-4 hidden sm:block"
                  >
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4">
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-xs text-white/30"
                    >
                      {featuredPost.date}
                    </span>
                    <span className="text-white/10">|</span>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-xs text-white/30"
                    >
                      {featuredPost.readTime}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Article Grid */}
      <section className="relative py-12 sm:py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            {filteredArticles.map((article, index) => (
              <motion.article
                key={article.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={cn(
                  "group relative bg-black p-0 cursor-pointer",
                  "hover:bg-white transition-colors duration-500"
                )}
              >
                {/* Gradient placeholder */}
                <div
                  className={cn(
                    "aspect-[16/9] bg-gradient-to-br",
                    gradients[index % gradients.length],
                    "group-hover:opacity-80 transition-opacity duration-500"
                  )}
                />

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-[10px] px-2 py-0.5 border border-white/10 group-hover:border-black/10 text-white/40 group-hover:text-black/40 uppercase tracking-wider transition-colors duration-500"
                    >
                      {article.category}
                    </span>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-[10px] text-white/20 group-hover:text-black/20 transition-colors duration-500"
                    >
                      {article.readTime}
                    </span>
                  </div>

                  <h3
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                    className="text-xl text-white group-hover:text-black transition-colors duration-500 mb-2"
                  >
                    {article.title}
                  </h3>

                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-sm text-white/35 group-hover:text-black/50 transition-colors duration-500 leading-relaxed mb-4"
                  >
                    {article.excerpt}
                  </p>

                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-xs text-white/20 group-hover:text-black/30 transition-colors duration-500"
                  >
                    {article.date}
                  </p>
                </div>

                <div className={cn(
                  "absolute top-4 right-4 w-8 h-8",
                  "border-t border-r",
                  "border-white/10 group-hover:border-black/10",
                  "transition-colors duration-500"
                )} />
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="relative py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-3xl sm:text-4xl text-white mb-4"
            >
              Never Miss a Post
            </h2>
            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-white/40 text-sm mb-6"
            >
              Get the latest articles and updates delivered straight to your inbox.
            </p>
            <form className="flex max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className={cn(
                  "flex-1 bg-white/[0.03] border border-white/10",
                  "px-4 py-3 text-sm text-white",
                  "placeholder:text-white/20",
                  "focus:outline-none focus:border-white/30 focus:bg-white/[0.05]",
                  "transition-all duration-300"
                )}
                style={{ fontFamily: "'Geist', sans-serif" }}
              />
              <button
                type="submit"
                className={cn(
                  "group/btn relative overflow-hidden",
                  "px-6 py-3 bg-white text-black",
                  "text-sm font-medium",
                  "transition-all duration-300"
                )}
                style={{ fontFamily: "'Geist', sans-serif" }}
              >
                <span className="absolute inset-0 bg-black origin-left scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-300" />
                <span className="relative flex items-center gap-2 group-hover/btn:text-white transition-colors duration-300">
                  Subscribe
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
