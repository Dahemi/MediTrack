import type { Request, Response } from "express";
import User from "../models/user.model.js";

// Create a new doctor
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
