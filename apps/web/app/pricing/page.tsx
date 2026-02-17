"use client"

import React, { useState } from 'react'
import { Footer } from '../components/Footer'
import { Navbar } from '../components/Navbar'
import { Bot, ChevronDown, Video } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { PricingTable } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all new subscriptions. If you're not satisfied with ReplayChess, you can request a full refund within the first 30 days of your subscription. Refunds are subject to a 5% processing fee and usage fees."
    },
    {
      question: "What does early access include?",
      answer: "Early access gives you a 30% discount + an extra 20% off (yearly plan only) priority access to new features before they're released to the general public. You'll also be invited to our private Slack channel to help shape the product roadmap."
    },
    {
      question: "Can I use my own API keys?",
      answer: "Not at the moment, but we're thinking about it. We're waiting to see if there is significant demand for it. For now, we provide high-performance cloud engines bundled with your subscription."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover) via Stripe. For yearly subscriptions for teams or clubs, we also offer wire transfer options."
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section with Video Background */}
      <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 min-w-full min-h-full w-auto h-auto opacity-20 object-cover grayscale"
        >
          <source
            src="/Kings_Gambit_Chess_Board_Animation.mp4"
            type="video/mp4"
          />
        </video>

        {/* Gradient overlays - matching homepage */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />

        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-6 text-white"
          >
            Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontFamily: "'Geist', sans-serif" }}
            className="text-lg sm:text-xl md:text-2xl text-white/40 max-w-2xl"
          >
            All-in-one chess creation suite. Powered by AI.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative">
        <main>
          <section className="py-10">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{ fontFamily: "'Geist', sans-serif" }}
                className="text-md text-white/40 mb-8 mx-auto"
              >
                Game Recorder, Position Editor, AI Assistant, Voice Coach, Analysis Generator - all in one powerful package.
              </motion.p>
            </div>

            {/* Clerk Pricing Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto px-4 sm:px-6"
            >
              <PricingTable
                appearance={{
                  baseTheme: dark,
                  variables: {
                    colorPrimary: '#ffffff',
                    colorBackground: '#000000',
                    colorInputBackground: '#0a0a0a',
                    colorText: '#ffffff',
                    colorTextSecondary: '#666666',
                    colorNeutral: '#333333',
                    borderRadius: '0',
                    fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
                    fontFamilyButtons: "'Geist', ui-sans-serif, system-ui, sans-serif",
                  },
                  elements: {
                    card: 'bg-black border border-white/10 shadow-none',
                    badge: '',
                    button: '',
                    dividerRow: 'border-white/10',
                    priceTitle: 'text-white',
                    pricingTableGrid: 'gap-6',
                  }
                }}
              />
            </motion.div>

            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-sm text-white/30 text-center mt-8 mb-8 max-w-xl mx-auto p-4"
            >
              Join our community of chess creators and masters. Get priority access to new features and shape the future of chess training.
            </p>
          </section>
        </main>

        {/* Creator Logos */}
        <div className="mt-20">
          <div className="w-full max-w-3xl mx-auto">
            <p
              style={{ fontFamily: "'Geist', sans-serif" }}
              className="text-center text-white/30 mb-4 text-xs uppercase tracking-widest"
            >
              Supported by grandmasters at
            </p>
            <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 6%, rgb(0, 0, 0) 12%, rgb(0, 0, 0) 88%, rgba(0, 0, 0, 0) 94%, rgba(0, 0, 0, 0) 100%)' }}>
              <div className="flex animate-scroll whitespace-nowrap py-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex-shrink-0 mx-8">
                    <div className="h-8 w-24 bg-white/5 border border-white/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-3xl sm:text-4xl lg:text-5xl mb-12 text-center text-white"
            >
              Compare Plans
            </h2>
            <div className="overflow-x-auto border border-white/10">
              <table className="w-full overflow-hidden text-sm">
                <thead>
                  <tr>
                    <th className="p-4 text-left bg-white/5"></th>
                    <th className="p-4 text-center bg-white/5">
                      <h3
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-sm font-medium text-white mb-2"
                      >
                        Basic
                      </h3>
                      <p
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                        className="text-xl text-white/60"
                      >
                        $8
                      </p>
                    </th>
                    <th className="p-4 text-center">
                      <h3
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="text-sm font-medium text-white mb-2"
                      >
                        Creator
                      </h3>
                      <p
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                        className="text-xl text-white/60"
                      >
                        $25
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={3}
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="p-4 text-xs uppercase tracking-widest font-medium text-white/60 bg-white/5 flex items-center gap-2"
                    >
                      Chess Tools <Video className="w-3 h-3" />
                    </td>
                  </tr>
                  {[
                    { label: "Positions", basic: "Unlimited", creator: "Unlimited" },
                    { label: "Record & Export", basic: "✓", creator: "✓" },
                    { label: "Quality", basic: "1080p", creator: "4K, 60 FPS" },
                    { label: "Recording Length", basic: "15 mins", creator: "Unlimited" },
                  ].map((row) => (
                    <tr key={row.label} className="border-t border-white/10">
                      <td
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="p-4 text-white/40 bg-white/[0.02]"
                      >
                        {row.label}
                      </td>
                      <td
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="p-4 text-center text-white/40 bg-white/5"
                      >
                        {row.basic}
                      </td>
                      <td
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="p-4 text-center text-white/40"
                      >
                        {row.creator}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      colSpan={3}
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="p-4 text-xs uppercase tracking-widest font-medium text-white/60 bg-white/5 flex items-center gap-2"
                    >
                      AI Features <Bot className="w-3 h-3" />
                    </td>
                  </tr>
                  {[
                    { label: "AI Voice Coach", basic: "-", creator: "240 min/mo" },
                    { label: "AI Analysis", basic: "Basic", creator: "2M nodes/mo" },
                  ].map((row) => (
                    <tr key={row.label} className="border-t border-white/10">
                      <td
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="p-4 text-white/40 bg-white/[0.02]"
                      >
                        {row.label}
                      </td>
                      <td
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="p-4 text-center text-white/40 bg-white/5"
                      >
                        {row.basic}
                      </td>
                      <td
                        style={{ fontFamily: "'Geist', sans-serif" }}
                        className="p-4 text-center text-white/40"
                      >
                        {row.creator}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              style={{ fontFamily: "'Instrument Serif', serif" }}
              className="text-3xl sm:text-4xl lg:text-5xl mb-12 text-center text-white"
            >
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-5 text-left flex justify-between items-center bg-white/[0.02] hover:bg-white/5 transition-colors"
                  >
                    <span
                      style={{ fontFamily: "'Geist', sans-serif" }}
                      className="text-sm font-medium text-white"
                    >
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div
                          style={{ fontFamily: "'Geist', sans-serif" }}
                          className="p-5 border-t border-white/5 text-sm text-white/40 leading-relaxed"
                        >
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
