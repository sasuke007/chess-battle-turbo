export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 1,
      enableLogs: true,
      sendDefaultPii: true,
    });
  }
}
