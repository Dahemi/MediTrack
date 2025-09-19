import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import admin from "../config/firebase.js";
import User from "../models/user.model.js";

// Firebase login for patients
export const firebaseLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { idToken, uid, email, name, photoURL } = req.body;

    if (!idToken || !uid || !email) {
      res.status(400).json({
        success: false,
        message: "Missing required Firebase data",
      });
      return;
    }

    // Verify Firebase ID token
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid Firebase token",
      });
      return;
    }

    // Check if user exists
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }],
    });

    if (user) {
      // Update existing user with Firebase data
      user.firebaseUid = uid;
      user.photoURL = photoURL;
      if (!user.name && name) {
        user.name = name;
      }
      if (!user.userType) {
        user.userType = "patient";
      }
      await user.save();
    } else {
      // Create new user
      user = new User({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        userType: "patient",
        firebaseUid: uid,
        photoURL: photoURL,
        isVerified: true, // Firebase users are pre-verified
      });

      const validationError = user.validateSync();
      if (validationError) {
        console.error("Validation error:", validationError);
        res.status(400).json({
          success: false,
          message: "User data validation failed",
        });
        return;
      }
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Firebase login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          photoURL: user.photoURL,
          firebaseUid: user.firebaseUid,
        },
      },
    });
  } catch (error: any) {
    console.error("Firebase login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// Doctor signup
export const doctorSignup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      fullName,
      specialization,
      yearsOfExperience,
      contactDetails,
      profilePictureUrl,
      availability,
    } = req.body;

    // Validation
    if (!name || !email || !password || !fullName || !specialization) {
      res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
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

    // Create new doctor
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      userType: "doctor",
      fullName: fullName.trim(),
      specialization: specialization.trim(),
      yearsOfExperience: parseInt(yearsOfExperience) || 0,
      contactDetails: {
        email: contactDetails?.email || email.toLowerCase().trim(),
        phone: contactDetails?.phone || "",
      },
      profilePictureUrl: profilePictureUrl || "",
      availability: availability || [],
      isVerified: true, // Doctors are auto-verified
    });

    // Save user to database
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "Doctor registration successful",
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          userType: newUser.userType,
          fullName: newUser.fullName,
          specialization: newUser.specialization,
          yearsOfExperience: newUser.yearsOfExperience,
          contactDetails: newUser.contactDetails,
          profilePictureUrl: newUser.profilePictureUrl,
          availability: newUser.availability,
        },
      },
    });
  } catch (error: any) {
    console.error("Doctor signup error:", error);

    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "A user with this email already exists",
      });
      return;
    }

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

// Doctor login
export const doctorLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
      return;
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      userType: "doctor",
    }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          fullName: user.fullName,
          specialization: user.specialization,
          yearsOfExperience: user.yearsOfExperience,
          contactDetails: user.contactDetails,
          profilePictureUrl: user.profilePictureUrl,
          availability: user.availability,
        },
      },
    });
  } catch (error: any) {
    console.error("Doctor login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};
