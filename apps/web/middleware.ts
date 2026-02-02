import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Scraper routes use API key authentication instead of Clerk
const isScraperRoute = createRouteMatcher(['/api/scraper(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Skip Clerk auth for scraper routes (they use X-API-Key header)
  if (isScraperRoute(req)) {
    return
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and PWA service worker files
    '/((?!_next|sw\\.js|workbox-.*|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}