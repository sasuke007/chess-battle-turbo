import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

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


io.on("connection", (socket) => {
  console.log("a user connected, socket id:", socket.id);

  socket.on("move", (move) => {
    console.log("move received:", move);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

server.listen(3002, () => {
  console.log("server running at http://localhost:3002");
});
