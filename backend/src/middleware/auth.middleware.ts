import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import Admin from "../models/admin.model.js";

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
      admin?: {
        id: string;
        username: string;
        fullName: string;
        email: string;
        role: "admin";
      };
    }
  }
}

// JWT Secret - should be moved to environment variables
const JWT_SECRET = process.env.JWT_SECRET || "meditrack_jwt_secret_key_2024";

// Generate JWT token
export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "24h", // Token expires in 24 hours
  });
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

// Middleware to authenticate JWT token
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Token has expired.",
      });
    } else if (error.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Token verification failed.",
      });
    }
  }
};

// Middleware to check if user is admin
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First authenticate the token
    await new Promise<void>((resolve, reject) => {
      authenticateToken(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user has admin role
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
      return;
    }

    // Verify admin exists in database and is active
    const admin = await Admin.findById(req.user.id);
    if (!admin || !admin.isActive) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin account not found or inactive.",
      });
      return;
    }

    // Attach admin data to request
    req.admin = {
      id: admin._id.toString(),
      username: admin.username,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Authorization check failed.",
    });
  }
};

// Optional: Middleware to check if user is doctor
export const requireDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      authenticateToken(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.user || req.user.role !== "doctor") {
      res.status(403).json({
        success: false,
        message: "Access denied. Doctor privileges required.",
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Authorization check failed.",
    });
  }
};

// Optional: Middleware for patient access
export const requirePatient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      authenticateToken(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.user || req.user.role !== "patient") {
      res.status(403).json({
        success: false,
        message: "Access denied. Patient access required.",
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Authorization check failed.",
    });
  }
};
