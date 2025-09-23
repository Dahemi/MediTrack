import express from "express";
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctor.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Admin-only routes for doctor management
router.post("/", requireAdmin, createDoctor);
router.get("/", getDoctors); // Keep public for frontend doctor directory
router.get("/:id", getDoctorById); // Keep public for frontend doctor details
router.put("/:id", requireAdmin, updateDoctor);
router.delete("/:id", requireAdmin, deleteDoctor);

export default router;