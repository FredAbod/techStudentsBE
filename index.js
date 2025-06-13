import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from "dotenv";
import logger from "./src/utils/log/logger.js";
import connectDB from "./src/database/db.js";
import { setupChallengeWebSocketEvents } from "./src/middleware/websocketEvents.js";
import { setupWebSocketServer } from "./src/middleware/enhancedWebsocket.js";

// Load environment variables first
dotenv.config();

// Import app after environment variables are loaded
import app from "./app.js";

const port = process.env.PORT || 4000;

// Create HTTP server
const server = createServer(app);

// Set up Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Setup WebSocket namespaces and event handlers
setupChallengeWebSocketEvents(io);
// Setup enhanced WebSocket server with new features
setupWebSocketServer(io);

// Attach WebSocket io instance to app for middleware
app.io = io;

// Start the server
server.listen(port, async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log(`Database connected successfully`);
    logger.info(`Server is running on port ${port}`);
    logger.info(`WebSocket server initialized`);
  } catch (error) {
    logger.error(`Error starting server: ${error.message}`);
  }
});
