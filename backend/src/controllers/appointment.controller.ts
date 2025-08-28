import { Request, Response } from "express";
import { Appointment } from "../models/appointment.model.js";

// Create new appointment (with conflict checking)
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, date, time, queueNumber, notes } = req.body;

    // Check if doctor already has an appointment at this date & time
    const existingDoctor = await Appointment.findOne({ doctorId, date, time });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked for the doctor.",
      });
    }

    // Check if patient already has appointment at same time
    const existingPatient = await Appointment.findOne({ patientId, date, time });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Patient already has another appointment at this time.",
      });
    }

    //  Save new appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
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
export const getAppointments = async (_req: Request, res: Response) => {
  try {
    const appointments = await Appointment.find()
      .populate("patientId", "name email")
      .populate("doctorId", "name specialization");

    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching appointments", error });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name email")
      .populate("doctorId", "name specialization");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching appointment", error });
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
    return res.status(500).json({ message: "Error updating appointment", error });
  }
};

// Update status only
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!["booked", "in_session", "completed", "cancelled"].includes(status)) {
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

// Delete appointment
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting appointment", error });
  }
};

// Cancel appointment with required reason
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, cancelledBy } = req.body;

    // Validate required fields
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required"
      });
    }

    // Find appointment and validate it can be cancelled
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // Validate appointment can be cancelled (not already cancelled/completed)
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false, 
        message: "Cannot cancel a completed appointment"
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled"
      });
    }

    // Update appointment status and add cancellation details
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: cancelledBy, // 'patient' or 'doctor'
        cancelledAt: new Date()
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: updatedAppointment
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error cancelling appointment",
      error: error.message
    });
  }
};

// Reschedule appointment with new date and time
export const rescheduleAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newDate, newTime, reason } = req.body;

    // Validate required fields
    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: "New date and time are required for rescheduling"
      });
    }

    // Find existing appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // Validate appointment can be rescheduled
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule a ${appointment.status} appointment`
      });
    }

    // Check for conflicts with new time slot
    const existingAppointment = await Appointment.findOne({
      doctorId: appointment.doctorId,
      date: newDate,
      time: newTime,
      _id: { $ne: id } // Exclude current appointment
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "Selected time slot is already booked"
      });
    }

    // Update appointment with new schedule
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        date: newDate,
        time: newTime,
        rescheduledFrom: {
          date: appointment.date,
          time: appointment.time
        },
        rescheduledReason: reason,
        rescheduledAt: new Date(),
        status: 'booked' // Reset status to booked
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: updatedAppointment
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error rescheduling appointment",
      error: error.message
    });
  }
};