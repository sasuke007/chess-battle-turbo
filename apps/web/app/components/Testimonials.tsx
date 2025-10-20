"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";

interface Testimonial {
  id: number;
  name: string;
  username: string;
  avatar: string;
  content: string;
  verified: boolean;
  gridSpan?: string;
  likes: number;
  retweets: number;
  replies: number;
}

export const Testimonials = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Alex Chen",
      username: "@alexchess",
      avatar: "👨‍💼",
      content:
        "Just won $500 against my friend! 🎉 Chess Battle makes playing chess so much more exciting. The platform is smooth and payouts are instant!",
      verified: true,
      gridSpan: "md:col-span-2 md:row-span-2",
      likes: 234,
      retweets: 45,
      replies: 23,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      username: "@sarahjgames",
      avatar: "👩‍🦰",
      content:
        "Finally, a chess platform that rewards skill! Love the competitive aspect. I've been playing chess online for years, but nothing compares to the thrill of Chess Battle. The interface is intuitive, the matchmaking is fair, and the community is incredibly supportive. What really sets it apart is how it transforms every game into something meaningful. You're not just moving pieces anymore - you're making strategic decisions that have real consequences. It's brought back my passion for chess in a way I didn't think was possible.",
      verified: true,
      gridSpan: "md:col-span-1 md:row-span-1",
      likes: 156,
      retweets: 32,
      replies: 12,
    },
    {
      id: 3,
      name: "Marcus Williams",
      username: "@marcuschamp",
      avatar: "👨‍🎓",
      content:
        "The best way to settle chess debates with friends. Clean interface, fair play, and the thrill of real stakes!",
      verified: false,
      gridSpan: "md:col-span-1 md:row-span-1",
      likes: 189,
      retweets: 28,
      replies: 15,
    },
    {
      id: 4,
      name: "Emma Davis",
      username: "@emmaplays",
      avatar: "👸",
      content:
        "Been using Chess Battle for 3 months now. The community is amazing and the platform is super reliable. Highly recommend! ♟️",
      verified: true,
      gridSpan: "md:col-span-2 md:row-span-1",
      likes: 312,
      retweets: 67,
      replies: 34,
    },
    {
      id: 5,
      name: "David Park",
      username: "@davidchessking",
      avatar: "🤴",
      content:
        "Never thought I'd make money from my chess hobby. Chess Battle changed that. Great security and fair matchmaking! 🔥 The platform handles everything seamlessly - from game creation to payouts. I particularly love how the escrow system works. Both players deposit their stakes, and the winner automatically receives the full amount. No disputes, no delays, just pure chess competition. I've been playing almost every day for the past two months and it's become my favorite way to unwind after work. Plus, I've actually turned a profit!",
      verified: true,
      gridSpan: "md:col-span-1 md:row-span-1",
      likes: 198,
      retweets: 41,
      replies: 19,
    },
    {
      id: 6,
      name: "Olivia Martinez",
      username: "@oliviawins",
      avatar: "👩‍💻",
      content:
        "The adrenaline rush of playing for real stakes is unmatched. Plus the platform handles everything seamlessly.",
      verified: false,
      gridSpan: "md:col-span-2 md:row-span-1",
      likes: 145,
      retweets: 29,
      replies: 11,
    },
    {
      id: 7,
      name: "James Wilson",
      username: "@jameswchess",
      avatar: "👨‍🚀",
      content:
        "As a competitive player, this platform gives me the edge I've been looking for. The stakes make every move count!",
      verified: true,
      gridSpan: "md:col-span-1 md:row-span-2",
      likes: 267,
      retweets: 53,
      replies: 28,
    },
    {
      id: 8,
      name: "Sophia Lee",
      username: "@sophiachess",
      avatar: "👩‍🎨",
      content:
        "Amazing experience! Won three games in a row yesterday. The interface is beautiful and everything just works smoothly. As someone who's picky about design, I have to say the UI/UX is top-notch. The board is crisp, the pieces are elegant, and the animations are buttery smooth. But beyond aesthetics, the functionality is what really impressed me. Move validation is instant, the timer is accurate, and I've never experienced any lag or disconnections. The notification system keeps you updated without being intrusive. This is how a modern chess platform should be built!",
      verified: true,
      gridSpan: "md:col-span-1 md:row-span-1",
      likes: 178,
      retweets: 35,
      replies: 16,
    },
    {
      id: 9,
      name: "Ryan Garcia",
      username: "@ryanrook",
      avatar: "🧑‍💼",
      content:
        "Chess Battle is a game changer! The thrill of competing for real money adds a whole new dimension to chess. Love it!",
      verified: false,
      gridSpan: "md:col-span-2 md:row-span-1",
      likes: 223,
      retweets: 48,
      replies: 21,
    },
    {
      id: 10,
      name: "Isabella Brown",
      username: "@isachess",
      avatar: "👩‍🔬",
      content:
        "Best chess platform I've used. Clean, fast, and fair. Already recommended to all my chess buddies! I'm part of a local chess club and after I shared my experience, half of our members have signed up. We now host weekly tournaments through the platform. The ability to set custom stake amounts means we can cater to everyone's comfort level - from casual $5 games to more serious $100+ matches. The transparency in the system builds trust, and the customer support team is incredibly responsive. This has genuinely enhanced our entire chess community's experience.",
      verified: true,
      gridSpan: "md:col-span-1 md:row-span-1",
      likes: 134,
      retweets: 26,
      replies: 9,
    },
    {
      id: 11,
      name: "Michael Torres",
      username: "@miketorres",
      avatar: "👨‍🏫",
      content:
        "Playing chess with real stakes brings out the best strategic thinking. The community here is top-notch too!",
      verified: true,
      gridSpan: "md:col-span-2 md:row-span-1",
      likes: 201,
      retweets: 43,
      replies: 18,
    },
    {
      id: 12,
      name: "Ava Anderson",
      username: "@avachessqueen",
      avatar: "👸🏻",
      content:
        "This platform makes chess exciting again! Earned enough to cover my monthly coffee budget. Thanks Chess Battle! ☕♟️ What started as a casual experiment has turned into a genuine side income. I play 3-4 games a week, usually in the evenings when I have some free time. The stakes are reasonable, so even when I lose, it's not a big deal. But when I win, it feels amazing! The platform has helped me improve my game significantly because I'm more focused when real stakes are involved. My rating has gone up by 200 points in just three months!",
      verified: false,
      gridSpan: "md:col-span-1 md:row-span-1",
      likes: 167,
      retweets: 31,
      replies: 14,
    },
    {
      id: 13,
      name: "Chris Thompson",
      username: "@christhompson",
      avatar: "👨‍💻",
      content:
        "I've been playing chess for over 10 years and this is by far the most engaging platform I've found. The ability to play for real stakes adds a whole new level of excitement. Every move matters more when there's actual money on the line. The platform is incredibly secure, the interface is beautiful, and the community is respectful. I've made some good friends here and even better, I've earned enough to fund my next tournament entry! Highly recommend to serious chess players.",
      verified: true,
      gridSpan: "md:col-span-2 md:row-span-2",
      likes: 389,
      retweets: 78,
      replies: 42,
    },
  ];

  return (
    <div></div>
  );
};

