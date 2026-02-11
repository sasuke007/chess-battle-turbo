import * as Sentry from "@sentry/nextjs";

/**
 * Captures the current Sentry trace data (sentry-trace + baggage headers)
 * for propagation to downstream services.
 */
export function captureGameTraceData(): {
  sentryTrace: string;
  baggage: string;
} | null {
  const traceData = Sentry.getTraceData();

  if (!traceData["sentry-trace"]) {
    return null;
  }

  return {
    sentryTrace: traceData["sentry-trace"],
    baggage: traceData["baggage"] || "",
  };
}

/**
 * Builds structured log attributes for game-related Sentry logs.
 */
export function gameLogAttributes(
  gameReferenceId: string,
  extra?: Record<string, string | number | boolean | undefined>
): Record<string, string | number | boolean | undefined> {
  return {
    "game.referenceId": gameReferenceId,
    ...extra,
  };
}
