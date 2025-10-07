import type { Request, Response, NextFunction } from "express";
import { authenticateToken } from "./auth.middleware.js";
import User from "../models/user.model.js";

// Extend Express Request interface for doctor authentication
declare global {
  namespace Express {
    interface Request {
      doctor?: {
        id: string;
        userType: string;
        fullName?: string;
        specialization?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate doctor access
 * Extends existing auth middleware without modifying it
 */
export const requireDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First authenticate the token using existing middleware
    await new Promise<void>((resolve, reject) => {
      authenticateToken(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user has doctor role
    if (!req.user || req.user.role !== "doctor") {
      res.status(403).json({
        success: false,
        message: "Access denied. Doctor privileges required.",
      });
      return;
    }

    // Verify doctor exists in database and is active
    const doctor = await User.findById(req.user.id);
    if (!doctor || doctor.userType !== "doctor" || !doctor.isVerified) {
      res.status(403).json({
        success: false,
        message: "Access denied. Doctor account not found or inactive.",
      });
      return;
    }

    // Attach doctor data to request
    req.doctor = {
      id: doctor._id.toString(),
      userType: doctor.userType,
      fullName: doctor.fullName,
      specialization: doctor.specialization,
    };

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Doctor authorization check failed.",
    });
  }
};

/**
 * Middleware to optionally authenticate doctor (doesn't fail if not authenticated)
 * Useful for endpoints that can work with or without doctor authentication
 */
export const optionalDoctorAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // No token provided, continue without doctor auth
      next();
      return;
    }

    // Try to authenticate
    await new Promise<void>((resolve, reject) => {
      authenticateToken(req, res, (err) => {
        if (err) {
          // Auth failed, continue without doctor auth
          resolve();
        } else {
          resolve();
        }
      });
    });

    // If we have a user and it's a doctor, attach doctor info
    if (req.user && req.user.role === "doctor") {
      const doctor = await User.findById(req.user.id);
      if (doctor && doctor.userType === "doctor" && doctor.isVerified) {
        req.doctor = {
          id: doctor._id.toString(),
          userType: doctor.userType,
          fullName: doctor.fullName,
          specialization: doctor.specialization,
        };
      }
    }

    next();
  } catch (error: any) {
    // If anything fails, just continue without doctor auth
    next();
  }
};
