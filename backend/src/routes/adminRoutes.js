const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateJWT, isAdmin } = require('../middlewares/auth');

// Apply admin authentication to all routes in this router
router.use(authenticateJWT, isAdmin);

// Rooms management
router.get('/students', adminController.listStudents);
router.get('/lecturers', adminController.listLecturers);
router.get('/scoreboard', adminController.getScoreboard);
router.put('/score/:studentId', adminController.updateScore);
router.get('/db/schema', adminController.getSchema);

module.exports = router;
