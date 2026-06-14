const express = require('express');
const router = express.Router();
const scoresController = require('../controllers/scoresController');
const { authenticateJWT, isStudent } = require('../middlewares/auth');

// Local middleware for verifying Lecturer or Admin privileges
const isLecturerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'lecturer' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied: Lecturer or Administrator privileges required' });
  }
};

// GET /api/scores/student - Get scoreboard for logged-in student (Student only)
router.get('/student', authenticateJWT, isStudent, scoresController.getStudentScores);

// GET /api/scores/course/:id - Get student grades list for a specific course (Lecturer/Admin only)
router.get('/course/:id', authenticateJWT, isLecturerOrAdmin, scoresController.getCourseScores);

// POST /api/scores/test - Create or Update a student test score (Lecturer/Admin only)
router.post('/test', authenticateJWT, isLecturerOrAdmin, scoresController.createOrUpdateTestScore);

// PATCH /api/scores/test/:id - Update an existing test score record (Lecturer/Admin only)
router.patch('/test/:id', authenticateJWT, isLecturerOrAdmin, scoresController.updateTestScore);

module.exports = router;
