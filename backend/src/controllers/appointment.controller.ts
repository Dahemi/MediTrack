import { Request, Response } from "express";
import { Appointment } from "../models/appointment.model.js";
import User from "../models/user.model.js";

// Create new appointment (with conflict checking)
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, date, time, queueNumber, notes } = req.body;

    // Verify that the doctorId is actually a doctor
    const doctor = await User.findOne({ _id: doctorId, userType: "doctor" });
    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    // Verify that the patientId is actually a patient
    const patient = await User.findOne({ _id: patientId, userType: "patient" });
    if (!patient) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    // Check if doctor already has an appointment at this date & time
    const existingDoctor = await Appointment.findOne({ doctorId, date, time });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked for the doctor.",
      });
    }

    // Check if patient already has appointment at same time
    const existingPatient = await Appointment.findOne({
      patientId,
      date,
      time,
    });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Patient already has another appointment at this time.",
      });
    }

    // Save new appointment
    const appointment = new Appointment({
      patientId,
      doctorId,
      date,
      time,
      queueNumber,
      notes,
    });

    await appointment.save();

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating appointment", error });
  }
};

// Get all appointments
export const getAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await Appointment.find()
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

    return res
      .status(200)
      .json({ message: "Appointment deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting appointment", error });
  }
};
