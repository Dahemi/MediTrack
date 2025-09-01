import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Middleware to verify JWT token
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    console.log('=== AUTHENTICATING TOKEN ===');
    console.log('Auth header:', authHeader);
    console.log('Token:', token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    console.log('=== TOKEN DECODED ===');
    console.log('Decoded token:', decoded);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select("-password");
    console.log('=== USER FOUND ===');
    console.log('User:', user);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    return res.status(403).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Middleware to check specific roles
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

// Specific role middlewares
export const requireAdmin = requireRole(["admin"]);
export const requireDoctor = requireRole(["doctor", "admin"]);
export const requirePatient = requireRole(["patient", "doctor", "admin"]);

// Add debugging to requirePatient
export const requirePatientDebug = (req: Request, res: Response, next: NextFunction) => {
  console.log('=== REQUIRE PATIENT MIDDLEWARE ===');
  console.log('User:', req.user);
  console.log('User role:', req.user?.role);
  console.log('Allowed roles:', ["patient", "doctor", "admin"]);
  
  if (!req.user) {
    console.log('No user found');
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!["patient", "doctor", "admin"].includes(req.user.role)) {
    console.log('User role not allowed');
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions",
    });
  }

  console.log('Patient middleware passed');
  next();
};
