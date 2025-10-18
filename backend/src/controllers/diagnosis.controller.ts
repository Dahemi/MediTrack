import { Request, Response } from "express";
import Diagnosis from "../models/diagnosis.model.js";
import { Appointment } from "../models/appointment.model.js";

export const createDiagnosis = async (req: Request, res: Response) => {
  try {
    const {
      appointmentId,
      patientId,
      doctorId,
      diagnosis,
      symptoms,
      notes,
      drugs,
      doctorFee,
    } = req.body;

    // Validate required fields
    if (!appointmentId || !patientId || !doctorId || !diagnosis || !symptoms || doctorFee === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if diagnosis already exists for this appointment
    const existingDiagnosis = await Diagnosis.findOne({ appointmentId });
    if (existingDiagnosis) {
      return res.status(400).json({
        success: false,
        message: "Diagnosis already exists for this appointment",
      });
    }

    // Calculate drugs cost
    const drugsArray = drugs || [];
    const drugsCost = drugsArray.reduce((total: number, drug: any) => {
      return total + (drug.price * drug.quantity);
    }, 0);

    // Calculate total amount
    const registrationFee = 1000;
    const totalAmount = registrationFee + doctorFee + drugsCost;

    // Create new diagnosis
    const newDiagnosis = new Diagnosis({
      appointmentId,
      patientId,
      doctorId,
      diagnosis,
      symptoms,
      notes,
      drugs: drugsArray,
      registrationFee,
      doctorFee,
      drugsCost,
      totalAmount,
      prescribedAt: new Date(),
    });

    await newDiagnosis.save();

    // Update appointment status to completed if not already
    await Appointment.findByIdAndUpdate(appointmentId, {
      status: "completed",
    });

    return res.status(201).json({
      success: true,
      message: "Diagnosis created successfully",
      data: newDiagnosis,
    });
  } catch (error: any) {
    console.error("Error creating diagnosis:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create diagnosis",
      error: error.message,
    });
  }
};

export const getDiagnosisByAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    const diagnosis = await Diagnosis.findOne({ appointmentId })
      .populate("patientId", "name email")
      .populate("doctorId", "name email");

    if (!diagnosis) {
      return res.status(404).json({
        success: false,
        message: "Diagnosis not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: diagnosis,
    });
  } catch (error: any) {
    console.error("Error fetching diagnosis:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch diagnosis",
      error: error.message,
    });
  }
};

export const getDiagnosesByDoctor = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;

    const diagnoses = await Diagnosis.find({ doctorId })
      .populate("patientId", "name email")
      .populate("appointmentId", "date time queueNumber")
      .sort({ prescribedAt: -1 });

    return res.status(200).json({
      success: true,
      count: diagnoses.length,
      data: diagnoses,
    });
  } catch (error: any) {
    console.error("Error fetching doctor diagnoses:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch diagnoses",
      error: error.message,
    });
  }
};

export const getDiagnosesByPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const diagnoses = await Diagnosis.find({ patientId })
      .populate("doctorId", "name email fullName specialization")
      .populate("appointmentId", "date time queueNumber")
      .sort({ prescribedAt: -1 });

    return res.status(200).json({
      success: true,
      count: diagnoses.length,
      data: diagnoses,
    });
  } catch (error: any) {
    console.error("Error fetching patient diagnoses:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch diagnoses",
      error: error.message,
    });
  }
};

export const getAllDiagnoses = async (req: Request, res: Response) => {
  try {
    const diagnoses = await Diagnosis.find()
      .populate("patientId", "name email")
      .populate("doctorId", "name email fullName specialization")
      .populate("appointmentId", "date time queueNumber")
      .sort({ prescribedAt: -1 });

    return res.status(200).json({
      success: true,
      count: diagnoses.length,
      data: diagnoses,
    });
  } catch (error: any) {
    console.error("Error fetching all diagnoses:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch diagnoses",
      error: error.message,
    });
  }
};

export const updateDiagnosis = async (req: Request, res: Response) => {
  try {
    const { diagnosisId } = req.params;
    const updateData = req.body;

    const updatedDiagnosis = await Diagnosis.findByIdAndUpdate(
      diagnosisId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDiagnosis) {
      return res.status(404).json({
        success: false,
        message: "Diagnosis not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Diagnosis updated successfully",
      data: updatedDiagnosis,
    });
  } catch (error: any) {
    console.error("Error updating diagnosis:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update diagnosis",
      error: error.message,
    });
  }
};

export const getRevenueStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, doctorId } = req.query;

    let query: any = {};

    // Filter by date range if provided
    if (startDate && endDate) {
      query.prescribedAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Filter by doctor if provided
    if (doctorId) {
      query.doctorId = doctorId;
    }

    const diagnoses = await Diagnosis.find(query);

    // Calculate revenue statistics
    const stats = {
      totalDiagnoses: diagnoses.length,
      totalRegistrationFees: diagnoses.reduce((sum: number, d: any) => sum + d.registrationFee, 0),
      totalDoctorFees: diagnoses.reduce((sum: number, d: any) => sum + d.doctorFee, 0),
      totalDrugsCost: diagnoses.reduce((sum: number, d: any) => sum + d.drugsCost, 0),
      totalRevenue: diagnoses.reduce((sum: number, d: any) => sum + d.totalAmount, 0),
      averagePerDiagnosis: diagnoses.length > 0
        ? diagnoses.reduce((sum: number, d: any) => sum + d.totalAmount, 0) / diagnoses.length
        : 0,
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Error calculating revenue stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate revenue stats",
      error: error.message,
    });
  }
};
