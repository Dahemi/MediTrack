import express from 'express';
import { signup, verifyEmail, login, resendVerification, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user (patient, doctor, or admin)
// @access  Public
router.post('/signup', signup);

// @route   GET /api/auth/verify/:token
// @desc    Verify email with token
// @access  Public
router.get('/verify/:token', verifyEmail);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', resendVerification);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, getProfile);

export default router;