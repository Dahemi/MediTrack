import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import userRoutes from "./routes/userRoutes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/meditrack";

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is required in environment variables");
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
console.log("Setting up routes...");
app.use("/api/auth", authRoutes);
console.log("Auth routes mounted");
app.use("/api/doctor", doctorRoutes); 
console.log("Doctor routes mounted");
app.use("/api/users", userRoutes);
console.log("User routes mounted");
app.use("/api/appointment", appointmentRoutes);
console.log("Appointment routes mounted");

// Basic API endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running!" });
});

// 404 handler
app.use("*", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Global error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Make sure to configure your email settings in .env`);
  console.log(`🔐 JWT authentication is enabled`);
});
