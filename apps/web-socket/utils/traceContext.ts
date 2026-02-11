import * as Sentry from "@sentry/node";

interface TraceContext {
  sentryTrace: string;
  baggage: string;
}

const gameTraceContexts = new Map<string, TraceContext>();

export function setGameTraceContext(
  gameReferenceId: string,
  traceContext: TraceContext
): void {
  gameTraceContexts.set(gameReferenceId, traceContext);
}

export function getGameTraceContext(
  gameReferenceId: string
): TraceContext | undefined {
  return gameTraceContexts.get(gameReferenceId);
}

export function removeGameTraceContext(gameReferenceId: string): void {
  gameTraceContexts.delete(gameReferenceId);
}

/**
 * Wraps a callback in a Sentry span linked to the game's trace context.
 * Falls back to a plain startSpan if no trace context exists (graceful degradation).
 */
export function withGameTrace<T>(
  gameReferenceId: string,
  spanOptions: { name: string; op: string; attributes?: Record<string, string> },
  callback: () => T
): T {
  const traceContext = gameTraceContexts.get(gameReferenceId);

  if (traceContext) {
    return Sentry.continueTrace(
      {
        sentryTrace: traceContext.sentryTrace,
        baggage: traceContext.baggage,
      },
      () => {
        return Sentry.startSpan(spanOptions, callback);
      }
    );
  }

  // No trace context — fall back to isolated span
  return Sentry.startSpan(spanOptions, callback);
}
