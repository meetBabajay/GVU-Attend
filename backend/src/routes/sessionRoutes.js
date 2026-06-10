const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticateJWT, isLecturer } = require('../middlewares/auth');

// Protected: List all rooms
router.get('/rooms', authenticateJWT, sessionController.listRooms);

// Protected: List all sessions of a specific course
router.get('/course/:courseId', authenticateJWT, sessionController.listSessions);

// Protected: Create a session for a course (Lecturer only)
router.post('/course/:courseId', authenticateJWT, isLecturer, sessionController.createSession);

// Protected: Open attendance session to receive student scans (Lecturer only)
router.post('/open/:sessionId', authenticateJWT, isLecturer, sessionController.openSession);

// Protected: Close attendance session and stop scans (Lecturer only)
router.post('/close/:sessionId', authenticateJWT, isLecturer, sessionController.closeSession);

// Protected: Retrieve time-sensitive QR token (Lecturer only)
router.get('/:sessionId/qr', authenticateJWT, isLecturer, sessionController.getQRToken);

module.exports = router;
