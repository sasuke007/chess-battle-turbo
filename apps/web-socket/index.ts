import express from 'express';
import { createServer } from 'node:http';
import { Server } from "socket.io";

const app = express();

const server = createServer(app);
const io = new Server(server);



io.on('connection', (socket) => {
  console.log('a user connected, socket id:', socket.id);

  socket.emit('welcome', { message: 'Welcome to the server!', socketId: socket.id });

  socket.on('message', (message) => {
    console.log('message received:', message);
    
    // Send acknowledgment back to the sender
    socket.emit('messageReceived', { 
      status: 'success',
      receivedAt: new Date().toISOString(),
      data: message 
    });
  });
  
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});


server.listen(3002, () => {
  console.log('server running at http://localhost:3002');
});

