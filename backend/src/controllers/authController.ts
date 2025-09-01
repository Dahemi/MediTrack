import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendVerificationEmail } from "../config/mailer.js";

// Generate JWT token
const generateToken = (userId: string, email: string, role: string) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
};

// Register a new user (patient, doctor, or admin)
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = "patient" } = req.body;
    
    console.log("Signup attempt:", { name, email, role });

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
      return;
    }

    // Validate role
    if (!["patient", "doctor", "admin"].includes(role)) {
      res.status(400).json({
        success: false,
        message: "Invalid role. Must be patient, doctor, or admin",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      console.log("User already exists:", existingUser.email);
      res.status(400).json({
        success: false,
        message: "A user with this email already exists",
      });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    // Save user to database
    await newUser.save();
    
    console.log("User saved successfully:", newUser._id);

    // Send verification email
    try {
      await sendVerificationEmail(newUser.email, verificationToken);
      console.log("Verification email sent to:", newUser.email);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Delete the user if email sending fails
      await User.findByIdAndDelete(newUser._id);
      res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isVerified: newUser.isVerified,
        },
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);

    // Handle duplicate email error
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "A user with this email already exists",
      });
      return;
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      res.status(400).json({
        success: false,
        message: messages.join(". "),
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// Verify email token
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    
    console.log("Email verification attempt with token:", token);

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
      return;
    }

    // Find user by verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    console.log("User found for verification:", user ? user.email : "Not found");

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
      return;
    }

    // Check if already verified
    if (user.isVerified) {
      console.log("User already verified:", user.email);
      res.status(200).json({
        success: true,
        message: "Email is already verified",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
          },
        },
      });
      return;
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    
    console.log("User verified successfully:", user.email, "ID:", user._id?.toString());

    res.status(200).json({
      success: true,
      message:
        "Email verified successfully! You can now log in to your account.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error: any) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// Login user with JWT token
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Check if email is verified
    if (!user.isVerified) {
      res.status(401).json({
        success: false,
        message: "Please verify your email before logging in",
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// Resend verification email
export const resendVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
      return;
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
    });
  }
};
