import { Request, Response } from "express";
import { Appointment } from "../models/appointment.model.js";
import User, { IUser } from "../models/user.model.js";
import { Document } from "mongoose";
import mongoose from "mongoose";
import { checkAndNotifyPatients } from '../services/notification.service';

// Helper to get start time for doctor on a given date
function getDoctorStartTime(doctor: Document<unknown, {}, IUser, {}, {}> & IUser & Required<{ _id: unknown; }> & { __v: number; }, date: any) {
  if (!doctor.availability) return null;
  const avail = doctor.availability.find((a: { date: string | Date; startTime: string }) => {
    // Compare date only (YYYY-MM-DD)
    const availDate = typeof a.date === "string" ? a.date.split("T")[0] : (a.date as Date).toISOString().split("T")[0];
    return availDate === date;
  });
  return avail ? avail.startTime : null;
}

// Helper to calculate slot index
function getSlotIndex(startTime: string, bookedTime: string) {
  // Both in "HH:mm" format
  const [startHour, startMinRaw] = startTime.split(":");
  const [bookedHour, bookedMinRaw] = bookedTime.split(":");
  const startHourNum = Number(startHour);
  const startMinNum = startMinRaw !== undefined ? Number(startMinRaw) : 0;
  const bookedHourNum = Number(bookedHour);
  const bookedMinNum = bookedMinRaw !== undefined ? Number(bookedMinRaw) : 0;
  const startTotalMin = startHourNum * 60 + startMinNum;
  const bookedTotalMin = bookedHourNum * 60 + bookedMinNum;
  return Math.floor((bookedTotalMin - startTotalMin) / 30);
}

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const {
      patientId, 
      patientName,
      patientAddress,
      patientContact,
      doctorId,
      doctorName,
      date, // "YYYY-MM-DD"
      time, // "HH:mm"
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

    // Check if patient already has appointment at same time
    const existingPatient = await Appointment.findOne({ patientId, date, time });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Patient already has another appointment at this time.",
      });
    }

    // Find the max queueNumber for this doctor on this date
    const lastAppointment = await Appointment.findOne({ doctorId, date }).sort({ queueNumber: -1 });
    // Get doctor availability for the date
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    const startTime = getDoctorStartTime(doctor, date);
    if (!startTime) {
      return res.status(400).json({ success: false, message: "Doctor not available on this date" });
    }

    // Calculate queue number based on slot index
    const slotIndex = getSlotIndex(startTime, time);
    if (slotIndex < 0) {
      return res.status(400).json({ success: false, message: "Invalid booking time" });
    }
    const queueNumber = slotIndex + 1;

    // Save new appointment
    const appointment = await Appointment.create({
      patientId, // Add this
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
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // If status changed to "in_session", notify upcoming patients
    if (status === 'in_session') {
      await checkAndNotifyPatients(appointment.doctorId, appointment._id);
    }

    return res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: appointment
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error updating appointment status",
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

// Get appointments by patient ID
export const getAppointmentsByPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required"
      });
    }

    // Simplified query without populate to test
    const appointments = await Appointment.find({ 
      patientId: patientId // Make sure patientId matches exactly
    }).sort({ date: -1, time: -1 });


    if (!appointments) {
      return res.status(200).json({
        success: true,
        data: [] // Return empty array if no appointments
      });
    }

    return res.status(200).json({
      success: true,
      data: appointments
    });

  } catch (error: any) {
    console.error('Error details:', error); // More detailed error logging
    return res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message
    });
  }
};
export const getDoctorAppointmentsByDate = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;
    
    // Convert string ID to ObjectId for proper comparison
    const objectId = new mongoose.Types.ObjectId(doctorId);
    
    const appointments = await Appointment.find({ 
      doctorId: objectId, 
      date 
    })
      .sort({ queueNumber: 1 })
      .select("_id patientName patientAddress patientContact time queueNumber status notes date");

    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ success: false, message: "Error fetching appointments", error });
  }
};

export const getDoctorAppointments = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    
    // Convert string ID to ObjectId for proper comparison
    const objectId = new mongoose.Types.ObjectId(doctorId);
    
    const appointments = await Appointment.find({ 
      doctorId: objectId
    })
      .sort({ date: -1, time: -1 })
      .select("_id patientName patientAddress patientContact time queueNumber status notes date");

    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ success: false, message: "Error fetching appointments", error });
  }
};
