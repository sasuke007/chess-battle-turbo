"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const services = [
  { name: "Game Servers", uptime: "99.8%", status: "Operational" },
  { name: "Authentication", uptime: "100%", status: "Operational" },
  { name: "Database", uptime: "99.9%", status: "Operational" },
  { name: "WebSocket", uptime: "99.5%", status: "Operational" },
  { name: "Analysis Engine", uptime: "99.7%", status: "Operational" },
];

// Generate 30 days of uptime data (1 = up, 0 = down)
function generateUptimeDays(uptime: string): boolean[] {
  const pct = parseFloat(uptime);
  const downDays = Math.round((100 - pct) / 100 * 30);
  const days = new Array(30).fill(true);
  // Place downtime in early days to simulate resolved incidents
  for (let i = 0; i < downDays; i++) {
    days[Math.floor(Math.random() * 10)] = false;
  }
  return days;
}

const incidents = [
  {
    date: "Jan 28, 2026",
    title: "WebSocket Connection Delays",
    description: "Some users experienced intermittent connection delays during peak hours. Root cause identified as a configuration issue in our load balancer. Resolved within 45 minutes.",
    status: "Resolved",
  },
  {
    date: "Jan 15, 2026",
    title: "Analysis Engine Slowdown",
    description: "The AI analysis engine experienced higher than normal latency due to increased demand. Additional compute capacity was provisioned to resolve the issue.",
    status: "Resolved",
  },
  {
    date: "Dec 22, 2025",
    title: "Scheduled Maintenance",
    description: "Planned database migration to improve query performance. The platform was in read-only mode for approximately 20 minutes during off-peak hours.",
    status: "Resolved",
  },
];

export default function StatusPage() {
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
      <section className="relative pt-32 pb-8 sm:pt-40 sm:pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-5xl sm:text-6xl md:text-7xl text-white mb-8"
            >
              System Status
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Status Banner */}
      <section className="relative px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-emerald-500/20 bg-emerald-500/[0.03] p-6 flex items-center gap-4"
          >
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
            <span
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-emerald-400/80 text-sm font-medium"
            >
              All Systems Operational
            </span>
          </motion.div>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Services */}
      <section className="relative py-16 sm:py-24 px-6">
        <div className="max-w-4xl mx-auto">
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
                Services
              </span>
              <div className="h-px w-12 bg-white/20" />
            </div>
          </motion.div>

          <div className="space-y-4">
            {services.map((service, index) => {
              const days = generateUptimeDays(service.uptime);
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="border border-white/10 p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <h3
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-sm font-medium text-white"
                      >
                        {service.name}
                      </h3>
                      <span
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-[10px] px-2 py-0.5 border border-emerald-500/30 text-emerald-400/70 uppercase tracking-wider"
                      >
                        {service.status}
                      </span>
                    </div>
                    <span
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                      className="text-2xl text-white"
                    >
                      {service.uptime}
                    </span>
                  </div>

                  {/* 30-day bar */}
                  <div className="flex gap-[2px]">
                    {days.map((up, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 h-8",
                          up ? "bg-emerald-500/30" : "bg-red-500/30"
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-[10px] text-white/20"
                    >
                      30 days ago
                    </span>
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-[10px] text-white/20"
                    >
                      Today
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Incident History */}
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
                Incident History
              </span>
              <div className="h-px w-12 bg-white/20" />
            </div>
          </motion.div>

          <div className="space-y-0">
            {incidents.map((incident, index) => (
              <motion.div
                key={incident.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="border-b border-white/[0.05] py-6 first:pt-0 last:border-b-0"
              >
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <p
                    style={{ fontFamily: "'Geist Mono', monospace" }}
                    className="text-xs text-white/30"
                  >
                    {incident.date}
                  </p>
                  <span
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-[10px] px-2 py-0.5 border border-white/10 text-white/30 uppercase tracking-wider"
                  >
                    {incident.status}
                  </span>
                </div>
                <h3
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-sm font-medium text-white mb-2"
                >
                  {incident.title}
                </h3>
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-sm text-white/35 leading-relaxed"
                >
                  {incident.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
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
              Status Notifications
            </h2>
            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-white/40 text-sm mb-6"
            >
              Get notified about service disruptions and scheduled maintenance.
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
