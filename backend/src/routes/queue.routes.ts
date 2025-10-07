import express from "express";
import {
  pauseQueue,
  resumeQueue,
  getQueueStatus,
  getDoctorQueues,
  rescheduleAppointmentByDoctor,
  cancelAppointmentByDoctor,
  getAllQueues,
  getQueueStats,
  debugDates,
} from "../controllers/queue.controller.js";
import { requireAdmin, authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Doctor Queue Control Routes
// These routes will be mounted under /api/doctor

// @route   POST /api/doctor/queue/pause
// @desc    Pause doctor's queue
// @access  Doctor only
router.post("/pause", pauseQueue);

// @route   POST /api/doctor/queue/resume  
// @desc    Resume doctor's queue
// @access  Doctor only
router.post("/resume", resumeQueue);

// @route   GET /api/doctor/queue/status
// @desc    Get current queue status for doctor
// @access  Doctor only
router.get("/status", getQueueStatus);

// @route   GET /api/doctor/queues
// @desc    Get all queues for doctor (multiple dates)
// @access  Doctor only
router.get("/", getDoctorQueues);

// Doctor Appointment Management Routes
// These will be mounted under /api/doctor

// @route   POST /api/doctor/appointment/:id/reschedule
// @desc    Reschedule appointment (doctor-controlled)
// @access  Doctor only
router.post("/appointment/:id/reschedule", rescheduleAppointmentByDoctor);

// @route   POST /api/doctor/appointment/:id/cancel
// @desc    Cancel appointment (doctor-controlled)  
// @access  Doctor only
router.post("/appointment/:id/cancel", cancelAppointmentByDoctor);

export default router;

// Admin Queue Monitoring Routes
// These will be exported separately for admin routes
export const adminQueueRouter = express.Router();

// @route   GET /api/admin/queues
// @desc    Get all active queues
// @access  Admin only
adminQueueRouter.get("/queues", requireAdmin, getAllQueues);

// @route   GET /api/admin/queue-stats
// @desc    Get queue statistics
// @access  Admin only  
adminQueueRouter.get("/queue-stats", requireAdmin, getQueueStats);

// @route   GET /api/admin/debug-dates
// @desc    Debug date normalization
// @access  Admin only  
adminQueueRouter.get("/debug-dates", requireAdmin, debugDates);
