import type { Request, Response } from "express";
import User from "../models/User.js";

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select("-password -verificationToken -verificationTokenExpires");
    
    res.status(200).json({
      success: true,
      data: {
        users,
        total: users.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// Get users by role
export const getUsersByRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.params;
    
    if (!["patient", "doctor", "admin"].includes(role)) {
      res.status(400).json({
        success: false,
        message: "Invalid role. Must be patient, doctor, or admin",
      });
      return;
    }

    const users = await User.find({ role }).select("-password -verificationToken -verificationTokenExpires");
    
    res.status(200).json({
      success: true,
      data: {
        users,
        total: users.length,
        role,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["patient", "doctor", "admin"].includes(role)) {
      res.status(400).json({
        success: false,
        message: "Invalid role. Must be patient, doctor, or admin",
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password -verificationToken -verificationTokenExpires");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: {
        user,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};
