import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import appointmentRoutes from "./routes/appointment.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import diagnosisRoutes from "./routes/diagnosis.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import queueRoutes from "./routes/queue.routes.js";

const app: Express = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
      process.env.FRONTEND_URL || "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/appointment", appointmentRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/diagnosis", diagnosisRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/queue", queueRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running!" });
});

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode: number = err.statusCode || 500;
  const message: string = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
