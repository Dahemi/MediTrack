import express, { Router } from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getDoctorQueue,
  callNextPatient,
  startPatientSession,
  completePatientSession,
  startQueue,
  pauseQueue,
  resumeQueue,
  stopQueue,
  getQueueStatus,
  getPatientQueueInfo,
  reorderQueue,
  applyQueueRules,
  addWalkInPatient,
  skipPatient,
  getQueueAnalytics,
} from "../controllers/appointment.controller.js";
const router: Router = express.Router();

// Create new appointment
router.post("/", createAppointment);
// Get all appointments
router.get("/", getAppointments);
// Get appointment by ID
router.get("/:id", getAppointmentById);
// Update appointment
router.put("/:id", updateAppointment);
// Update appointment status
router.put("/:id/status", updateAppointmentStatus);
// Delete appointment
router.delete("/:id", deleteAppointment);

// Queue management routes
// Get doctor's queue for a specific date
router.get("/queue/:doctorId/:date", getDoctorQueue);
// Call next patient in queue
router.post("/queue/:doctorId/:date/call-next", callNextPatient);
// Start patient session
router.post("/:appointmentId/start-session", startPatientSession);
// Complete patient session
router.post("/:appointmentId/complete-session", completePatientSession);

// Queue control routes
// Start queue
router.post("/queue/:doctorId/:date/start", startQueue);
// Pause queue
router.post("/queue/:doctorId/:date/pause", pauseQueue);
// Resume queue
router.post("/queue/:doctorId/:date/resume", resumeQueue);
// Stop queue
router.post("/queue/:doctorId/:date/stop", stopQueue);
// Get queue status
router.get("/queue/:doctorId/:date/status", getQueueStatus);
// Get patient queue info
router.get("/patient/:appointmentId/queue-info", getPatientQueueInfo);

// Advanced queue management routes
// Reorder queue
router.post("/queue/:doctorId/:date/reorder", reorderQueue);
// Apply queue rules
router.post("/queue/:doctorId/:date/apply-rules", applyQueueRules);
// Add walk-in patient
router.post("/queue/:doctorId/:date/walk-in", addWalkInPatient);
// Skip patient
router.post("/:appointmentId/skip", skipPatient);
// Get queue analytics
router.get("/queue/:doctorId/:date/analytics", getQueueAnalytics);

export default router;