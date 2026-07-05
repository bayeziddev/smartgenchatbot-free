import "dotenv/config";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

// CORS Configuration for Vercel
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://smartgenchatbot-free-7ucfiduty.vercel.app",
      process.env.FRONTEND_URL || "",
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SmartGen Chatbot API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Status
app.get("/api/status", (req, res) => {
  res.json({
    service: "SmartGen Chatbot",
    version: "1.0.0",
    status: "operational",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// tRPC Router for Vercel Serverless
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? "An error occurred" : err.message,
  });
});

// Export for Vercel Serverless
export default app;
