import express, { Router } from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getDoctorAppointments,
  getMyAppointments,
  getMyPatientAppointments,
} from "../controllers/appointment.controller.js";
import { authenticateToken, requireDoctor, requirePatient, requirePatientDebug } from "../middleware/auth.js";

const router: Router = express.Router();

// Create new appointment
router.post("/", authenticateToken, requirePatientDebug, createAppointment);
// Get all appointments
router.get("/", getAppointments);
// Get appointments for current doctor (authenticated) - must come before /:id routes
router.get("/doctor/my", authenticateToken, requireDoctor, getMyAppointments);
// Get appointments for current patient (authenticated) - must come before /:id routes
router.get("/patient/my", authenticateToken, requirePatient, getMyPatientAppointments);
// Get appointments for a specific doctor - must come before /:id routes
router.get("/doctor/:doctorId", getDoctorAppointments);
// Get appointment by ID
router.get("/:id", getAppointmentById);
// Update appointment
router.put("/:id", authenticateToken, requireDoctor, updateAppointment);
// Delete appointment
router.delete("/:id", deleteAppointment);


export default router;