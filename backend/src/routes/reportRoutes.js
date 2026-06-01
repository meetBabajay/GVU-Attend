const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateJWT, isLecturer } = require('../middlewares/auth');

// Protected: Lecturer dashboard statistics counters
router.get('/dashboard', authenticateJWT, isLecturer, reportController.getLecturerDashboardStats);

// Protected: Detailed course attendance report
router.get('/course/:courseId', authenticateJWT, isLecturer, reportController.getCourseAttendanceReport);

// Protected: Export course report as CSV format file
router.get('/course/:courseId/export-csv', authenticateJWT, isLecturer, reportController.exportCourseReportCSV);

module.exports = router;
