import { Request, Response } from "express";
import { Appointment } from "../models/appointment.model.js";

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

// ✅ Get all appointments
export const getAppointments = async (_req: Request, res: Response) => {
  try {
    const appointments = await Appointment.find()
      //.populate("patientId", "name email")
      .populate("doctorId", "name specialization");

    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching appointments", error });
  }
};

// ✅ Get appointment by ID
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      //.populate("patientId", "name email")
      .populate("doctorId", "name specialization");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching appointment", error });
  }
};

// ✅ Update appointment
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

// ✅ Update status only
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

// ✅ Delete appointment
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
