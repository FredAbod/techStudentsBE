import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import xssClean from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from "helmet";
import cors from "cors";
import http from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from "./src/routes/auth.routes.js";
import profileRoutes from "./src/routes/profile.routes.js";
import studentRoutes from "./src/routes/student.routes.js";
import attendanceRoutes from "./src/routes/attendance.routes.js";
import assignmentRoutes from "./src/routes/assignment.routes.js";
import groupRoutes from "./src/routes/group.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import challengeRoutes from "./src/routes/challenge.routes.js";
import fileUploadChallengeRoutes from "./src/routes/fileupload.challenge.routes.js";
import { setupSwagger } from './src/utils/swagger/swagger.js';
import adminAuthRoutes from './src/routes/admin.auth.routes.js';
import adminStudentRoutes from './src/routes/admin.student.routes.js';
import adminAssignmentRoutes from './src/routes/admin.assignment.routes.js';
import adminDashboardRoutes from './src/routes/admin.dashboard.routes.js';
import adminMcqRoutes from './src/routes/admin.mcq.routes.js';
import adminCodingRoutes from './src/routes/admin.coding.routes.js';
import adminChallengeRoutes from './src/routes/admin.challenge.routes.js';
import adminGradingRoutes from './src/routes/admin.grading.routes.js';
import adminFileUploadRoutes from './src/routes/admin.fileupload.routes.js';
import adminFileUploadAnalyticsRoutes from './src/routes/admin.fileupload.analytics.routes.js';
import systemRoutes from './src/routes/system.routes.js';
import websocketSimulationRoutes from './src/routes/websocket.simulation.routes.js';

// Import WebSocket middleware
import { setupChallengeWebSocketEvents } from './src/middleware/websocketEvents.js';
import { createWebSocketMiddleware, setupWebSocketServer } from './src/middleware/enhancedWebsocket.js';

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Create a WebSocket middleware that will be initialized after server creation
// This middleware will be properly set up in index.js when the io instance is available
app.use((req, res, next) => {
  if (app.io) {
    return createWebSocketMiddleware(app.io)(req, res, next);
  }
  next();
});

// Security middleware
app.use(helmet());
app.use(cors());

// XSS protection middleware
app.use(xssClean());

// MongoDB query sanitizer middleware
app.use(mongoSanitize());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'public', 'index.html'));
});

// Define rate limiter options
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // maximum of 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  keyGenerator: function (req, res) {
    // Generate a unique key using the user token (assuming it's stored in the request header)
    return req.headers.authorization || req.ip;
  },
});

// Apply rate limiter middleware to endpoints matching the prefix
app.use("/api/v1/*", limiter);

// Set up routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profiles", profileRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/groups", groupRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/challenges", challengeRoutes);
app.use("/api/v1/filechallenges", fileUploadChallengeRoutes);
app.use('/api/v1/auth/tutor', adminAuthRoutes);
app.use('/api/v1/admin', adminStudentRoutes);
app.use('/api/v1/admin', adminAssignmentRoutes);
app.use('/api/v1/admin', adminDashboardRoutes);
app.use('/api/v1/admin', adminMcqRoutes);
app.use('/api/v1/admin', adminCodingRoutes);
app.use('/api/v1/admin', adminChallengeRoutes);
app.use('/api/v1/admin', adminGradingRoutes);
app.use('/api/v1/admin', adminFileUploadRoutes);
app.use('/api/v1/admin', adminFileUploadAnalyticsRoutes);
app.use('/api/v1', systemRoutes);
app.use('/api/v1', websocketSimulationRoutes);

// Setup Swagger for API documentation
setupSwagger(app);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Endpoint not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.stack);
  
  res.status(statusCode).json({
    status: "error",
    message: err.message || "An unexpected error occurred",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

// app.listen(8080, () => {
//   console.log("Server listening on port 8080");
// });

export default app;
