import express from "express";
import {
  firebaseLogin,
  doctorSignup,
  doctorLogin,
} from "../controllers/patient.controller.js";

const router = express.Router();

// @route   POST /api/patient/firebase-login
// @desc    Firebase Google login for patients
// @access  Public
router.post("/firebase-login", firebaseLogin);

// @route   POST /api/patient/doctor-signup
// @desc    Register a new doctor
// @access  Public
router.post("/doctor-signup", doctorSignup);

// @route   POST /api/patient/doctor-login
// @desc    Login doctor
// @access  Public
router.post("/doctor-login", doctorLogin);

export default router;
