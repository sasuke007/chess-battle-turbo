"use client";

import React from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import Link from "next/link";
import * as m from "motion/react-m";
import { cn } from "../../lib/utils";
import { safeJsonLd } from "../../lib/seo";
import { Home, Gamepad2, Clock, Swords, Users, DollarSign, Shield, BookOpen, Crown, Grid3X3 } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

// Routes where breadcrumbs should be hidden
const hiddenRoutes = ["/", "/sign-in", "/onboarding"];

// Icons for breadcrumb items
const icons = {
  home: <Home className="w-3 h-3" />,
  play: <Gamepad2 className="w-3 h-3" />,
  queue: <Clock className="w-3 h-3" />,
  game: <Swords className="w-3 h-3" />,
  join: <Users className="w-3 h-3" />,
  pricing: <DollarSign className="w-3 h-3" />,
  admin: <Shield className="w-3 h-3" />,
  legends: <Crown className="w-3 h-3" />,
  openings: <Grid3X3 className="w-3 h-3" />,
  blog: <BookOpen className="w-3 h-3" />,
};

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/", icon: icons.home },
  ];

  if (pathname.startsWith("/play")) {
    breadcrumbs.push({ label: "Play", href: "/play", icon: icons.play });
  }

  if (pathname.startsWith("/queue")) {
    breadcrumbs.push({ label: "Play", href: "/play", icon: icons.play });
    breadcrumbs.push({ label: "Queue", href: "/queue", icon: icons.queue });
  }

  if (pathname.startsWith("/game/")) {
    breadcrumbs.push({ label: "Play", href: "/play", icon: icons.play });
    breadcrumbs.push({ label: "Game", href: pathname, icon: icons.game });
  }

  if (pathname.startsWith("/join/")) {
    breadcrumbs.push({ label: "Join Game", href: pathname, icon: icons.join });
  }

  if (pathname.startsWith("/pricing")) {
    breadcrumbs.push({ label: "Pricing", href: "/pricing", icon: icons.pricing });
  }

  if (pathname.startsWith("/admin/legends")) {
    breadcrumbs.push({ label: "Admin", href: "/admin/legends", icon: icons.admin });
    breadcrumbs.push({ label: "Legends", href: "/admin/legends", icon: icons.legends });
  }

  if (pathname === "/legends") {
    breadcrumbs.push({ label: "Legends", href: "/legends", icon: icons.legends });
  } else if (pathname.startsWith("/legends/")) {
    breadcrumbs.push({ label: "Legends", href: "/legends", icon: icons.legends });
    breadcrumbs.push({ label: "Legend", href: pathname, icon: icons.legends });
  }

  if (pathname === "/openings") {
    breadcrumbs.push({ label: "Openings", href: "/openings", icon: icons.openings });
  } else if (pathname.startsWith("/openings/")) {
    breadcrumbs.push({ label: "Openings", href: "/openings", icon: icons.openings });
    breadcrumbs.push({ label: "Opening", href: pathname, icon: icons.openings });
  }

  if (pathname === "/blog") {
    breadcrumbs.push({ label: "Blog", href: "/blog", icon: icons.blog });
  } else if (pathname.startsWith("/blog/")) {
    breadcrumbs.push({ label: "Blog", href: "/blog", icon: icons.blog });
    breadcrumbs.push({ label: "Article", href: pathname, icon: icons.blog });
  }

  return breadcrumbs;
}

export const Breadcrumbs = () => {
  const pathname = usePathname();

  // Hide breadcrumbs on specific routes
  if (hiddenRoutes.some((route) => pathname === route || pathname.startsWith("/sign-in"))) {
    return null;
  }

  const breadcrumbs = getBreadcrumbs(pathname);

  // Don't show if only home breadcrumb
  if (breadcrumbs.length <= 1) {
    return null;
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `https://playchess.tech${crumb.href}`,
    })),
  };

  return (
    <>
      <Script id="breadcrumb-jsonld" type="application/ld+json">
        {safeJsonLd(breadcrumbJsonLd)}
      </Script>
      <m.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "fixed top-[68px] left-0 right-0 z-40",
          "flex items-center",
          "px-4 sm:px-6 lg:px-8 py-2",
          "bg-black/60 backdrop-blur-md",
          "border-b border-white/[0.05]"
        )}
      >
        <nav className="flex items-center gap-1.5">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <React.Fragment key={crumb.href + index}>
                {index > 0 && (
                  <span
                    className="text-white/20 text-[10px] mx-1 select-none"
                    style={{ fontFamily: "'Geist', sans-serif" }}
                  >
                    /
                  </span>
                )}
                {isLast ? (
                  <span
                    className={cn(
                      "flex items-center gap-1.5",
                      "text-[10px] sm:text-[11px] uppercase tracking-[0.12em]",
                      "text-white/50"
                    )}
                    style={{ fontFamily: "'Geist', sans-serif" }}
                  >
                    {crumb.icon}
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className={cn(
                      "flex items-center gap-1.5",
                      "text-[10px] sm:text-[11px] uppercase tracking-[0.12em]",
                      "text-white/40 hover:text-white/70",
                      "transition-colors duration-200"
                    )}
                    style={{ fontFamily: "'Geist', sans-serif" }}
                  >
                    {crumb.icon}
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </m.div>
    </>
  );
};
