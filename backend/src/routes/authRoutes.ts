import express from 'express';
import { signup, verifyEmail, login, resendVerification } from '../controllers/authController.js';

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new patient
// @access  Public
router.post('/signup', signup);

// @route   GET /api/auth/verify/:token
// @desc    Verify email with token
// @access  Public
router.get('/verify/:token', verifyEmail);

// @route   POST /api/auth/login
// @desc    Login patient
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', resendVerification);

export default router;