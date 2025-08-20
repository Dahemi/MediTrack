import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Patient, { IPatient } from '../models/Patient.js';
import { sendVerificationEmail } from '../config/mailer.js';

// Register a new patient
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
      return;
    }

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ email: email.toLowerCase() });
    if (existingPatient) {
      res.status(400).json({
        success: false,
        message: 'A patient with this email already exists',
      });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new patient
    const newPatient = new Patient({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    // Save patient to database
    await newPatient.save();

    // Send verification email
    try {
      await sendVerificationEmail(newPatient.email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Delete the patient if email sending fails
      await Patient.findByIdAndDelete(newPatient._id);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        patient: {
          id: newPatient._id,
          name: newPatient.name,
          email: newPatient.email,
          isVerified: newPatient.isVerified,
        },
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);

    // Handle duplicate email error
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'A patient with this email already exists',
      });
      return;
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
};

// Verify email token
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
      return;
    }

    // Find patient by verification token
    const patient = await Patient.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!patient) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
      return;
    }

    // Check if already verified
    if (patient.isVerified) {
      res.status(200).json({
        success: true,
        message: 'Email is already verified',
        data: {
          patient: {
            id: patient._id,
            name: patient.name,
            email: patient.email,
            isVerified: patient.isVerified,
          },
        },
      });
      return;
    }

    // Update patient verification status
    patient.isVerified = true;
    patient.verificationToken = undefined;
    patient.verificationTokenExpires = undefined;
    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in to your account.',
      data: {
        patient: {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          isVerified: patient.isVerified,
        },
      },
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
};

// Login patient (basic implementation for testing)
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    // Find patient by email
    const patient = await Patient.findOne({ email: email.toLowerCase() }).select('+password');
    if (!patient) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if email is verified
    if (!patient.isVerified) {
      res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in',
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, patient.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        patient: {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          isVerified: patient.isVerified,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
};

// Resend verification email
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    const patient = await Patient.findOne({ email: email.toLowerCase() });
    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'No account found with this email',
      });
      return;
    }

    if (patient.isVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
      return;
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    patient.verificationToken = verificationToken;
    patient.verificationTokenExpires = verificationTokenExpires;
    await patient.save();

    // Send verification email
    await sendVerificationEmail(patient.email, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
    });
  }
};