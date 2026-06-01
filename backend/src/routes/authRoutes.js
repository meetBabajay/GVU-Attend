const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT, isLecturer } = require('../middlewares/auth');

// Public route for signing in
router.post('/login', authController.login);

// Protected: Only lecturers can register/import students into the database
router.post('/register-student', authenticateJWT, isLecturer, authController.registerStudent);

// Protected: Retrieves profile details of currently logged-in user
router.get('/me', authenticateJWT, authController.me);

module.exports = router;
