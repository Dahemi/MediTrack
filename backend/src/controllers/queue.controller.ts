import type { Request, Response } from "express";
import { QueueService } from "../services/QueueService.js";
import { SocketService } from "../services/SocketService.js";
import { Appointment } from "../models/appointment.model.js";
import Queue from "../models/queue.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// Extend Request interface for doctor authentication
declare global {
  namespace Express {
    interface Request {
      doctor?: {
        id: string;
        userType: string;
      };
    }
  }
}

// Doctor Queue Control

/**
 * Pause doctor's queue for today
 * POST /api/doctor/queue/pause
 */
export const pauseQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctor?.id || req.body.doctorId;
    const { date, reason } = req.body;
    
    
    if (!doctorId) {
      res.status(401).json({
        success: false,
        message: "Doctor authentication required",
      });
      return;
    }

    // Use today's date if not provided
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    const queue = await QueueService.pauseQueue(doctorId, queueDate, reason);

    // Broadcast queue status update
    try {
      SocketService.broadcastQueueUpdate({
        doctorId,
        date: queueDate,
        status: "paused",
        pauseReason: reason,
        timestamp: new Date(),
      });
    } catch (e) {
      // Non-blocking
      console.warn("broadcastQueueUpdate failed (pause):", (e as any)?.message || e);
    }
    
    res.status(200).json({
      success: true,
      message: "Queue paused successfully",
      data: { queue },
    });
  } catch (error: any) {
    console.error("Pause queue error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to pause queue",
    });
  }
};

/**
 * Resume doctor's queue for today
 * POST /api/doctor/queue/resume
 */
export const resumeQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctor?.id || req.body.doctorId;
    const { date } = req.body;
    
    if (!doctorId) {
      res.status(401).json({
        success: false,
        message: "Doctor authentication required",
      });
      return;
    }

    // Use today's date if not provided
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    const queue = await QueueService.resumeQueue(doctorId, queueDate);

    // Broadcast queue status update
    try {
      SocketService.broadcastQueueUpdate({
        doctorId,
        date: queueDate,
        status: "active",
        timestamp: new Date(),
      });
    } catch (e) {
      // Non-blocking
      console.warn("broadcastQueueUpdate failed (resume):", (e as any)?.message || e);
    }
    
    res.status(200).json({
      success: true,
      message: "Queue resumed successfully",
      data: { queue },
    });
  } catch (error: any) {
    console.error("Resume queue error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to resume queue",
    });
  }
};

/**
 * Get queue status
 * GET /api/doctor/queue/status
 */
export const getQueueStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req.query.doctorId as string) || req.doctor?.id || req.body.doctorId;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    
    if (!doctorId) {
      res.status(401).json({
        success: false,
        message: "Doctor ID required",
      });
      return;
    }
    
    const queueStatus = await QueueService.getQueueStatus(doctorId || '', date || '');
    
    res.status(200).json({
      success: true,
      data: queueStatus,
    });
  } catch (error: any) {
    console.error("Get queue status error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get queue status",
    });
  }
};

/**
 * Get doctor's queues for multiple dates
 * GET /api/doctor/queues
 */
export const getDoctorQueues = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctor?.id || req.query.doctorId as string;
    
    if (!doctorId) {
      res.status(401).json({
        success: false,
        message: "Doctor ID required",
      });
      return;
    }
    
    const queues = await QueueService.getDoctorQueues(doctorId);
    
    res.status(200).json({
      success: true,
      data: { queues },
    });
  } catch (error: any) {
    console.error("Get doctor queues error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get doctor queues",
    });
  }
};

// Doctor Appointment Management

/**
 * Reschedule appointment (doctor-controlled)
 * POST /api/doctor/appointment/:id/reschedule
 */
export const rescheduleAppointmentByDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newDate, newTime, reason } = req.body;
    const doctorId = req.doctor?.id || req.body.doctorId;

    if (!doctorId) {
      res.status(401).json({
        success: false,
        message: "Doctor authentication required",
      });
      return;
    }

    if (!newDate || !newTime) {
      res.status(400).json({
        success: false,
        message: "New date and time are required",
      });
      return;
    }

    // Find the appointment and verify doctor ownership
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
      return;
    }

    if (appointment.doctorId.toString() !== doctorId) {
      res.status(403).json({
        success: false,
        message: "You can only reschedule your own appointments",
      });
      return;
    }

    // Check if appointment can be rescheduled
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: `Cannot reschedule a ${appointment.status} appointment`,
      });
      return;
    }

    // Check for conflicts at new time
    const existingAppointment = await Appointment.findOne({
      doctorId: appointment.doctorId,
      date: newDate,
      time: newTime,
      _id: { $ne: id }
    });

    if (existingAppointment) {
      res.status(400).json({
        success: false,
        message: "Selected time slot is already booked",
      });
      return;
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        date: newDate,
        time: newTime,
        rescheduledFrom: {
          date: appointment.date,
          time: appointment.time
        },
        rescheduledReason: reason || "Rescheduled by doctor",
        rescheduledAt: new Date(),
        status: 'booked'
      },
      { new: true }
    );

    // Broadcast appointment reschedule to relevant clients
    try {
      SocketService.broadcastAppointmentUpdate({
        appointmentId: id || '',
        doctorId: doctorId || '',
        patientId: appointment.patientId?.toString() || '',
        action: "rescheduled",
        timestamp: new Date(),
        date: newDate,
      });
    } catch (e) {
      console.warn("Failed to broadcast appointment reschedule:", e);
    }

    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully by doctor",
      data: { appointment: updatedAppointment },
    });
  } catch (error: any) {
    console.error("Doctor reschedule appointment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reschedule appointment",
    });
  }
};

/**
 * Cancel appointment (doctor-controlled)
 * POST /api/doctor/appointment/:id/cancel
 */
export const cancelAppointmentByDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const doctorId = req.doctor?.id || req.body.doctorId;

    if (!doctorId) {
      res.status(401).json({
        success: false,
        message: "Doctor authentication required",
      });
      return;
    }

    if (!reason) {
      res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
      return;
    }

    // Find the appointment and verify doctor ownership
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
      return;
    }

    if (appointment.doctorId.toString() !== doctorId) {
      res.status(403).json({
        success: false,
        message: "You can only cancel your own appointments",
      });
      return;
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'completed') {
      res.status(400).json({
        success: false,
        message: "Cannot cancel a completed appointment",
      });
      return;
    }

    if (appointment.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
      return;
    }

    // Cancel appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: 'doctor',
        cancelledAt: new Date()
      },
      { new: true }
    );

    // Broadcast appointment cancellation to relevant clients
    try {
      SocketService.broadcastAppointmentUpdate({
        appointmentId: id || '',
        doctorId: doctorId || '',
        patientId: appointment.patientId?.toString() || '',
        action: "cancelled",
        timestamp: new Date(),
        date: appointment.date,
      });
    } catch (e) {
      console.warn("Failed to broadcast appointment cancellation:", e);
    }

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully by doctor",
      data: { appointment: updatedAppointment },
    });
  } catch (error: any) {
    console.error("Doctor cancel appointment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel appointment",
    });
  }
};

// Admin Queue Monitoring

/**
 * Get all active queues (admin only)
 * GET /api/admin/queues
 */
export const getAllQueues = async (req: Request, res: Response): Promise<void> => {
  try {
    const queues = await QueueService.getAllActiveQueues();
    
    res.status(200).json({
      success: true,
      data: { queues },
    });
  } catch (error: any) {
    console.error("Get all queues error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get all queues",
    });
  }
};

/**
 * Get queue statistics (admin only)
 * GET /api/admin/queue-stats
 */
export const getQueueStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await QueueService.getQueueStats();
    
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Get queue stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get queue statistics",
    });
  }
};

/**
 * Debug endpoint to check date normalization
 * GET /api/admin/debug-dates
 */
export const debugDates = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    
    // Get current date in Colombo timezone using Intl.DateTimeFormat
    const colomboDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    
    const isoDate = now.toISOString().split('T')[0];
    
    // Get all queue dates from database
    const allQueues = await Queue.find({}).select('date createdAt').lean();
    
    res.status(200).json({
      success: true,
      data: {
        currentTime: now.toISOString(),
        colomboDate,
        isoDate,
        allQueueDates: allQueues.map((q: any) => ({ date: q.date, createdAt: q.createdAt })),
        totalQueues: allQueues.length,
        note: "Colombo date should be 2025-10-07 if it's October 7th in Sri Lanka"
      }
    });
  } catch (error: any) {
    console.error("Debug dates error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to debug dates",
    });
  }
};
