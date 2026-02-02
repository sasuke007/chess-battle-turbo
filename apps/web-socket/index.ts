import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
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

const app = express();

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "WebSocket server is running" });
});

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

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("Client connected, socket id:", socket.id);

  // Handle player joining a game
  socket.on("join_game", async (payload: JoinGamePayload) => {
    try {
      const { gameReferenceId, userReferenceId } = payload;
      console.log(
        `join_game event: gameRef=${gameReferenceId}, user=${userReferenceId}`
      );

      await gameManager.handleJoinGame(socket, gameReferenceId, userReferenceId);
    } catch (error) {
      console.error("Error in join_game handler:", error);
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to join game",
      });
    }
  });

  // Handle move attempts
  socket.on("make_move", async (payload: MakeMovePayload) => {
    try {
      const { gameReferenceId, from, to, promotion } = payload;
      console.log(
        `make_move event: game=${gameReferenceId}, from=${from}, to=${to}`
      );

      await gameManager.handleMove(
        socket,
        gameReferenceId,
        from,
        to,
        promotion
      );
    } catch (error) {
      console.error("Error in make_move handler:", error);
      socket.emit("move_error", {
        message: error instanceof Error ? error.message : "Failed to make move",
      });
    }
  });

  // Handle resignation
  socket.on("resign", async (payload: ResignPayload) => {
    try {
      const { gameReferenceId } = payload;
      console.log(`resign event: game=${gameReferenceId}`);

      await gameManager.handleResign(socket, gameReferenceId);
    } catch (error) {
      console.error("Error in resign handler:", error);
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to resign",
      });
    }
  });

  // Handle draw offer
  socket.on("offer_draw", (payload: OfferDrawPayload) => {
    try {
      const { gameReferenceId } = payload;
      console.log(`offer_draw event: game=${gameReferenceId}`);

      gameManager.handleOfferDraw(socket, gameReferenceId);
    } catch (error) {
      console.error("Error in offer_draw handler:", error);
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to offer draw",
      });
    }
  });

  // Handle draw acceptance
  socket.on("accept_draw", async (payload: AcceptDrawPayload) => {
    try {
      const { gameReferenceId } = payload;
      console.log(`accept_draw event: game=${gameReferenceId}`);

      await gameManager.handleAcceptDraw(socket, gameReferenceId);
    } catch (error) {
      console.error("Error in accept_draw handler:", error);
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to accept draw",
      });
    }
  });

  // Handle draw decline
  socket.on("decline_draw", (payload: DeclineDrawPayload) => {
    try {
      const { gameReferenceId } = payload;
      console.log(`decline_draw event: game=${gameReferenceId}`);

      gameManager.handleDeclineDraw(socket, gameReferenceId);
    } catch (error) {
      console.error("Error in decline_draw handler:", error);
    }
  });

  // Handle analysis phase completion (client countdown finished)
  socket.on("analysis_complete", (payload: AnalysisCompletePayload & { userReferenceId?: string }) => {
    try {
      const { gameReferenceId, userReferenceId } = payload;
      console.log(`analysis_complete event: game=${gameReferenceId}, user=${userReferenceId}`);

      if (!userReferenceId) {
        socket.emit("error", { message: "userReferenceId required for analysis_complete" });
        return;
      }

      gameManager.handleAnalysisComplete(socket, gameReferenceId, userReferenceId);
    } catch (error) {
      console.error("Error in analysis_complete handler:", error);
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to handle analysis complete",
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected, socket id:", socket.id);
    gameManager.handleDisconnect(socket);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  gameManager.destroy();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  gameManager.destroy();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`WebSocket server running at http://localhost:${PORT}`);
  console.log(`Active games: ${gameManager.getActiveGameCount()}`);
});
