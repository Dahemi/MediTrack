import type { Request, Response } from "express";
import Doctor from "../models/doctor.model.js";
import User from "../models/User.js";
import { Appointment } from "../models/appointment.model.js";

// Create a new doctor profile (linked to existing user)
export const createDoctor = async (req: Request, res: Response) => {
  try {
    const { userId, ...doctorData } = req.body;
    
    // Check if user exists and is a doctor
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (user.role !== 'doctor') {
      return res.status(400).json({ success: false, message: "User must have doctor role" });
    }
    
    // Check if doctor profile already exists for this user
    const existingDoctor = await Doctor.findOne({ userId });
    if (existingDoctor) {
      return res.status(400).json({ success: false, message: "Doctor profile already exists for this user" });
    }
    
    const doctor = new Doctor({
      userId,
      ...doctorData,
      isVerifiedDoctor: true // Set to true when admin creates the profile
    });
    await doctor.save();
    
    res.status(201).json({ success: true, data: { doctor } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all doctors with user information
export const getDoctors = async (_req: Request, res: Response) => {
  try {
    const doctors = await Doctor.find();
    res.json({ success: true, data: { doctors } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doctor by ID with user information
export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email role isVerified');
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.json({ success: true, data: { doctor } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doctor profile by user ID (for logged-in doctor)
export const getDoctorByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const doctor = await Doctor.findOne({ userId }).populate('userId', 'name email role isVerified');
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }
    
    res.json({ success: true, data: { doctor } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update doctor profile
export const updateDoctor = async (req: Request, res: Response) => {
  try {
    
    // First, get the current doctor to find the userId
    const currentDoctor = await Doctor.findById(req.params.id);
    if (!currentDoctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    
    // Use findByIdAndUpdate with explicit $set for availability to ensure proper array replacement
    const updateData = {
      ...req.body,
      availability: req.body.availability // Explicitly set the availability array
    };
    
    // Update doctor profile
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    
    // If fullName was updated, also update the User model
    if (req.body.fullName && req.body.fullName !== currentDoctor.fullName) {
      await syncDoctorName(currentDoctor.userId, req.body.fullName);
    }
    
    res.json({ success: true, data: { doctor } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update doctor profile by user ID (for logged-in doctor)
export const updateDoctorByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // First, get the current doctor to check if fullName is being updated
    const currentDoctor = await Doctor.findOne({ userId });
    if (!currentDoctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }
    
    // Update doctor profile
    const doctor = await Doctor.findOneAndUpdate({ userId }, req.body, { new: true });
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }
    
    // If fullName was updated, also update the User model
    if (req.body.fullName && req.body.fullName !== currentDoctor.fullName) {
      await syncDoctorName(userId, req.body.fullName);
    }
    
    res.json({ success: true, data: { doctor } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Utility function to synchronize doctor name between Doctor and User models
const syncDoctorName = async (userId: string, newFullName: string) => {
  try {
    await User.findByIdAndUpdate(
      userId,
      { name: newFullName },
      { new: true, runValidators: true }
    );
    return true;
  } catch (error) {
    return false;
  }
};

// Delete doctor
export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const { deleteUser: shouldDeleteUser } = req.query;
    
    // Get the doctor first to check if we should also delete the user
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    
    // Delete the doctor profile
    await Doctor.findByIdAndDelete(req.params.id);
    
    // Optionally delete the associated user if requested
    if (shouldDeleteUser === 'true' && doctor.userId) {
      try {
        await User.findByIdAndDelete(doctor.userId);
      } catch (_userDeleteError) {
        // Don't fail the entire operation if user deletion fails
      }
    }
    
    res.json({ 
      success: true, 
      message: shouldDeleteUser === 'true' ? "Doctor and user deleted" : "Doctor profile deleted" 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doctor profile for current user (authenticated doctor)
export const getMyDoctorProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id; // From JWT token - use _id not id
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    
    const doctor = await Doctor.findOne({ userId }).populate('userId', 'name email role isVerified');
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }
    
    res.json({ success: true, data: { doctor } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update doctor profile for current user (authenticated doctor)
export const updateMyDoctorProfile = async (req: Request, res: Response) => {
  try {
    
    const userId = req.user?._id; // From JWT token - use _id not id
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    
    // First, get the current doctor to check if fullName is being updated
    const currentDoctor = await Doctor.findOne({ userId });
    if (!currentDoctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }
    
    // Use findOneAndUpdate with explicit $set for availability to ensure proper array replacement
    const updateData = {
      ...req.body,
      availability: req.body.availability // Explicitly set the availability array
    };
    
    // Update doctor profile
    const doctor = await Doctor.findOneAndUpdate(
      { userId }, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }
    
    // If fullName was updated, also update the User model
    if (req.body.fullName && req.body.fullName !== currentDoctor.fullName) {
      await syncDoctorName(userId, req.body.fullName);
    }
    
    return res.json({ success: true, data: { doctor } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all doctors with availability
export const getDoctorsWithAvailability = async (req: Request, res: Response) => {
  try {
    const doctors = await Doctor.find({ isVerifiedDoctor: true })
      .populate('userId', 'name email')
      .select('fullName specialization availability');
    res.json({ success: true, data: { doctors } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get available time slots for a doctor on a specific date
export const getDoctorAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ success: false, message: "Date parameter is required" });
    }
    const doctor = await Doctor.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    // Check if availability exists and is an array
    if (!doctor.availability || !Array.isArray(doctor.availability)) {
      return res.json({ success: true, data: { slots: [] } });
    }
    // Check if doctor has any availability entries
    if (doctor.availability.length === 0) {
      return res.json({ success: true, data: { slots: [] } });
    }
    
    // Find availability for the specific date
    const availability = doctor.availability.find(a => a.date.toISOString().split('T')[0] === date);
    
    if (!availability) {
      return res.json({ success: true, data: { slots: [] } });
    }
    
    // Calculate 30-minute slots between start and end time
    const slots: string[] = [];
    const startTime = new Date(`2000-01-01T${availability.startTime}`);
    const endTime = new Date(`2000-01-01T${availability.endTime}`);
    
    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      slots.push(timeString);
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    // Get booked appointments for this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date,
      status: { $in: ['booked', 'in_session'] }
    });
    // Remove booked slots
    const bookedTimes = bookedAppointments.map(app => app.time);
    const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));
    res.json({ success: true, data: { slots: availableSlots } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};