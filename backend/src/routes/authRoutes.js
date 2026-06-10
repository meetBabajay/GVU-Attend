const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT, isAdmin } = require('../middlewares/auth');

// ── Public Routes ───────────────────────────────────────────
router.post('/login', authController.login);

// Student self-registration (pending admin approval)
router.post('/register-student', authController.registerStudent);

// Instructor self-registration (pending admin approval)
router.post('/register-lecturer', authController.registerLecturer);

// Public: list all departments (used by registration form)
router.get('/departments', authController.listDepartments);

// ── Authenticated Routes ───────────────────────────────────
// Get current logged-in user profile
router.get('/me', authenticateJWT, authController.me);

// ── Admin-Only Routes ──────────────────────────────────────
// List all pending (unapproved) user registrations
router.get('/pending', authenticateJWT, isAdmin, authController.listPendingUsers);

// Approve a pending registration
router.post('/approve/:userId', authenticateJWT, isAdmin, authController.approveUser);

// Reject (delete) a pending registration
router.delete('/reject/:userId', authenticateJWT, isAdmin, authController.rejectUser);

module.exports = router;
