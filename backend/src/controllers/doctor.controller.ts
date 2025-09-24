import type { Request, Response } from "express";
import User from "../models/user.model.js";
import { Appointment } from "../models/appointment.model.js";

// Helper function to normalize dates to YYYY-MM-DD format
const normalizeDate = (dateString: string): string => {
  try {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If it's an ISO string, extract just the date part
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Try to parse and format the date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    
    // Format as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error normalizing date:', dateString, error);
    return dateString; // Return original if normalization fails
  }
};

// Create a new doctor -- ADMIN ONLY FUNCTION -> Add to route
export const createDoctor = async (req: Request, res: Response) => {
  try {
    const doctorData = {
      ...req.body,
      userType: "doctor",
      name: req.body.fullName, // Use fullName as name for consistency
    };

    const doctor = new User(doctorData);
    await doctor.save();
    res.status(201).json({ success: true, doctor });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all doctors
export const getDoctors = async (_req: Request, res: Response) => {
  try {
    const doctors = await User.find({ userType: "doctor" });
    res.json({ success: true, doctors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doctor by ID
export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const doctor = await User.findOne({
      _id: req.params.id,
      userType: "doctor",
    });
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    
    // Normalize availability dates in response
    if (doctor.availability && Array.isArray(doctor.availability)) {
      doctor.availability = doctor.availability.map((slot: any) => ({
        ...slot,
        date: normalizeDate(slot.date)
      }));
    }
    
    res.json({ success: true, doctor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update doctor
export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const updateData = {
      ...req.body,
      name: req.body.fullName, // Keep name in sync with fullName
    };

    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, userType: "doctor" },
      updateData,
      { new: true }
    );
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    res.json({ success: true, doctor });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update doctor profile (doctor can update their own profile)
export const updateDoctorProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Normalize availability dates if present
    let updateData = {
      ...req.body,
      name: req.body.fullName, // Keep name in sync with fullName
    };
    
    // Normalize availability dates to YYYY-MM-DD format
    if (req.body.availability && Array.isArray(req.body.availability)) {
      updateData.availability = req.body.availability.map((slot: any) => ({
        ...slot,
        date: normalizeDate(slot.date)
      }));
    }

    const doctor = await User.findOneAndUpdate(
      { _id: id, userType: "doctor" },
      updateData,
      { new: true }
    );
    
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    
    res.json({ success: true, doctor });
  } catch (error: any) {
    console.error("Error updating doctor profile:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get doctor's patients
export const getDoctorPatients = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get all appointments for this doctor
    const appointments = await Appointment.find({ doctorId: id })
      .sort({ date: -1, time: -1 })
      .select("_id patientName patientAddress patientContact time queueNumber status notes date patientId");
    
    // Group appointments by patient
    const patientMap = new Map();
    
    appointments.forEach((appointment: any) => {
      const patientId = appointment.patientId;
      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          _id: patientId,
          name: appointment.patientName,
          email: "N/A", // Email not stored in appointments
          contact: appointment.patientContact,
          address: appointment.patientAddress,
          totalAppointments: 0,
          lastAppointment: null,
          nextAppointment: null,
          status: "active"
        });
      }
      
      const patient = patientMap.get(patientId);
      patient.totalAppointments++;
      
      // Update last appointment
      if (!patient.lastAppointment || appointment.date > patient.lastAppointment) {
        patient.lastAppointment = appointment.date;
      }
      
      // Update next appointment (future appointments)
      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      if (appointmentDate > today && (!patient.nextAppointment || appointment.date < patient.nextAppointment)) {
        patient.nextAppointment = appointment.date;
      }
    });
    
    const patients = Array.from(patientMap.values());
    
    res.json({ success: true, patients });
  } catch (error: any) {
    console.error("Error fetching doctor patients:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete doctor
export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await User.findOneAndDelete({
      _id: req.params.id,
      userType: "doctor",
    });
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    res.json({ success: true, message: "Doctor deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
