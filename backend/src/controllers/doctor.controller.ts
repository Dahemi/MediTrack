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
    const doctors = await Doctor.find(); // Don't populate userId for admin list
    console.log('getDoctors - Found doctors:', doctors);
    
    // Debug each doctor's userId field
    doctors.forEach((doctor, index) => {
      console.log(`Backend Doctor ${index}:`, {
        fullName: doctor.fullName,
        userId: doctor.userId,
        userIdType: typeof doctor.userId,
        userIdString: String(doctor.userId),
        isVerifiedDoctor: doctor.isVerifiedDoctor
      });
    });
    
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
    console.log('updateDoctor - Doctor ID:', req.params.id);
    console.log('updateDoctor - Request body:', req.body);
    console.log('updateDoctor - Availability in request:', req.body.availability);
    
    // Use findByIdAndUpdate with explicit $set for availability to ensure proper array replacement
    const updateData = {
      ...req.body,
      availability: req.body.availability // Explicitly set the availability array
    };
    
    console.log('updateDoctor - Final update data:', updateData);
    
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    
    console.log('updateDoctor - Updated doctor:', doctor);
    console.log('updateDoctor - Final availability:', doctor.availability);
    
    res.json({ success: true, data: { doctor } });
  } catch (error: any) {
    console.error('updateDoctor - Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update doctor profile by user ID (for logged-in doctor)
export const updateDoctorByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const doctor = await Doctor.findOneAndUpdate({ userId }, req.body, { new: true });
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }
    
    res.json({ success: true, data: { doctor } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete doctor
export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.json({ success: true, message: "Doctor deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doctor profile for current user (authenticated doctor)
export const getMyDoctorProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id; // From JWT token - use _id not id
    
    console.log('getMyDoctorProfile - User ID:', userId);
    console.log('getMyDoctorProfile - User:', req.user);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    
    const doctor = await Doctor.findOne({ userId }).populate('userId', 'name email role isVerified');
    
    console.log('getMyDoctorProfile - Found doctor:', doctor);
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }
    
    res.json({ success: true, data: { doctor } });
  } catch (error: any) {
    console.error('getMyDoctorProfile - Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update doctor profile for current user (authenticated doctor)
export const updateMyDoctorProfile = async (req: Request, res: Response) => {
  try {
    console.log('updateMyDoctorProfile - User ID:', req.user?._id);
    console.log('updateMyDoctorProfile - Request body:', req.body);
    console.log('updateMyDoctorProfile - Availability in request:', req.body.availability);
    
    const userId = req.user?._id; // From JWT token - use _id not id
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    
    // Use findOneAndUpdate with explicit $set for availability to ensure proper array replacement
    const updateData = {
      ...req.body,
      availability: req.body.availability // Explicitly set the availability array
    };
    
    console.log('updateMyDoctorProfile - Final update data:', updateData);
    
    const doctor = await Doctor.findOneAndUpdate(
      { userId }, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }
    
    console.log('updateMyDoctorProfile - Updated doctor:', doctor);
    console.log('updateMyDoctorProfile - Final availability:', doctor.availability);
    
    return res.json({ success: true, data: { doctor } });
  } catch (error: any) {
    console.error('updateMyDoctorProfile - Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all doctors with availability
export const getDoctorsWithAvailability = async (req: Request, res: Response) => {
  try {
    console.log('getDoctorsWithAvailability called');
    const doctors = await Doctor.find({ isVerifiedDoctor: true })
      .populate('userId', 'name email')
      .select('fullName specialization availability');
    
    console.log('Found doctors with availability:', doctors.length);
    res.json({ success: true, data: { doctors } });
  } catch (error: any) {
    console.error('Error in getDoctorsWithAvailability:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get available time slots for a doctor on a specific date
export const getDoctorAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    
    console.log('=== getDoctorAvailableSlots START ===');
    console.log('getDoctorAvailableSlots called with doctorId:', doctorId, 'date:', date);
    console.log('Request params:', req.params);
    console.log('Request query:', req.query);
    
    if (!date || typeof date !== 'string') {
      console.log('Date parameter validation failed');
      return res.status(400).json({ success: false, message: "Date parameter is required" });
    }
    
    console.log('About to find doctor with ID:', doctorId);
    const doctor = await Doctor.findById(doctorId);
    console.log('Doctor find result:', doctor ? 'Found' : 'Not found');
    
    if (!doctor) {
      console.log('Doctor not found for ID:', doctorId);
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    
    console.log('Found doctor:', doctor.fullName);
    console.log('Doctor ID from database:', doctor._id);
    console.log('Doctor availability from database:', doctor.availability);
    console.log('Doctor availability type:', typeof doctor.availability);
    console.log('Doctor availability is array:', Array.isArray(doctor.availability));
    console.log('Doctor availability length:', doctor.availability?.length);
    console.log('Looking for date:', date);
    
    // Check if availability exists and is an array
    if (!doctor.availability || !Array.isArray(doctor.availability)) {
      console.log('No availability array found for doctor');
      console.log('Doctor object keys:', Object.keys(doctor.toObject()));
      console.log('Doctor availability value:', doctor.availability);
      return res.json({ success: true, data: { slots: [] } });
    }
    
    // Check if doctor has any availability entries
    if (doctor.availability.length === 0) {
      console.log('Doctor has no availability entries');
      return res.json({ success: true, data: { slots: [] } });
    }
    
    console.log('Doctor has', doctor.availability.length, 'availability entries');
    console.log('First availability entry:', doctor.availability[0]);
    
    // Find availability for the specific date
    const availability = doctor.availability.find(a => {
      const availabilityDate = a.date.toISOString().split('T')[0];
      console.log('Comparing availability date:', availabilityDate, 'with requested date:', date);
      return availabilityDate === date;
    });
    
    if (!availability) {
      console.log('No availability found for date:', date);
      console.log('Available dates:', doctor.availability.map(a => a.date.toISOString().split('T')[0]));
      return res.json({ success: true, data: { slots: [] } });
    }
    
    console.log('Found availability:', availability);
    
    // Calculate 30-minute slots between start and end time
    const slots: string[] = [];
    const startTime = new Date(`2000-01-01T${availability.startTime}`);
    const endTime = new Date(`2000-01-01T${availability.endTime}`);
    
    console.log('Start time object:', startTime);
    console.log('End time object:', endTime);
    
    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      slots.push(timeString);
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    
    console.log('Calculated slots:', slots);
    
    // Get booked appointments for this date
    console.log('Querying booked appointments with:', { doctorId, date });
    const bookedAppointments = await Appointment.find({
      doctorId,
      date,
      status: { $in: ['booked', 'in_session'] }
    });
    
    console.log('Booked appointments:', bookedAppointments);
    
    // Remove booked slots
    const bookedTimes = bookedAppointments.map(app => app.time);
    const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));
    
    console.log('Available slots:', availableSlots);
    
    res.json({ success: true, data: { slots: availableSlots } });
  } catch (error: any) {
    console.error('Error in getDoctorAvailableSlots:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};