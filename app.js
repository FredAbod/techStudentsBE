import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import xssClean from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from "helmet";
import cors from "cors";

// Import routes
import authRoutes from "./src/routes/auth.routes.js";
import profileRoutes from "./src/routes/profile.routes.js";
import studentRoutes from "./src/routes/student.routes.js";
import attendanceRoutes from "./src/routes/attendance.routes.js";
import assignmentRoutes from "./src/routes/assignment.routes.js";
import groupRoutes from "./src/routes/group.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import { setupSwagger } from './src/utils/swagger/swagger.js';

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet());
app.use(cors());

// XSS protection middleware
app.use(xssClean());

// MongoDB query sanitizer middleware
app.use(mongoSanitize());

app.get("/", (req, res) => {
  res.send("Welcome to Class-Spark-Achieve-Certify Educational Platform 🎓✨");
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
