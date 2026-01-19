"use client"

import React, {useState} from 'react'
import {Navbar} from '../components/Navbar'
import {Footer} from '../components/Footer'
import {Bot, Check, ChevronDown, Video} from 'lucide-react'
import {AnimatePresence, motion} from 'motion/react'

//TODO: look at the https://dreamcut.ai/pricing page and the fade in animation when you scroll down implement then using motion/react.
export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const pricingPlans = [
    {
      name: "Basic",
      price: isYearly ? "8" : "10",
      originalPrice: isYearly ? "10" : null,
      description: isYearly ? "billed annually ($96/yr)" : "billed monthly",
      features: [
        "Unlimited Legendary Positions",
        "Record & Export",
        "1080p, High quality, 30 FPS",
        "Up to 15 mins recordings",
        "500 MB storage",
        "Basic AI Analysis"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Creator",
      price: isYearly ? "25" : "30",
      originalPrice: isYearly ? "30" : null,
      description: isYearly ? "billed annually ($300/yr)" : "billed monthly",
      features: [
        "Unlimited Everything",
        "4K, Perfect quality, 60 FPS",
        "Unlimited recordings",
        "50 GB storage",
        "AI Voices (240 mins per month)",
        "Deep Analysis (2,000,000 nodes)",
        "Remove background noise",
        "Transcribe Audio/Video",
        "Premium backgrounds and videos",
        "Custom Branding"
      ],
      cta: "Go Creator",
      popular: true
    }
  ]

  const faqs = [
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all new subscriptions. If you're not satisfied with Chess Battle Turbo, you can request a full refund within the first 30 days of your subscription. Refunds are subject to a 5% processing fee and usage fees."
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
    <div className="min-h-screen bg-neutral-900 text-white">
      <Navbar />

      {/* Hero Section with Video Background */}
      <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 min-w-full min-h-full w-auto h-auto opacity-[0.3] object-cover"
        >
          <source
            src="/Kings_Gambit_Chess_Board_Animation.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/30 via-neutral-900/50 to-neutral-900 pointer-events-none"></div>
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-6"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-800  to-neutral-300">
              Pricing
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-neutral-400 max-w-2xl"
          >
            All-in-one chess creation suite. Powered by AI.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative z-10">
        <main>
          <section className="py-20">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-md text-neutral-400 mb-8 mx-auto"
              >
                Game Recorder, Position Editor, AI Assistant, Voice Coach, Analysis Generator - all in one powerful package.
              </motion.p>

              {/* Billing Toggle */}
              <div className="flex justify-center items-center mb-8">
                <span className={`mr-2 ${!isYearly ? 'text-white' : 'text-neutral-400'}`}>Monthly</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isYearly}
                    onChange={() => setIsYearly(!isYearly)}
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
                <span className={`ml-2 ${isYearly ? 'text-white' : 'text-neutral-400'}`}>
                  Yearly <span className="text-xs ml-2 bg-neutral-800 rounded-lg px-2 py-1 text-white">Save 20%</span>
                </span>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {pricingPlans.map((plan, idx) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-2xl flex flex-col max-w-sm md:max-w-none mx-auto w-full backdrop-blur-md transition-all duration-500 hover:scale-[1.02] group overflow-hidden border border-white/5 ${
                    plan.popular ? 'bg-neutral-700/30' : 'bg-neutral-800/30'
                  }`}
                >
                  <div className="relative z-10 flex flex-col h-full">
                    <h3 className="text-sm font-medium text-white mb-2">
                      {plan.name}
                    </h3>
                    <hr className="border-0 h-[1px] bg-white/5 mb-4" />
                    <div className="mb-4">
                      <span className="text-lg text-neutral-300">${plan.price}</span>
                      {plan.originalPrice && <span className="text-sm line-through opacity-50 ml-2">${plan.originalPrice}</span>}
                      <br />
                      <span className="text-xs text-neutral-500">{plan.description}</span>
                    </div>
                    <ul className="space-y-4 flex-grow mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="grid grid-cols-[28px_auto] items-start text-sm text-neutral-300">
                          <Check className="w-4 h-4 mr-2 mt-1 opacity-30" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button className={`w-full p-2.5 text-white rounded-xl transition-all duration-500 text-xs font-medium ${
                      plan.popular ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg' : 'bg-neutral-950 hover:bg-neutral-900 border border-white/5'
                    }`}>
                      {plan.cta}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-sm text-neutral-500 text-center mt-8 mb-8 max-w-xl mx-auto p-4">
              Join our community of chess creators and masters. Get priority access to new features and shape the future of chess training.
            </p>
          </section>
              </main>
              
        {/*TODO: Here we can do supported channels*/}
        {/* Creator Logos */}
        <div className="mt-20">
          <div className="w-full max-w-3xl mx-auto">
            <p className="text-center text-white/50 mb-4 text-sm font-light">Supported by grandmasters at</p>
            <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 6%, rgb(0, 0, 0) 12%, rgb(0, 0, 0) 88%, rgba(0, 0, 0, 0) 94%, rgba(0, 0, 0, 0) 100%)' }}>
              <div className="flex animate-scroll whitespace-nowrap py-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex-shrink-0 mx-8">
                    <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-12 text-center">Compare Plans</h2>
            <div className="overflow-x-auto border border-white/5 rounded-2xl">
              <table className="w-full rounded-2xl overflow-hidden text-sm">
                <thead>
                  <tr>
                    <th className="p-4 text-left bg-neutral-600/10"></th>
                    <th className="p-4 text-center bg-neutral-600/10">
                      <h3 className="text-sm font-medium text-white mb-2">Basic</h3>
                      <p className="text-xl font-light text-neutral-400">$8</p>
                    </th>
                    <th className="p-4 text-center">
                      <h3 className="text-sm font-medium text-white mb-2">Creator</h3>
                      <p className="text-xl font-light text-neutral-400">$25</p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="p-4 text-sm font-medium text-white bg-neutral-600/10 flex items-center gap-2">
                      Chess Tools <Video className="w-3 h-3" />
                    </td>
                  </tr>
                  {[
                    { label: "Positions", basic: "Unlimited", creator: "Unlimited" },
                    { label: "Record & Export", basic: "✓", creator: "✓" },
                    { label: "Quality", basic: "1080p", creator: "4K, 60 FPS" },
                    { label: "Recording Length", basic: "15 mins", creator: "Unlimited" },
                  ].map((row) => (
                    <tr key={row.label} className="border-t border-neutral-800">
                      <td className="p-4 text-neutral-400 bg-neutral-600/20">{row.label}</td>
                      <td className="p-4 text-center text-neutral-400 bg-neutral-600/10">{row.basic}</td>
                      <td className="p-4 text-center text-neutral-400">{row.creator}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="p-4 text-sm font-medium text-white bg-neutral-600/10 flex items-center gap-2">
                      AI Features <Bot className="w-3 h-3" />
                    </td>
                  </tr>
                  {[
                    { label: "AI Voice Coach", basic: "-", creator: "240 min/mo" },
                    { label: "AI Analysis", basic: "Basic", creator: "2M nodes/mo" },
                  ].map((row) => (
                    <tr key={row.label} className="border-t border-neutral-800">
                      <td className="p-4 text-neutral-400 bg-neutral-600/20">{row.label}</td>
                      <td className="p-4 text-center text-neutral-400 bg-neutral-600/10">{row.basic}</td>
                      <td className="p-4 text-center text-neutral-400">{row.creator}</td>
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-neutral-800 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-4 text-left flex justify-between items-center bg-neutral-800/30 hover:bg-neutral-700/30 transition-colors"
                  >
                    <span className="text-md font-light text-white">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-neutral-800/10 text-sm text-neutral-400 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
