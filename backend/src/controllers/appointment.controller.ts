import { Request, Response } from "express";
import { Appointment } from "../models/appointment.model.js";

// ✅ Create new appointment (with conflict checking)
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, date, time, queueNumber, notes } = req.body;
    
    console.log('=== CREATING APPOINTMENT ===');
    console.log('Request body:', req.body);
    console.log('User from request:', req.user);

    // Validate that doctor exists
    const User = (await import("../models/User.js")).default;
    const doctorUser = await User.findById(doctorId);
    if (!doctorUser) {
      return res.status(400).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    //  Check if doctor already has an appointment at this date & time
    const existingDoctor = await Appointment.findOne({ doctorId, date, time });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked for the doctor.",
      });
    }

    // (Optional) Check if patient already has appointment at same time
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
    
    console.log('=== APPOINTMENT SAVED ===');
    console.log('Saved appointment:', appointment);

    // Populate the appointment with patient and doctor details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patientId", "name email")
      .populate("doctorId", "name email");
    
    console.log('=== APPOINTMENT POPULATED ===');
    console.log('Populated appointment:', populatedAppointment);
    console.log('Patient ID type:', typeof populatedAppointment.patientId);
    console.log('Doctor ID type:', typeof populatedAppointment.doctorId);
    console.log('Patient ID:', populatedAppointment.patientId);
    console.log('Doctor ID:', populatedAppointment.doctorId);

    // Get doctor details from Doctor model for specialization
    const Doctor = (await import("../models/doctor.model.js")).default;
    const doctorDetails = await Doctor.findOne({ userId: appointment.doctorId });
    
    console.log('=== DOCTOR DETAILS FOUND ===');
    console.log('Doctor details:', doctorDetails);
    
    // Transform the data to match frontend expectations
    const transformedAppointment = {
      _id: populatedAppointment._id,
      patientId: {
        name: (populatedAppointment.patientId as any)?.name || 'Unknown Patient',
        email: (populatedAppointment.patientId as any)?.email || 'No email'
      },
      doctorId: {
        name: doctorDetails?.fullName || doctorUser?.name || 'Unknown Doctor',
        specialization: doctorDetails?.specialization || 'General',
        email: doctorUser?.email || 'No email'
      },
      date: populatedAppointment.date,
      time: populatedAppointment.time,
      status: populatedAppointment.status,
      queueNumber: populatedAppointment.queueNumber,
      notes: populatedAppointment.notes,
      createdAt: populatedAppointment.createdAt,
      updatedAt: populatedAppointment.updatedAt
    };

    console.log('=== APPOINTMENT CREATED SUCCESSFULLY ===');
    console.log('Original appointment:', appointment);
    console.log('Populated appointment:', populatedAppointment);
    console.log('Doctor details:', doctorDetails);
    console.log('Transformed appointment:', transformedAppointment);

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      data: transformedAppointment,
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
      .populate("patientId", "name email")
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

// ✅ Get appointments for a specific doctor
export const getDoctorAppointments = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    
    const appointments = await Appointment.find({ doctorId })
      .populate("patientId", "name email")
      .populate("doctorId", "name specialization")
      .sort({ date: 1, time: 1 });

    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching doctor appointments", error });
  }
};

// ✅ Get appointments for current doctor (authenticated)
export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Find doctor by userId
    const Doctor = (await import("../models/doctor.model.js")).default;
    const doctor = await Doctor.findOne({ userId });
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointments = await Appointment.find({ doctorId: userId })
      .populate("patientId", "name email")
      .populate("doctorId", "name email")
      .sort({ date: 1, time: 1 });

    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching appointments", error });
  }
};

// ✅ Get appointments for current patient (authenticated)
export const getMyPatientAppointments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    console.log('=== FETCHING PATIENT APPOINTMENTS ===');
    console.log('Patient userId:', userId);

    const appointments = await Appointment.find({ patientId: userId })
      .populate("patientId", "name email")
      .populate("doctorId", "name email")
      .sort({ date: 1, time: 1 });

    console.log('=== APPOINTMENTS FOUND ===');
    console.log('Raw appointments:', appointments);

    // Get doctor details from Doctor model
    const Doctor = (await import("../models/doctor.model.js")).default;
    
    // Transform the data to match the expected frontend structure
    const transformedAppointments = await Promise.all(appointments.map(async (appointment) => {
      console.log('=== TRANSFORMING APPOINTMENT ===');
      console.log('Appointment ID:', appointment._id);
      console.log('Doctor ID:', appointment.doctorId);
      console.log('Patient ID:', appointment.patientId);
      
      const doctorDetails = await Doctor.findOne({ userId: appointment.doctorId });
      console.log('Doctor details found:', doctorDetails);
      
      const transformed = {
        _id: appointment._id,
        patientId: {
          name: (appointment.patientId as any)?.name || 'Unknown Patient',
          email: (appointment.patientId as any)?.email || 'No email'
        },
        doctorId: {
          name: doctorDetails?.fullName || (appointment.doctorId as any)?.name || 'Unknown Doctor',
          specialization: doctorDetails?.specialization || 'General'
        },
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        queueNumber: appointment.queueNumber,
        notes: appointment.notes
      };
      
      console.log('Transformed appointment:', transformed);
      return transformed;
    }));

    console.log('=== FINAL TRANSFORMED APPOINTMENTS ===');
    console.log('Transformed appointments:', transformedAppointments);

    return res.status(200).json(transformedAppointments);
  } catch (error) {
    console.error('=== ERROR IN GET MY PATIENT APPOINTMENTS ===');
    console.error('Error:', error);
    return res.status(500).json({ message: "Error fetching patient appointments", error });
  }
};
