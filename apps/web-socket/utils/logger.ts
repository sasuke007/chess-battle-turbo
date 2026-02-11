import * as Sentry from "@sentry/node";

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  info(message: string): void {
    console.log(message);
    Sentry.logger.info(message);
  },

  warn(message: string): void {
    console.warn(message);
    Sentry.logger.warn(message);
  },

  error(message: string, error?: unknown): void {
    if (error !== undefined) {
      console.error(message, error);
    } else {
      console.error(message);
    }
    Sentry.logger.error(message);
  },

  debug(message: string): void {
    if (isDev) {
      console.log(message);
    }
  },
};
