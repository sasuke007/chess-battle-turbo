import "./instrument";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import * as Sentry from "@sentry/node";
import { GameManager } from "./GameManager";
import {
  JoinGamePayload,
  MakeMovePayload,
  ResignPayload,
  OfferDrawPayload,
  AcceptDrawPayload,
  DeclineDrawPayload,
  AnalysisCompletePayload,
} from "./types";
import {
  captureSocketError,
  addSocketBreadcrumb,
  trackSocketEvent,
  trackActiveConnections,
  trackActiveGames,
  flushSentry,
} from "./utils/sentry";
import { logger } from "./utils/logger";

const app = express();

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "WebSocket server is running" });
});

// Sentry error handler for Express (must be after all routes)
Sentry.setupExpressErrorHandler(app);

const server = createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize GameManager
const gameManager = new GameManager();

// Periodically report active game count
const metricsInterval = setInterval(() => {
  trackActiveGames(gameManager.getActiveGameCount());
}, 30_000);

// Socket.IO connection handler
io.on("connection", (socket) => {
  logger.info(`Client connected, socket id: ${socket.id}`);
  addSocketBreadcrumb("client_connected", { socketId: socket.id });
  trackActiveConnections(io.engine.clientsCount);

  // Handle player joining a game
  socket.on("join_game", async (payload: JoinGamePayload) => {
    await Sentry.startSpan(
      {
        op: "websocket.event",
        name: "join_game",
        attributes: {
          "game.referenceId": payload.gameReferenceId,
          "user.referenceId": payload.userReferenceId,
          "socket.id": socket.id,
        },
      },
      async () => {
        trackSocketEvent("join_game");
        try {
          const { gameReferenceId, userReferenceId } = payload;
          logger.info(`join_game event: gameRef=${gameReferenceId}, user=${userReferenceId}`);
          addSocketBreadcrumb("join_game", { gameReferenceId, userReferenceId });

          await gameManager.handleJoinGame(socket, gameReferenceId, userReferenceId);
        } catch (error) {
          logger.error(`Error in join_game handler: ${error instanceof Error ? error.message : "Unknown error"}`, error);
          captureSocketError(error, {
            event: "join_game",
            gameReferenceId: payload.gameReferenceId,
            userReferenceId: payload.userReferenceId,
            socketId: socket.id,
          });
          socket.emit("error", {
            message: error instanceof Error ? error.message : "Failed to join game",
          });
        }
      }
    );
  });

  // Handle move attempts
  socket.on("make_move", async (payload: MakeMovePayload) => {
    await Sentry.startSpan(
      {
        op: "websocket.event",
        name: "make_move",
        attributes: {
          "game.referenceId": payload.gameReferenceId,
          "socket.id": socket.id,
          "move.from": payload.from,
          "move.to": payload.to,
        },
      },
      async () => {
        trackSocketEvent("make_move");
        try {
          const { gameReferenceId, from, to, promotion } = payload;
          logger.info(`make_move event: game=${gameReferenceId}, from=${from}, to=${to}`);

          await gameManager.handleMove(
            socket,
            gameReferenceId,
            from,
            to,
            promotion
          );
        } catch (error) {
          logger.error(`Error in make_move handler: ${error instanceof Error ? error.message : "Unknown error"}`, error);
          captureSocketError(error, {
            event: "make_move",
            gameReferenceId: payload.gameReferenceId,
            socketId: socket.id,
            extra: { from: payload.from, to: payload.to },
          });
          socket.emit("move_error", {
            message: error instanceof Error ? error.message : "Failed to make move",
          });
        }
      }
    );
  });

  // Handle resignation
  socket.on("resign", async (payload: ResignPayload) => {
    await Sentry.startSpan(
      {
        op: "websocket.event",
        name: "resign",
        attributes: {
          "game.referenceId": payload.gameReferenceId,
          "socket.id": socket.id,
        },
      },
      async () => {
        trackSocketEvent("resign");
        addSocketBreadcrumb("resign", { gameReferenceId: payload.gameReferenceId });
        try {
          const { gameReferenceId } = payload;
          logger.info(`resign event: game=${gameReferenceId}`);

          await gameManager.handleResign(socket, gameReferenceId);
        } catch (error) {
          logger.error(`Error in resign handler: ${error instanceof Error ? error.message : "Unknown error"}`, error);
          captureSocketError(error, {
            event: "resign",
            gameReferenceId: payload.gameReferenceId,
            socketId: socket.id,
          });
          socket.emit("error", {
            message: error instanceof Error ? error.message : "Failed to resign",
          });
        }
      }
    );
  });

  // Handle draw offer
  socket.on("offer_draw", (payload: OfferDrawPayload) => {
    Sentry.startSpan(
      {
        op: "websocket.event",
        name: "offer_draw",
        attributes: {
          "game.referenceId": payload.gameReferenceId,
          "socket.id": socket.id,
        },
      },
      () => {
        trackSocketEvent("offer_draw");
        addSocketBreadcrumb("offer_draw", { gameReferenceId: payload.gameReferenceId });
        try {
          const { gameReferenceId } = payload;
          logger.info(`offer_draw event: game=${gameReferenceId}`);

          gameManager.handleOfferDraw(socket, gameReferenceId);
        } catch (error) {
          logger.error(`Error in offer_draw handler: ${error instanceof Error ? error.message : "Unknown error"}`, error);
          captureSocketError(error, {
            event: "offer_draw",
            gameReferenceId: payload.gameReferenceId,
            socketId: socket.id,
          });
          socket.emit("error", {
            message: error instanceof Error ? error.message : "Failed to offer draw",
          });
        }
      }
    );
  });

  // Handle draw acceptance
  socket.on("accept_draw", async (payload: AcceptDrawPayload) => {
    await Sentry.startSpan(
      {
        op: "websocket.event",
        name: "accept_draw",
        attributes: {
          "game.referenceId": payload.gameReferenceId,
          "socket.id": socket.id,
        },
      },
      async () => {
        trackSocketEvent("accept_draw");
        addSocketBreadcrumb("accept_draw", { gameReferenceId: payload.gameReferenceId });
        try {
          const { gameReferenceId } = payload;
          logger.info(`accept_draw event: game=${gameReferenceId}`);

          await gameManager.handleAcceptDraw(socket, gameReferenceId);
        } catch (error) {
          logger.error(`Error in accept_draw handler: ${error instanceof Error ? error.message : "Unknown error"}`, error);
          captureSocketError(error, {
            event: "accept_draw",
            gameReferenceId: payload.gameReferenceId,
            socketId: socket.id,
          });
          socket.emit("error", {
            message: error instanceof Error ? error.message : "Failed to accept draw",
          });
        }
      }
    );
  });

  // Handle draw decline
  socket.on("decline_draw", (payload: DeclineDrawPayload) => {
    Sentry.startSpan(
      {
        op: "websocket.event",
        name: "decline_draw",
        attributes: {
          "game.referenceId": payload.gameReferenceId,
          "socket.id": socket.id,
        },
      },
      () => {
        trackSocketEvent("decline_draw");
        try {
          const { gameReferenceId } = payload;
          logger.info(`decline_draw event: game=${gameReferenceId}`);

          gameManager.handleDeclineDraw(socket, gameReferenceId);
        } catch (error) {
          logger.error(`Error in decline_draw handler: ${error instanceof Error ? error.message : "Unknown error"}`, error);
          captureSocketError(error, {
            event: "decline_draw",
            gameReferenceId: payload.gameReferenceId,
            socketId: socket.id,
          });
        }
      }
    );
  });

  // Handle analysis phase completion (client countdown finished)
  socket.on("analysis_complete", (payload: AnalysisCompletePayload & { userReferenceId?: string }) => {
    Sentry.startSpan(
      {
        op: "websocket.event",
        name: "analysis_complete",
        attributes: {
          "game.referenceId": payload.gameReferenceId,
          "socket.id": socket.id,
        },
      },
      () => {
        trackSocketEvent("analysis_complete");
        try {
          const { gameReferenceId, userReferenceId } = payload;
          logger.info(`analysis_complete event: game=${gameReferenceId}, user=${userReferenceId}`);

          if (!userReferenceId) {
            socket.emit("error", { message: "userReferenceId required for analysis_complete" });
            return;
          }

          gameManager.handleAnalysisComplete(socket, gameReferenceId, userReferenceId);
        } catch (error) {
          logger.error(`Error in analysis_complete handler: ${error instanceof Error ? error.message : "Unknown error"}`, error);
          captureSocketError(error, {
            event: "analysis_complete",
            gameReferenceId: payload.gameReferenceId,
            userReferenceId: payload.userReferenceId,
            socketId: socket.id,
          });
          socket.emit("error", {
            message: error instanceof Error ? error.message : "Failed to handle analysis complete",
          });
        }
      }
    );
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    Sentry.startSpan(
      {
        op: "websocket.event",
        name: "disconnect",
        attributes: { "socket.id": socket.id },
      },
      () => {
        logger.info(`Client disconnected, socket id: ${socket.id}`);
        addSocketBreadcrumb("client_disconnected", { socketId: socket.id });
        trackActiveConnections(io.engine.clientsCount);
        trackSocketEvent("disconnect");
        gameManager.handleDisconnect(socket);
      }
    );
  });
});

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully`);
  clearInterval(metricsInterval);
  gameManager.destroy();
  server.close(async () => {
    logger.info("Server closed");
    await flushSentry(2000);
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  logger.info(`WebSocket server running at http://localhost:${PORT}`);
  logger.info(`Active games: ${gameManager.getActiveGameCount()}`);
});
