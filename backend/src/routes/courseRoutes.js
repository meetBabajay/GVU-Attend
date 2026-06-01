const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateJWT, isLecturer } = require('../middlewares/auth');

// Protected: Get user-dependent courses list
router.get('/', authenticateJWT, courseController.listCourses);

// Protected: Create a new course (Lecturer only)
router.post('/', authenticateJWT, isLecturer, courseController.createCourse);

// Protected: View details of a specific course
router.get('/:id', authenticateJWT, courseController.getCourseDetails);

// Protected: Enrol list of students (Lecturer only)
router.post('/:id/enroll', authenticateJWT, isLecturer, courseController.enrollStudents);

module.exports = router;
