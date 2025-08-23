import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import appointmentRoutes from "./routes/appointment.routes.js";

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/appointment", appointmentRoutes);


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
