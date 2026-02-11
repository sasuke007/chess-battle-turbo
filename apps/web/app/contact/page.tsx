"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Mail, Clock, ArrowRight, Twitter, Github, Youtube } from "lucide-react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const faqTeasers = [
  { question: "How do I reset my password?", href: "/help" },
  { question: "Can I import games from Chess.com?", href: "/help" },
  { question: "How does the rating system work?", href: "/help" },
];

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.email.trim() || !formData.email.includes("@")) newErrors.email = true;
    if (!formData.message.trim()) newErrors.message = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitted(true);
  };

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
                Contact
              </span>
              <div className="h-px w-12 bg-white/20" />
            </div>
            <h1
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-5xl sm:text-6xl md:text-7xl text-white mb-4"
            >
              Get in Touch
            </h1>
            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-lg text-white/40 max-w-xl mx-auto"
            >
              Have a question, feedback, or partnership idea? We&apos;d love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Content */}
      <section className="relative py-16 sm:py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
          >
            {submitted ? (
              <div className="border border-white/10 p-12 text-center">
                <span className="text-4xl mb-6 block">♔</span>
                <h2
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="text-3xl text-white mb-4"
                >
                  Message Sent
                </h2>
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-white/40"
                >
                  We&apos;ll get back to you within 24 hours. Thanks for reaching out!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="block text-xs text-white/50 uppercase tracking-widest mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setErrors({ ...errors, name: false });
                    }}
                    className={cn(
                      "w-full bg-white/[0.03] border px-4 py-3 text-sm text-white",
                      "placeholder:text-white/20",
                      "focus:outline-none focus:border-white/30 focus:bg-white/[0.05]",
                      "transition-all duration-300",
                      errors.name ? "border-white/30" : "border-white/10"
                    )}
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="block text-xs text-white/50 uppercase tracking-widest mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setErrors({ ...errors, email: false });
                    }}
                    className={cn(
                      "w-full bg-white/[0.03] border px-4 py-3 text-sm text-white",
                      "placeholder:text-white/20",
                      "focus:outline-none focus:border-white/30 focus:bg-white/[0.05]",
                      "transition-all duration-300",
                      errors.email ? "border-white/30" : "border-white/10"
                    )}
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="block text-xs text-white/50 uppercase tracking-widest mb-2"
                  >
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className={cn(
                      "w-full bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-white",
                      "focus:outline-none focus:border-white/30 focus:bg-white/[0.05]",
                      "transition-all duration-300 appearance-none"
                    )}
                    style={{ fontFamily: "'Geist', sans-serif" }}
                  >
                    <option value="general" className="bg-black">General Inquiry</option>
                    <option value="support" className="bg-black">Technical Support</option>
                    <option value="billing" className="bg-black">Billing Question</option>
                    <option value="partnership" className="bg-black">Partnership</option>
                    <option value="press" className="bg-black">Press & Media</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="block text-xs text-white/50 uppercase tracking-widest mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      setErrors({ ...errors, message: false });
                    }}
                    rows={6}
                    className={cn(
                      "w-full bg-white/[0.03] border px-4 py-3 text-sm text-white resize-none",
                      "placeholder:text-white/20",
                      "focus:outline-none focus:border-white/30 focus:bg-white/[0.05]",
                      "transition-all duration-300",
                      errors.message ? "border-white/30" : "border-white/10"
                    )}
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  className={cn(
                    "group relative overflow-hidden",
                    "px-8 py-3 bg-white text-black",
                    "text-sm font-medium",
                    "transition-all duration-300"
                  )}
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  <span className="absolute inset-0 bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  <span className="relative flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                    Send Message
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </form>
            )}
          </motion.div>

          {/* Info Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 lg:border-l lg:border-white/10 lg:pl-16"
          >
            <div className="space-y-10">
              {/* Email */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-xs text-white/50 uppercase tracking-widest"
                  >
                    Email Us
                  </p>
                </div>
                <a
                  href="mailto:hello@chessbattle.com"
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  hello@chessbattle.com
                </a>
              </div>

              {/* Response time */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                  <p
                    style={{ fontFamily: "'Geist', sans-serif" }}
                    className="text-xs text-white/50 uppercase tracking-widest"
                  >
                    Response Time
                  </p>
                </div>
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-sm text-white/40"
                >
                  We typically respond within 24 hours during business days.
                </p>
              </div>

              {/* Social */}
              <div>
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-xs text-white/50 uppercase tracking-widest mb-3"
                >
                  Follow Us
                </p>
                <div className="flex items-center gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className={cn(
                        "w-10 h-10 border border-white/10",
                        "flex items-center justify-center",
                        "hover:border-white/30 hover:bg-white hover:text-black",
                        "text-white/40 transition-all duration-300"
                      )}
                    >
                      <social.icon className="w-4 h-4" strokeWidth={1.5} />
                    </a>
                  ))}
                </div>
              </div>

              {/* FAQ Teasers */}
              <div>
                <p
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  className="text-xs text-white/50 uppercase tracking-widest mb-3"
                >
                  Common Questions
                </p>
                <div className="space-y-2">
                  {faqTeasers.map((faq) => (
                    <Link
                      key={faq.question}
                      href={faq.href}
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="group flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                    >
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      {faq.question}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
