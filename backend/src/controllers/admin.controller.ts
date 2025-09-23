import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import { Appointment } from "../models/appointment.model.js";
import { generateToken } from "../middleware/auth.middleware.js";
import { sendDoctorCredentialsEmail } from "../config/mailer.js";

// Admin login
export const adminLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
      return;
    }

    // Find admin by username (include password for verification)
    const admin = await Admin.findOne({
      username: username.toLowerCase(),
      isActive: true,
    }).select("+password");

    if (!admin) {
      res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
      return;
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = generateToken({
      id: admin._id,
      username: admin.username,
      role: admin.role,
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          lastLogin: admin.lastLogin,
        },
      },
    });
  } catch (error: any) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// Get admin profile (for authenticated admin)
export const getAdminProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const admin = await Admin.findById(req.admin?.id);
    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Get all users (doctors and patients) - Admin only
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userType, search, page = 1, limit = 10 } = req.query;

    // Build query
    const query: any = {};
    if (userType && (userType === "doctor" || userType === "patient")) {
      query.userType = userType;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Get users
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalUsers / Number(limit)),
          totalUsers,
          hasNextPage: skip + users.length < totalUsers,
          hasPrevPage: Number(page) > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Toggle user active status - Admin only
export const toggleUserStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });
      return;
    }

    // Note: We're using isVerified field as active status since User model doesn't have isActive
    user.isVerified = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully.`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error: any) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Get all appointments with filters - Admin only
export const getAllAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      doctorId,
      patientId,
      status,
      date,
      page = 1,
      limit = 10,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query: any = {};
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;
    if (date) query.date = date;

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    // Get appointments
    const appointments = await Appointment.find(query)
      .populate({
        path: "doctorId",
        // Colleagues' schema sets ref: "Doctor" (no model). Override to existing User model.
        model: "User",
        select: "name fullName specialization userType",
        match: { userType: "doctor" },
      })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const totalAppointments = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalAppointments / Number(limit)),
          totalAppointments,
          hasNextPage: skip + appointments.length < totalAppointments,
          hasPrevPage: Number(page) > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Get all appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Cancel appointment - Admin only
export const cancelAppointmentAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
      return;
    }

    if (appointment.status === "cancelled") {
      res.status(400).json({
        success: false,
        message: "Appointment is already cancelled.",
      });
      return;
    }

    // Update appointment
    appointment.status = "cancelled";
    appointment.cancellationReason = reason || "Cancelled by admin";
    appointment.cancelledBy = "admin";
    appointment.cancelledAt = new Date();
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully.",
      data: { appointment },
    });
  } catch (error: any) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Get dashboard statistics - Admin only
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get user counts
    const totalPatients = await User.countDocuments({ userType: "patient" });
    const totalDoctors = await User.countDocuments({ userType: "doctor" });
    const activeDoctors = await User.countDocuments({
      userType: "doctor",
      isVerified: true,
    });

    // Get appointment counts
    const totalAppointments = await Appointment.countDocuments();
    const todayAppointments = await Appointment.countDocuments({
      date: todayStr,
    });
    const pendingAppointments = await Appointment.countDocuments({
      status: "booked",
    });
    const completedAppointments = await Appointment.countDocuments({
      status: "completed",
    });
    const cancelledAppointments = await Appointment.countDocuments({
      status: "cancelled",
    });

    // Get weekly stats
    const weeklyAppointments = await Appointment.countDocuments({
      createdAt: { $gte: weekAgo },
    });
    const monthlyAppointments = await Appointment.countDocuments({
      createdAt: { $gte: monthAgo },
    });

    // Get recent appointments
    const recentAppointments = await Appointment.find()
      .populate({
        path: "doctorId",
        // Override to use existing User model to avoid MissingSchemaError for "Doctor"
        model: "User",
        select: "name fullName specialization",
      })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        userStats: {
          totalPatients,
          totalDoctors,
          activeDoctors,
        },
        appointmentStats: {
          total: totalAppointments,
          today: todayAppointments,
          pending: pendingAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          weekly: weeklyAppointments,
          monthly: monthlyAppointments,
        },
        recentAppointments,
      },
    });
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Create doctor by admin with credentials email
export const createDoctorByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, specialization, yearsOfExperience, contactDetails, profilePictureUrl } = req.body;

    if (!email || !password || !fullName || !specialization) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, message: "A user with this email already exists" });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const newUser = new User({
      name: fullName,
      email: email.toLowerCase(),
      password: hashed,
      userType: "doctor",
      fullName,
      specialization,
      yearsOfExperience: Number(yearsOfExperience) || 0,
      contactDetails: {
        email: contactDetails?.email || email.toLowerCase(),
        phone: contactDetails?.phone || "",
      },
      profilePictureUrl: profilePictureUrl || "",
      isVerified: true,
    });
    await newUser.save();

    // Fire and forget email
    try {
      await sendDoctorCredentialsEmail(email, password, fullName);
    } catch (e) {
      // Non-fatal if email fails
      console.warn("sendDoctorCredentialsEmail failed:", (e as any)?.message || e);
    }

    res.status(201).json({ success: true, data: { doctor: newUser } });
  } catch (error: any) {
    console.error("Admin create doctor error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Update doctor by admin
export const updateDoctorByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const { name, email, password, fullName, specialization, yearsOfExperience, contactDetails, profilePictureUrl } = req.body;

    if (!name || !email || !fullName || !specialization) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const doctor = await User.findOne({ _id: doctorId, userType: "doctor" });
    if (!doctor) {
      res.status(404).json({ success: false, message: "Doctor not found" });
      return;
    }

    // Check if email is being changed and if it's already taken
    if (email !== doctor.email) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: doctorId } });
      if (existing) {
        res.status(400).json({ success: false, message: "A user with this email already exists" });
        return;
      }
    }

    // Update fields
    doctor.name = name;
    doctor.email = email.toLowerCase();
    doctor.fullName = fullName;
    doctor.specialization = specialization;
    doctor.yearsOfExperience = Number(yearsOfExperience) || 0;
    doctor.contactDetails = {
      email: contactDetails?.email || email.toLowerCase(),
      phone: contactDetails?.phone || "",
    };
    doctor.profilePictureUrl = profilePictureUrl || "";

    // Only update password if provided
    let passwordUpdated = false;
    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 12);
      doctor.password = hashed;
      passwordUpdated = true;
    }

    await doctor.save();

    // Send email notification if password was updated
    if (passwordUpdated) {
      try {
        await sendDoctorCredentialsEmail(doctor.email, password, doctor.fullName || doctor.name);
      } catch (e) {
        // Non-fatal if email fails
        console.warn("sendDoctorCredentialsEmail failed during update:", (e as any)?.message || e);
      }
    }

    res.status(200).json({ success: true, data: { doctor } });
  } catch (error: any) {
    console.error("Admin update doctor error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Delete doctor by admin
export const deleteDoctorByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findOne({ _id: doctorId, userType: "doctor" });
    if (!doctor) {
      res.status(404).json({ success: false, message: "Doctor not found" });
      return;
    }

    await User.findByIdAndDelete(doctorId);

    res.status(200).json({ success: true, message: "Doctor deleted successfully" });
  } catch (error: any) {
    console.error("Admin delete doctor error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
