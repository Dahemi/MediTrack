import { Request, Response } from "express";
import { Appointment } from "../models/appointment.model.js";
import User from "../models/user.model.js";
import { QueueService } from "../services/QueueService.js";

// Create new appointment (with conflict checking)
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const {
      patientName,
      patientAddress,
      patientContact,
      doctorId,
      doctorName,
      date,
      time,
      notes,
    } = req.body;

    // Check if doctor already has an appointment at this date & time
    const existingDoctor = await Appointment.findOne({ doctorId, date, time });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked for the doctor.",
      });
    }

    // Find the max queueNumber for this doctor on this date
    const lastAppointment = await Appointment.findOne({ doctorId, date }).sort({ queueNumber: -1 });
    const queueNumber = lastAppointment ? lastAppointment.queueNumber + 1 : 1;

    // Save new appointment
    const appointment = await Appointment.create({
      patientName,
      patientAddress,
      patientContact,
      doctorId,
      doctorName,
      date,
      time,
      queueNumber,
      notes,
      status: "booked",
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      data: appointment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error creating appointment",
      error: error.message,
    });
  }
};

// Get all appointments
export const getAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await Appointment.find()
      /*.populate({
        path: "patientId",
        select: "name email userType",
        match: { userType: "patient" },
      })*/
      .populate({
        path: "doctorId",
        select: "name fullName specialization userType",
        match: { userType: "doctor" },
      });

    return res.status(200).json(appointments);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching appointments", error });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: "patientId",
        select: "name email userType",
        match: { userType: "patient" },
      })
      .populate({
        path: "doctorId",
        select: "name fullName specialization userType",
        match: { userType: "doctor" },
      });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching appointment", error });
  }
};

// Update appointment
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating appointment", error });
  }
};

// Update status only
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!["booked", "waiting", "called", "in_session", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    return res.status(500).json({ message: "Error updating status", error });
  }
};

// Get appointments by doctor and date for queue management
export const getDoctorQueue = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;

    const appointments = await Appointment.find({ 
      doctorId, 
      date,
      status: { $in: ["booked", "waiting", "called", "in_session"] }
    })
    .sort({ queueNumber: 1 })
    .populate({
      path: "doctorId",
      select: "name fullName specialization userType",
      match: { userType: "doctor" },
    });

    return res.status(200).json({
      success: true,
      data: appointments,
      total: appointments.length
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false,
      message: "Error fetching doctor queue", 
      error: error.message 
    });
  }
};

// Call next patient in queue
export const callNextPatient = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;

    // Find the next patient in queue
    const nextAppointment = await Appointment.findOne({
      doctorId,
      date,
      status: { $in: ["booked", "waiting"] }
    }).sort({ queueNumber: 1 });

    if (!nextAppointment) {
      return res.status(404).json({
        success: false,
        message: "No patients in queue"
      });
    }

    // Update status to "called"
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      nextAppointment._id,
      { status: "called" },
      { new: true }
    ).populate({
      path: "doctorId",
      select: "name fullName specialization userType",
      match: { userType: "doctor" },
    });

    return res.status(200).json({
      success: true,
      message: "Next patient called",
      data: updatedAppointment
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error calling next patient",
      error: error.message
    });
  }
};

// Start patient session
export const startPatientSession = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "in_session" },
      { new: true }
    ).populate({
      path: "doctorId",
      select: "name fullName specialization userType",
      match: { userType: "doctor" },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient session started",
      data: appointment
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error starting patient session",
      error: error.message
    });
  }
};

// Complete patient session
export const completePatientSession = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "completed" },
      { new: true }
    ).populate({
      path: "doctorId",
      select: "name fullName specialization userType",
      match: { userType: "doctor" },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient session completed",
      data: appointment
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error completing patient session",
      error: error.message
    });
  }
};

// Queue Control Endpoints

// Start queue
export const startQueue = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;

    const session = await QueueService.startQueue(doctorId as string, date as string);

    return res.status(200).json({
      success: true,
      message: "Queue started successfully",
      data: session
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Pause queue
export const pauseQueue = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;

    const session = await QueueService.pauseQueue(doctorId as string, date as string);

    return res.status(200).json({
      success: true,
      message: "Queue paused successfully",
      data: session
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Resume queue
export const resumeQueue = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;

    const session = await QueueService.resumeQueue(doctorId as string, date as string);

    return res.status(200).json({
      success: true,
      message: "Queue resumed successfully",
      data: session
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Stop queue
export const stopQueue = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;

    const session = await QueueService.stopQueue(doctorId as string, date as string);

    return res.status(200).json({
      success: true,
      message: "Queue stopped successfully",
      data: session
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get queue status
export const getQueueStatus = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;

    const session = QueueService.getQueueSession(doctorId as string, date as string);
    const stats = await QueueService.getQueueStats(doctorId as string, date as string);
    const currentPatient = await QueueService.getCurrentPatient(doctorId as string, date as string);
    const nextPatients = await QueueService.getNextPatients(doctorId as string, date as string, 5);

    return res.status(200).json({
      success: true,
      data: {
        session,
        stats,
        currentPatient,
        nextPatients
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching queue status",
      error: error.message
    });
  }
};

// Get patient's queue position and wait time
export const getPatientQueueInfo = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    const queueSession = QueueService.getQueueSession(appointment.doctorId.toString(), appointment.date);
    const estimatedWaitTime = await QueueService.getEstimatedWaitTime(
      appointment.doctorId.toString(), 
      appointment.date, 
      appointment.queueNumber
    );

    return res.status(200).json({
      success: true,
      data: {
        appointment,
        queueSession,
        estimatedWaitTime,
        position: appointment.queueNumber
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching patient queue info",
      error: error.message
    });
  }
};

// Advanced Queue Management Endpoints

// Reorder queue
export const reorderQueue = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;
    const { reorderRequests } = req.body;

    const success = await QueueService.reorderQueue(doctorId as string, date as string, reorderRequests);

    if (success) {
      return res.status(200).json({
        success: true,
        message: "Queue reordered successfully"
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Failed to reorder queue"
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error reordering queue",
      error: error.message
    });
  }
};

// Apply queue rules
export const applyQueueRules = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;
    const { rules } = req.body;

    const success = await QueueService.applyQueueRules(doctorId as string, date as string, rules);

    if (success) {
      return res.status(200).json({
        success: true,
        message: "Queue rules applied successfully"
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Failed to apply queue rules"
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error applying queue rules",
      error: error.message
    });
  }
};

// Add walk-in patient
export const addWalkInPatient = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;
    const patientData = req.body;

    const walkInAppointment = await QueueService.addWalkInPatient(doctorId as string, date as string, patientData);

    return res.status(201).json({
      success: true,
      message: "Walk-in patient added successfully",
      data: walkInAppointment
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error adding walk-in patient",
      error: error.message
    });
  }
};

// Skip patient
export const skipPatient = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const success = await QueueService.skipPatient(appointmentId as string, reason);

    if (success) {
      return res.status(200).json({
        success: true,
        message: "Patient skipped successfully"
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Failed to skip patient"
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error skipping patient",
      error: error.message
    });
  }
};

// Get queue analytics
export const getQueueAnalytics = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;

    const analytics = await QueueService.getQueueAnalytics(doctorId, date);

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching queue analytics",
      error: error.message
    });
  }
};

// Delete appointment
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res
      .status(200)
      .json({ message: "Appointment deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting appointment", error });
  }
};
