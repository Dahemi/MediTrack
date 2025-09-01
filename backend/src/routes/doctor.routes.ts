import express, { Router } from "express";
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  getDoctorByUserId,
  updateDoctor,
  updateDoctorByUserId,
  deleteDoctor,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  getDoctorsWithAvailability,
  getDoctorAvailableSlots,
} from "../controllers/doctor.controller.js";
import { authenticateToken, requireAdmin, requireDoctor } from "../middleware/auth.js";
import Doctor from "../models/doctor.model.js";

const router: Router = express.Router();

// Doctor routes (for logged-in doctors) - must come before /:id routes
router.get("/profile/me", authenticateToken, requireDoctor, getMyDoctorProfile);
router.put("/profile/me", authenticateToken, requireDoctor, updateMyDoctorProfile);
router.get("/user/:userId", authenticateToken, requireDoctor, getDoctorByUserId);
router.put("/user/:userId", authenticateToken, requireDoctor, updateDoctorByUserId);

// Debug route to check all doctors (temporary)
router.get("/debug/all", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'name email role');
    res.json({ success: true, data: { count: doctors.length, doctors } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug route to check current user info (temporary)
router.get("/debug/user", authenticateToken, async (req, res) => {
  try {
    res.json({ 
      success: true, 
      data: {
        user: req.user,
        userId: req.user?._id,
        role: req.user?.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug routes (must come before /:doctorId routes to avoid conflicts)
router.get("/debug/all", async (req, res) => {
  try {
    console.log('Debug all doctors route called');
    const doctors = await Doctor.find().select('_id fullName availability');
    console.log('Found doctors:', doctors.length);
    res.json({ 
      success: true, 
      data: {
        count: doctors.length,
        doctors: doctors.map(d => ({
          _id: d._id,
          fullName: d.fullName,
          hasAvailability: !!d.availability,
          availabilityLength: d.availability?.length || 0,
          isArray: Array.isArray(d.availability)
        }))
      }
    });
  } catch (error: any) {
    console.error('Debug all doctors error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/debug/:doctorId", async (req, res) => {
  try {
    console.log('Debug route called with doctorId:', req.params.doctorId);
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      console.log('Doctor not found in debug route');
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    console.log('Doctor found in debug route:', doctor.fullName);
    console.log('Doctor availability in debug route:', doctor.availability);
    
    res.json({ 
      success: true, 
      data: {
        doctor: doctor.toObject(),
        availability: doctor.availability,
        availabilityLength: doctor.availability?.length || 0,
        hasAvailability: !!doctor.availability,
        isArray: Array.isArray(doctor.availability)
      }
    });
  } catch (error: any) {
    console.error('Debug route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public routes for appointment booking (must come before /:id routes)
router.get("/availability", getDoctorsWithAvailability);
router.get("/:doctorId/slots", getDoctorAvailableSlots);

// Admin routes (require admin authentication)
router.post("/", authenticateToken, requireAdmin, createDoctor);
router.get("/", authenticateToken, requireAdmin, getDoctors);
router.get("/:id", authenticateToken, requireAdmin, getDoctorById);
router.put("/:id", authenticateToken, requireAdmin, updateDoctor);
router.delete("/:id", authenticateToken, requireAdmin, deleteDoctor);

export default router;