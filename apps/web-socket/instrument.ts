import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://0ffb20274fdcf99c97a3dc4de1923a0a@o4510201161187328.ingest.us.sentry.io/4510201161908224",

  environment: process.env.NODE_ENV || "development",

  tracesSampleRate: 1,

  enableLogs: true,

  sendDefaultPii: true,

  serverName: "web-socket",
});
