import * as Sentry from "@sentry/nextjs";

export function trackUserAction(action: string, attributes?: Record<string, string | number | boolean>) {
  Sentry.metrics.count("user_action", 1, { attributes: { action, ...attributes } });
}

export function trackApiResponseTime(endpoint: string, durationMs: number) {
  Sentry.metrics.distribution("api_response_time", durationMs, {
    unit: "millisecond",
    attributes: { endpoint },
  });
}
