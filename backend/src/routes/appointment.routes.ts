import express, { Router } from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAppointmentsByPatient,
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
// Delete appointment
router.delete("/:id", deleteAppointment);
// Cancel appointment
router.post('/:id/cancel', cancelAppointment);
// Reschedule appointment
router.post('/:id/reschedule', rescheduleAppointment);
// Get appointments by patient ID
router.get("/patient/:patientId", getAppointmentsByPatient);


export default router;