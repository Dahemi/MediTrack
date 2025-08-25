import express, { Router } from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  bookAppointment,
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
// Book appointment
router.post("/book", bookAppointment);


export default router;