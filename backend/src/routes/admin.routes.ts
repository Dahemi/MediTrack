import express from "express";
import {
  adminLogin,
  getAdminProfile,
  getAllUsers,
  toggleUserStatus,
  getAllAppointments,
  cancelAppointmentAdmin,
  getDashboardStats,
  createDoctorByAdmin,
  updateDoctorByAdmin,
  deleteDoctorByAdmin,
} from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes (no authentication required)
// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post("/login", adminLogin);

// Protected routes (require admin authentication)
// @route   GET /api/admin/profile
// @desc    Get admin profile
// @access  Admin only
router.get("/profile", requireAdmin, getAdminProfile);

// @route   GET /api/admin/users
// @desc    Get all users (doctors and patients) with pagination and filters
// @access  Admin only
router.get("/users", requireAdmin, getAllUsers);

// @route   PUT /api/admin/users/:userId/status
// @desc    Toggle user active/inactive status
// @access  Admin only
router.put("/users/:userId/status", requireAdmin, toggleUserStatus);

// @route   GET /api/admin/appointments
// @desc    Get all appointments with filters and pagination
// @access  Admin only
router.get("/appointments", requireAdmin, getAllAppointments);

// @route   PUT /api/admin/appointments/:appointmentId/cancel
// @desc    Cancel appointment (admin action)
// @access  Admin only
router.put("/appointments/:appointmentId/cancel", requireAdmin, cancelAppointmentAdmin);

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Admin only
router.get("/stats", requireAdmin, getDashboardStats);

// @route   POST /api/admin/doctors
// @desc    Create a doctor (admin)
// @access  Admin only
router.post("/doctors", requireAdmin, createDoctorByAdmin);

// @route   PUT /api/admin/doctors/:doctorId
// @desc    Update a doctor (admin)
// @access  Admin only
router.put("/doctors/:doctorId", requireAdmin, updateDoctorByAdmin);

// @route   DELETE /api/admin/doctors/:doctorId
// @desc    Delete a doctor (admin)
// @access  Admin only
router.delete("/doctors/:doctorId", requireAdmin, deleteDoctorByAdmin);

export default router;
