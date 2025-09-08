import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import appointmentRoutes from "./routes/appointment.routes.js";
import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctor.routes.js";


const app: Express = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL || "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

app.use("/api/auth", authRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/doctors", doctorRoutes); 

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
    statusCode,
    message,
  });
});

export default app;
