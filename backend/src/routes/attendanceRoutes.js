const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateJWT, isLecturer, isStudent } = require('../middlewares/auth');

// Protected: Student submits scanned QR + Geolocation + Fingerprint
router.post('/submit', authenticateJWT, isStudent, attendanceController.submitAttendance);

// Protected: Lecturer views attendance list for a session
router.get('/session/:sessionId', authenticateJWT, isLecturer, attendanceController.listSessionAttendance);

// Protected: View student history log (Lecturers can view anyone, students only themselves)
router.get('/student/:studentId', authenticateJWT, attendanceController.listStudentAttendance);

// Protected: Student checks their own attendance stats for a course
router.get('/student-stats/course/:courseId', authenticateJWT, isStudent, attendanceController.getStudentCourseStats);

module.exports = router;
