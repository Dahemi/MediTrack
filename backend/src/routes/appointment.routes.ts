import express, { Router } from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getDoctorAppointmentsByDate,
} from "../controllers/appointment.controller.js";
const router: Router = express.Router();
// Get appointments for a specific doctor on a specific date
router.get("/doctor/:doctorId/date/:date", getDoctorAppointmentsByDate);
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


export default router;