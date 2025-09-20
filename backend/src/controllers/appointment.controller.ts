import { Request, Response } from "express";
import { Appointment } from "../models/appointment.model.js";
import User, { IUser } from "../models/user.model.js";
import { Document } from "mongoose";

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
    if (!["booked", "in_session", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("_id patientName time queueNumber status");
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

    return res
      .status(200)
      .json({ message: "Appointment deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting appointment", error });
  }
};

export const getDoctorAppointmentsByDate = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;
    const appointments = await Appointment.find({ doctorId, date })
      .sort({ queueNumber: 1 })
      .select("_id patientName time queueNumber status") // Only select needed fields
      // .populate({ ... }) // Only if you need doctor details

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching appointments", error });
  }
};
