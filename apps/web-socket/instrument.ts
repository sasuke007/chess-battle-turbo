import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://ba721843d6456c07f881ad87d27cebed@o4510201161187328.ingest.us.sentry.io/4510901669462016",
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
  serverName: "web-socket",
});
