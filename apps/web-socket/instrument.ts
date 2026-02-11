import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://0ac8e0fadeba7cf5390dae687a6178b2@o4510201161187328.ingest.us.sentry.io/4510869014904832",
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
  serverName: "web-socket",
});
