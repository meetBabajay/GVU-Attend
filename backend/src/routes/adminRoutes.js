const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateJWT, isAdmin } = require('../middlewares/auth');

// Apply admin authentication to all routes in this router
router.use(authenticateJWT, isAdmin);

// Stats overview
router.get('/stats', adminController.getStats);

// Users management
router.get('/students', adminController.listStudents);
router.get('/lecturers', adminController.listLecturers);

// Rooms management
router.get('/rooms', adminController.listRooms);
router.post('/rooms', adminController.createRoom);
router.put('/rooms/:id', adminController.updateRoom);
router.delete('/rooms/:id', adminController.deleteRoom);

// Scoreboard
router.get('/scoreboard', adminController.getScoreboard);
router.put('/score/:studentId', adminController.updateScore);

// Debug schema (Postgres-compatible)
router.get('/db/schema', adminController.getSchema);

module.exports = router;
