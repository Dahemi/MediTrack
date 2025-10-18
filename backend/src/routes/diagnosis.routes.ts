import { Router } from "express";
import {
  createDiagnosis,
  getDiagnosisByAppointment,
  getDiagnosesByDoctor,
  getDiagnosesByPatient,
  getAllDiagnoses,
  updateDiagnosis,
  getRevenueStats,
} from "../controllers/diagnosis.controller.js";

const router = Router();

// Create a new diagnosis
router.post("/", createDiagnosis);

// Get diagnosis by appointment ID
router.get("/appointment/:appointmentId", getDiagnosisByAppointment);

// Get all diagnoses by doctor ID
router.get("/doctor/:doctorId", getDiagnosesByDoctor);

// Get all diagnoses by patient ID
router.get("/patient/:patientId", getDiagnosesByPatient);

// Get all diagnoses (admin)
router.get("/", getAllDiagnoses);

// Update diagnosis
router.put("/:diagnosisId", updateDiagnosis);

// Get revenue statistics
router.get("/stats/revenue", getRevenueStats);

export default router;
