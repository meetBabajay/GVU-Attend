const { User, Student, Department, Room, sequelize } = require('../models');

// GET /api/admin/rooms - List all rooms
exports.listRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      order: [['name', 'ASC']]
    });
    return res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/admin/rooms - Create a new room
exports.createRoom = async (req, res) => {
  const { name, latitude, longitude } = req.body;
  if (!name || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Missing required parameters: name, latitude, longitude' });
  }

  try {
    const room = await Room.create({ name, latitude, longitude });
    return res.status(201).json({ message: 'Room created successfully', room });
  } catch (error) {
    console.error('Error creating room:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'A room with this name already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/admin/rooms/:id - Update an existing room
exports.updateRoom = async (req, res) => {
  const { id } = req.params;
  const { name, latitude, longitude } = req.body;

  try {
    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (name) room.name = name;
    if (latitude !== undefined) room.latitude = latitude;
    if (longitude !== undefined) room.longitude = longitude;

    await room.save();
    return res.status(200).json({ message: 'Room updated successfully', room });
  } catch (error) {
    console.error('Error updating room:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/admin/rooms/:id - Delete a room
exports.deleteRoom = async (req, res) => {
  const { id } = req.params;

  try {
    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await room.destroy();
    return res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// GET /api/admin/students - List all students (excluding admins & lecturers)
exports.listStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
      order: [[{ model: User, as: 'user' }, 'fullName', 'ASC']]
    });
    // Map to simple objects
    const result = students.map(s => ({
      id: s.id,
      fullName: s.user?.fullName,
      email: s.user?.email,
      matricNumber: s.matricNumber,
      departmentId: s.departmentId,
      level: s.level
    }));
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/admin/lecturers - List all lecturers
exports.listLecturers = async (req, res) => {
  try {
    const lecturers = await User.findAll({
      where: { role: 'lecturer' },
      attributes: ['id', 'fullName', 'email']
    });
    return res.status(200).json(lecturers);
  } catch (error) {
    console.error('Error fetching lecturers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/admin/scoreboard - Get scoreboard for all students
exports.getScoreboard = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        { model: User, as: 'user', attributes: ['fullName', 'email'] },
        { model: require('../models').Score, as: 'score' }
      ]
    });
    const result = students.map(s => ({
      studentId: s.id,
      fullName: s.user?.fullName,
      email: s.user?.email,
      attendanceCount: s.score?.attendanceCount || 0,
      assignmentScore: s.score?.assignmentScore || 0,
      testScore: s.score?.testScore || 0,
      total: (s.score?.attendanceCount || 0) + (s.score?.assignmentScore || 0) + (s.score?.testScore || 0)
    }));
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching scoreboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/admin/score/:studentId - Update assignment or test scores for a student
exports.updateScore = async (req, res) => {
  const { studentId } = req.params;
  const { assignmentScore, testScore } = req.body;
  try {
    const score = await require('../models').Score.findOne({ where: { userId: studentId } });
    if (!score) {
      return res.status(404).json({ error: 'Score record not found for this student' });
    }
    if (assignmentScore !== undefined) score.assignmentScore = assignmentScore;
    if (testScore !== undefined) score.testScore = testScore;
    await score.save();
    return res.status(200).json({ message: 'Score updated successfully', score });
  } catch (error) {
    console.error('Error updating score:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/admin/db/schema - Return SQLite schema information
exports.getSchema = async (req, res) => {
  try {
    const [results] = await sequelize.query("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;");
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching schema:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
exports.getStats = async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalLecturers = await User.count({ where: { role: 'lecturer' } });
    const totalRooms = await Room.count();
    const totalPending = await User.count({ where: { isApproved: false } });

    return res.status(200).json({
      totalStudents,
      totalLecturers,
      totalRooms,
      totalPending
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
