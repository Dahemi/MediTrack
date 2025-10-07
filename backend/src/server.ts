import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import doctorRoutes from "./routes/doctor.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import queueRoutes, { adminQueueRouter } from "./routes/queue.routes.js";
import { SocketService } from "./services/SocketService.js";
import { optionalDoctorAuth } from "./middleware/doctor.middleware.js";

dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.io
SocketService.init(server);

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL || "http://localhost:5173",
  ],
  credentials: true,
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/meditrack";

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/patient", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/admin", adminRoutes);

// New queue-related routes (extensions)
app.use("/api/doctor/queue", optionalDoctorAuth, queueRoutes);
app.use("/api/admin", adminQueueRouter);

// Enhanced health check with socket info
app.get("/api/health", (_req, res) => {
  const socketStats = {
    connected: SocketService.getConnectedClientsCount(),
    doctors: SocketService.getClientsByType("doctor"),
    patients: SocketService.getClientsByType("patient"),
    admins: SocketService.getClientsByType("admin"),
  };

  res.json({ 
    status: "ok", 
    message: "Backend with queue system is running!",
    sockets: socketStats,
  });
});

// Socket.io status endpoint
app.get("/api/socket/status", (_req, res) => {
  res.json({
    success: true,
    data: {
      connected: SocketService.getConnectedClientsCount(),
      byType: {
        doctors: SocketService.getClientsByType("doctor"),
        patients: SocketService.getClientsByType("patient"),
        admins: SocketService.getClientsByType("admin"),
      },
    },
  });
});

// 404 handler
app.use("*", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

server.listen(PORT, () => {
  console.log(`Server with queue system running on port ${PORT}`);
  console.log(`Socket.io enabled for real-time updates`);
});
