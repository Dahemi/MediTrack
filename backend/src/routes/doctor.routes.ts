import express from "express";
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorProfile,
  changeDoctorPassword,
  getDoctorPatients,
  deleteDoctor,
} from "../controllers/doctor.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Admin-only routes for doctor management
router.post("/", requireAdmin, createDoctor);
router.get("/", getDoctors); // Keep public for frontend doctor directory
router.get("/:id", getDoctorById); // Keep public for frontend doctor details
router.put("/:id", requireAdmin, updateDoctor);
router.patch("/:id/profile", updateDoctorProfile);
router.patch("/:id/password", changeDoctorPassword);
router.get("/:id/patients", getDoctorPatients); // Doctor can update their own profile
router.delete("/:id", requireAdmin, deleteDoctor);

export default router;