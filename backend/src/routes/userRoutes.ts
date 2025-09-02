import express from 'express';
import { getAllUsers, getUsersByRole, updateUserRole, deleteUser } from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// @route   GET /api/users
// @desc    Get all users
// @access  Admin only
router.get('/', getAllUsers);

// @route   GET /api/users/role/:role
// @desc    Get users by role
// @access  Admin only
router.get('/role/:role', getUsersByRole);

// @route   PUT /api/users/:userId/role
// @desc    Update user role
// @access  Admin only
router.put('/:userId/role', updateUserRole);

// @route   DELETE /api/users/:userId
// @desc    Delete user
// @access  Admin only
router.delete('/:userId', deleteUser);

export default router;
